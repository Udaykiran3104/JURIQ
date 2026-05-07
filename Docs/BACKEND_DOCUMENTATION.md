# Backend Documentation

The JURIQ backend is built on **FastAPI** and is designed to be highly scalable, secure, and completely localized for RAG (Retrieval-Augmented Generation) inference.

## 🏗️ Core Architecture

- **Web Framework**: FastAPI
- **Database**: SQLite (`chatbot.db`)
- **Vector Store**: ChromaDB
- **LLM Orchestration**: LangChain
- **Authentication**: JWT, Passlib (bcrypt), Google OAuth
- **Translation**: Deep-Translator + Custom Regex Keyword Safety Net

## 🧠 The RAG Pipeline (`rag_chain.py`)

JURIQ uses an advanced local RAG setup to guarantee zero hallucinations and data privacy.
1. **Embedding Model**: `BAAI/bge-large-en-v1.5` (Converts text to vectors).
2. **Base Retriever**: Fetches the top 20 relevant chunks from ChromaDB.
3. **Cross-Encoder Reranker**: `BAAI/bge-reranker-v2-m3` scores the 20 chunks and filters down to the Top 5 most relevant facts.
4. **LLM Engine**: Ollama running `llama3.2:1b` (or `llama3`).
5. **Prompting**: Uses a strictly structured Markdown template emphasizing zero-hallucination and layman explanations.

## 🗣️ Multilingual Support (`translator.py`)

JURIQ natively supports English, Hindi, Telugu, and Kannada.
- **Safety Net Detection**: Uses a custom ultra-fast keyword dictionary (using regex to strip punctuation) to detect common romanized words (e.g., "kya", "nuvvu", "hege").
- **Google API Fallback**: If no keywords match, it falls back to the Google Translate API.
- **Dual Translation**: The query is translated to English for the LLM to process. The LLM answers in English. The backend then translates the answer back to the native language and returns a dual-language response format (`English:` + `Native:`).

## 🔒 Security & Authentication (`security.py`)

- **Password Hashing**: Uses `passlib[bcrypt]` to securely hash passwords.
- **OTP Verification**: Generates secure 6-digit OTPs using `secrets.choice` and emails them via `smtplib`.
- **Session Tokens**: Temporary secure hex tokens are generated during the password reset/signup flow.

## 🚀 Setup & Execution

1. Ensure Python 3.10+ is installed.
2. Create and activate a virtual environment (`python -m venv venv`).
3. Install dependencies: `pip install -r requirements.txt`.
4. Ensure Ollama is running and has the required model (`ollama pull llama3.2:1b`).
5. Run the server: `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`.
