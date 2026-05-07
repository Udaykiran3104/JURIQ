# API Reference & Endpoints

This document outlines the REST API endpoints available in the FastAPI backend of JURIQ.

## 💬 Chat Endpoints

### `POST /chat`
The core RAG engine endpoint.
- **Payload**:
  ```json
  {
    "user_id": 1,
    "query": "What are my fundamental rights?",
    "session_id": "optional-uuid"
  }
  ```
- **Returns**: `ChatResponse` containing the dual-language answer, detected language, and source document citations.

### `GET /chat/sessions/{user_id}`
- **Description**: Retrieves a chronological list of all chat sessions for the specified user to populate the sidebar.

### `GET /chat/history/{session_id}`
- **Description**: Retrieves the full message history (user queries, bot answers, and sources) for a specific session to reconstruct the chat view.

### `DELETE /chat/sessions/{session_id}?user_id={user_id}`
- **Description**: Deletes a session and securely cascades the deletion to remove all linked messages from the database.

### `POST /chat/voice`
- **Description**: In-memory Text-to-Speech stream. Takes text and a language code (`en`, `hi`, `te`, `kn`), generates audio bytes using Microsoft Edge TTS, and returns it as an `audio/mpeg` byte stream playable in the browser.

### `POST /feedback`
- **Description**: Appends a user's Upvote/Downvote feedback directly into `backend/feedback.csv`.

---

## 🔐 Authentication Endpoints

### `POST /auth/request-otp`
- **Description**: Step 1 of the Auth flow. Validates the user, generates a 6-digit OTP, stores it temporarily with a 10-minute expiry, and emails it using `smtplib`.

### `POST /auth/verify-otp`
- **Description**: Step 2 of the Auth flow. Validates the 6-digit OTP. Upon success, returns a secure hexadecimal temporary token allowing the user to set a password.

### `POST /auth/set-password`
- **Description**: Step 3 of the Auth flow. Uses the temporary token from Step 2 to securely hash (bcrypt) and store a new user password.

### `POST /auth/login`
- **Description**: Traditional Email/Password login validation.

### `POST /auth/google`
- **Description**: Takes a Google OAuth Access Token, validates it with Google's UserInfo API, and creates/logs in the user to the local SQLite database.
