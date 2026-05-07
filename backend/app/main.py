from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Tuple, Optional, Literal
from app.rag_chain import get_rag_chain
from app.database import get_connection
from contextlib import asynccontextmanager
from app.security import get_password_hash, verify_password, generate_otp, send_otp_email, generate_secure_token
from app.translator import detect_language, translate_to_english, translate_to_native

from datetime import datetime, timedelta, timezone
import csv
from pathlib import Path
# from google.oauth2 import id_token
# from google.auth.transport import requests

import uuid
import json

import requests
import sqlite3


import edge_tts
from fastapi.responses import Response


# MUST BE AT THE VERY TOP OF main.py
import os
os.environ["ANONYMIZED_TELEMETRY"] = "False"

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
# ... rest of your imports ...

qa_chain = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global qa_chain
    print("Initializing RAG chain...")
    qa_chain = get_rag_chain()
    print("RAG chain ready.")
    yield
    # Clean up resources if needed upon shutdown

app = FastAPI(title="DoJ RAG Chatbot", lifespan=lifespan)


# ==========================================
# CRITICAL FIX: CORS MIDDLEWARE SETUP
# ==========================================
# This allows the React Frontend (running on a different port) to talk to this Backend.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*"  # Allow all for development convenience
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows POST, GET, OPTIONS, etc.
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    user_id: int
    query: str
    session_id: Optional[str] = None  # If None, the backend creates a new chat

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]
    detected_language: str
    session_id: str
    title: Optional[str] = None

class AuthToken(BaseModel):
    token: str

class AuthResponse(BaseModel):
    status: str
    user_id: int
    email: str
    name: str
    picture: Optional[str]
    has_password: bool  # ADD THIS LINE


# ==========================================
# AUTHENTICATION MODELS
# ==========================================
class OTPRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    purpose: Literal["signup", "reset", "set_password"]

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str
    purpose: str

class SetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str
    token: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str



class SessionResponse(BaseModel):
    id: str
    title: str
    updated_at: str

class MessageResponse(BaseModel):
    role: str
    content: str
    sources: Optional[List[str]] = []



class VoiceRequest(BaseModel):
    text: str
    language: str



class FeedbackRequest(BaseModel):
    timestamp: Optional[str] = None
    query: str
    answer: str
    feedback: Literal["up", "down"]
    sources: List[str] = []
    detected_language: Optional[str] = None
    client: Optional[str] = "web"

FEEDBACK_CSV_PATH = Path(__file__).resolve().parent.parent / "feedback.csv"


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    if not qa_chain:
        raise HTTPException(status_code=503, detail="RAG chain not initialized")
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # 1. Manage Session ID & Title
        is_new_session = False
        session_id = request.session_id
        title = None

        if not session_id:
            # Generate new session
            is_new_session = True
            session_id = str(uuid.uuid4())
            # Simple title generation (first 5 words)
            title = " ".join(request.query.split()[:5]) + "..."
            
            cursor.execute(
                "INSERT INTO chat_sessions (id, user_id, title) VALUES (?, ?, ?)",
                (session_id, request.user_id, title)
            )
        else:
            # Verify the session belongs to the user
            cursor.execute("SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?", (session_id, request.user_id))
            if not cursor.fetchone():
                raise HTTPException(status_code=403, detail="Session not found or access denied")

        # 2. Fetch Chat History for LangChain Context (Limit to last 6 messages / 3 turns)
        cursor.execute(
            "SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC", 
            (session_id,)
        )
        raw_history = cursor.fetchall()
        
        # Format for LangChain: [(user_msg, bot_msg), ...]
        formatted_history = []
        user_msg_temp = ""
        for row in raw_history[-6:]:  # Only take the last 6 messages to prevent token overflow
            if row['role'] == 'user':
                user_msg_temp = row['content']
            elif row['role'] == 'bot':
                formatted_history.append((user_msg_temp, row['content']))

        # 3. Detect Language & Translate
        detected_lang = detect_language(request.query)
        english_query = translate_to_english(request.query, detected_lang)

        # 4. Get Answer from RAG
        result = qa_chain.invoke({
            "question": english_query,
            "chat_history": formatted_history
        })
        english_answer = result["answer"]
        sources_list = [doc.metadata.get("source", "DoJ Document") for doc in result["source_documents"]]

        # 5. Translate Back to Native
        final_response_text = english_answer
        if detected_lang != 'en':
            native_answer = translate_to_native(english_answer, detected_lang)
            if detected_lang == 'hi':
                lang_name = "Hindi"
            elif detected_lang == 'te':
                lang_name = "Telugu"
            elif detected_lang == 'kn':
                lang_name = "Kannada"
            else:
                lang_name = "Native"
            final_response_text = f"English:\n{english_answer}\n\n{lang_name}:\n{native_answer}"

        # 6. Save Messages to Database
        # Save User Query
        cursor.execute(
            "INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'user', ?)",
            (session_id, request.query)
        )
        # Save Bot Answer
        cursor.execute(
            "INSERT INTO chat_messages (session_id, role, content, sources) VALUES (?, 'bot', ?, ?)",
            (session_id, final_response_text, json.dumps(sources_list))
        )
        # Update Session Timestamp
        cursor.execute("UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (session_id,))
        
        conn.commit()

        return ChatResponse(
            answer=final_response_text,
            sources=sources_list,
            detected_language=detected_lang,
            session_id=session_id,
            title=title if is_new_session else None
        )

    except Exception as e:
        conn.rollback()
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")
    finally:
        conn.close()



@app.get("/chat/sessions/{user_id}", response_model=List[SessionResponse])
def get_user_sessions(user_id: int):
    """Fetches all chat sessions for the sidebar, ordered by newest first"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id, title, updated_at FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC", 
            (user_id,)
        )
        sessions = cursor.fetchall()
        return [{"id": s['id'], "title": s['title'], "updated_at": s['updated_at']} for s in sessions]
    finally:
        conn.close()

@app.get("/chat/history/{session_id}", response_model=List[MessageResponse])
def get_session_history(session_id: str):
    """Fetches all messages for a specific session to display on the screen"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT role, content, sources FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC", 
            (session_id,)
        )
        messages = cursor.fetchall()
        
        history = []
        for msg in messages:
            sources = json.loads(msg['sources']) if msg['sources'] else []
            history.append({
                "role": msg['role'],
                "content": msg['content'],
                "sources": sources
            })
        return history
    finally:
        conn.close()
        
@app.delete("/chat/sessions/{session_id}")
def delete_session(session_id: str, user_id: int):
    """Deletes a chat session (Cascade delete will remove linked messages)"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM chat_sessions WHERE id = ? AND user_id = ?", (session_id, user_id))
        conn.commit()
        return {"status": "success", "message": "Session deleted"}
    finally:
        conn.close()




# ==========================================
# TEXT-TO-SPEECH (EDGE-TTS IN-MEMORY)
# ==========================================

VOICE_MAP = {
    "en": "en-IN-NeerjaNeural",
    "hi": "hi-IN-SwaraNeural",
    "te": "te-IN-ShrutiNeural",
    "kn": "kn-IN-SapnaNeural"  # NEW: Kannada Female Voice
}

@app.post("/chat/voice")
async def generate_voice(request: VoiceRequest):
    """
    Takes text and a language code, generates MP3 audio in RAM, 
    and returns it as a playable audio file to the frontend.
    """
    try:
        voice = VOICE_MAP.get(request.language, "en-IN-NeerjaNeural")
        communicate = edge_tts.Communicate(request.text, voice)
        
        # Gather all audio bytes into a memory buffer
        audio_buffer = bytearray()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.extend(chunk["data"])

        # --- DEBUGGING BLOCK (Uncomment to save a local MP3 file for testing) ---
        # debug_filepath = "debug_voice.mp3"
        # with open(debug_filepath, "wb") as f:
        #     f.write(audio_buffer)
        # print(f"Saved debug audio to: {debug_filepath}")
        # ------------------------------------------------------------------------
                
        # Send the complete byte buffer as an MP3 file
        return Response(content=bytes(audio_buffer), media_type="audio/mpeg")
        
    except Exception as e:
        print(f"TTS Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate audio stream")





@app.post("/feedback")
def feedback(request: FeedbackRequest):
    """
    Appends user feedback to backend/feedback.csv
    Columns: timestamp, query, answer, feedback, detected_language, sources, client
    """
    try:
        timestamp = request.timestamp or datetime.now(timezone.utc).isoformat()
        is_new_file = not FEEDBACK_CSV_PATH.exists()

        FEEDBACK_CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
        with FEEDBACK_CSV_PATH.open("a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            if is_new_file:
                writer.writerow([
                    "timestamp",
                    "query",
                    "answer",
                    "feedback",
                    "detected_language",
                    "sources",
                    "client",
                ])
            writer.writerow([
                timestamp,
                request.query,
                request.answer,
                request.feedback,
                request.detected_language or "",
                "|".join(request.sources or []),
                request.client or "",
            ])

        return {"status": "ok"}
    except Exception as e:
        print(f"Feedback error: {e}")
        raise HTTPException(status_code=500, detail=f"Error saving feedback: {str(e)}")


# ==========================================
# GOOGLE AUTHENTICATION ENDPOINT
# ==========================================
GOOGLE_CLIENT_ID = "325930103471-e9ms19jigm8isoc5lmuspe74jm7rfotv.apps.googleusercontent.com"


# ==========================================
# ADVANCED MULTI-STEP AUTHENTICATION
# ==========================================

@app.post("/auth/request-otp")
def request_otp(request: OTPRequest):
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM users WHERE email = ?", (request.email,))
        user = cursor.fetchone()
        
        final_purpose = request.purpose
        
        if request.purpose == "signup":
            if user:
                if user['password_hash']:
                    raise HTTPException(status_code=400, detail="Email already registered. Please log in.")
                elif user['google_id']:
                    # They exist via Google Auth but have no local password. Shift them to set_password flow.
                    final_purpose = "set_password"
                else:
                    # They started an email signup previously but didn't finish verifying.
                    # Update their name in case they typed it differently this time!
                    if request.name:
                        cursor.execute("UPDATE users SET name = ? WHERE email = ?", (request.name, request.email))
            else:
                if not request.name:
                    raise HTTPException(status_code=400, detail="Name is required for new signups")
                # Insert placeholder user (unverified, no password)
                cursor.execute(
                    "INSERT INTO users (email, name, is_verified) VALUES (?, ?, 0)",
                    (request.email, request.name)
                )
                
        elif request.purpose == "reset":
            if not user:
                raise HTTPException(status_code=404, detail="Email not found")
        
        # Generate and save OTP
        otp = generate_otp()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        
        cursor.execute(
            "REPLACE INTO otps (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)",
            (request.email, otp, final_purpose, expires_at)
        )
        conn.commit()
        
        # Send Contextual Email
        send_otp_email(request.email, otp, final_purpose)
        
        return {
            "status": "success", 
            "message": "OTP sent to email",
            "active_purpose": final_purpose # Tells frontend if we shifted to set_password
        }
    finally:
        conn.close()

@app.post("/auth/verify-otp")
def verify_otp(request: VerifyOTPRequest):
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "SELECT otp_code, expires_at FROM otps WHERE email = ? AND purpose = ?", 
            (request.email, request.purpose)
        )
        record = cursor.fetchone()
        
        if not record:
            raise HTTPException(status_code=400, detail="Invalid request or OTP expired")
            
        expires_at = datetime.fromisoformat(record['expires_at'])
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=400, detail="OTP has expired")
            
        if record['otp_code'] != request.otp:
            raise HTTPException(status_code=400, detail="Invalid OTP")
            
        # Success! Delete OTP and issue a secure token to allow password setting
        cursor.execute("DELETE FROM otps WHERE email = ? AND purpose = ?", (request.email, request.purpose))
        
        secure_token = generate_secure_token()
        token_expiry = datetime.now(timezone.utc) + timedelta(minutes=15)
        
        cursor.execute(
            "REPLACE INTO verification_tokens (email, token, expires_at) VALUES (?, ?, ?)",
            (request.email, secure_token, token_expiry)
        )
        conn.commit()
        
        return {
            "status": "success",
            "message": "OTP Verified",
            "token": secure_token # Frontend holds this temporarily to send with the new password
        }
    finally:
        conn.close()

@app.post("/auth/set-password")
def set_password(request: SetPasswordRequest):
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Verify the secure token
        cursor.execute("SELECT expires_at FROM verification_tokens WHERE email = ? AND token = ?", (request.email, request.token))
        record = cursor.fetchone()
        
        if not record:
            raise HTTPException(status_code=403, detail="Invalid or expired verification session")
            
        expires_at = datetime.fromisoformat(record['expires_at'])
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=403, detail="Session expired. Please request a new OTP.")
            
        # Hash and update password
        hashed_pwd = get_password_hash(request.new_password)
        
        cursor.execute(
            "UPDATE users SET password_hash = ?, is_verified = 1 WHERE email = ?",
            (hashed_pwd, request.email)
        )
        
        # Clean up the token
        cursor.execute("DELETE FROM verification_tokens WHERE email = ?", (request.email,))
        conn.commit()
        
        # Log them in automatically
        cursor.execute("SELECT id, name, picture FROM users WHERE email = ?", (request.email,))
        user = cursor.fetchone()
        
        return {
            "status": "success",
            "message": "Password set successfully",
            "user_id": user['id'],
            "email": request.email,
            "name": user['name'],
            "picture": user['picture'],
            "has_password": True  # ADD THIS LINE
        }
    finally:
        conn.close()

@app.post("/auth/login")
def login(request: LoginRequest):
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM users WHERE email = ?", (request.email,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=400, detail="Account not found")
            
        if not user['password_hash']:
            raise HTTPException(status_code=400, detail="This account is linked to Google. Please 'Continue with Google' or click 'Forgot Password' to set a local password.")
            
        if not verify_password(request.password, user['password_hash']):
            raise HTTPException(status_code=400, detail="Incorrect password")
            
        if not user['is_verified']:
            raise HTTPException(status_code=403, detail="Account pending verification")
            
        return {
            "status": "success",
            "user_id": user['id'],
            "email": user['email'],
            "name": user['name'],
            "picture": user['picture'],
            "has_password": True  # ADD THIS LINE
        }
    finally:
        conn.close()



# ==========================================
# GOOGLE AUTHENTICATION (UPDATED)
# ==========================================

@app.post("/auth/google", response_model=AuthResponse)
def google_auth(request: AuthToken):
    if not request.token:
        raise HTTPException(status_code=400, detail="Token is required")
    
    import requests # Ensure this is imported at the top of your file
    
    try:
        google_response = requests.get(
            f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={request.token}"
        )
        
        if google_response.status_code != 200:
            raise ValueError("Invalid or expired Access Token")
            
        user_info = google_response.json()
        google_id = user_info.get("sub")
        email = user_info.get("email")
        name = user_info.get("name")
        picture = user_info.get("picture")
        
        if not google_id or not email:
            raise HTTPException(status_code=400, detail="Missing required user information")
        
        conn = get_connection()
        cursor = conn.cursor()
        
        # Check if email exists (They might have signed up with email first, then used Google)
        # Check if email exists
        # CHANGE THIS LINE:
        cursor.execute("SELECT id, password_hash FROM users WHERE email = ?", (email,))
        existing_user = cursor.fetchone()
        
        has_pwd = False # Default to False
        
        if existing_user:
            user_id = existing_user['id']
            has_pwd = bool(existing_user['password_hash']) # Check if they have a local password
            cursor.execute(
                "UPDATE users SET google_id = ?, is_verified = 1, picture = ? WHERE email = ?",
                (google_id, picture, email)
            )
        else:
            # Entirely new user
            cursor.execute(
                """INSERT INTO users (google_id, email, name, picture, is_verified)
                   VALUES (?, ?, ?, ?, 1)""",
                (google_id, email, name, picture)
            )
            user_id = cursor.lastrowid
            
        conn.commit()
        conn.close()
        
        return AuthResponse(
            status="success",
            user_id=user_id,
            email=email,
            name=name,
            picture=picture,
            has_password=has_pwd # ADD THIS LINE
        )
        
    except ValueError as e:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")