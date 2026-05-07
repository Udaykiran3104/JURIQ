# ⚖️ JURIQ: Department of Justice AI Legal Assistant

![JURIQ Banner](https://img.shields.io/badge/JURIQ-AI_Legal_Assistant-1A365D?style=for-the-badge)<br>
![Status](https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge)<br>
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20FastAPI%20%7C%20LangChain%20%7C%20Ollama-blue?style=for-the-badge)

JURIQ is a state-of-the-art, highly interactive, multilingual legal assistant powered by a local **Retrieval-Augmented Generation (RAG)** pipeline. Built for the citizens of India, it provides accurate, hallucination-free legal intelligence completely offline (using Ollama and Llama 3) across multiple Indian languages.

---

## 🌟 Key Features

1. **Multilingual Intelligence**: Ask questions in English, Hindi, Telugu, or Kannada. JURIQ auto-detects the language using a hyper-fast custom dictionary, translates it, queries the legal database in English, and responds natively in your language.
2. **Local RAG Pipeline (Zero Hallucination)**: Uses **LangChain**, **ChromaDB**, and a **HuggingFace CrossEncoder Reranker** to fetch only verified legal documents from the Department of Justice before answering.
3. **Immersive 3D UI**: The frontend features a stunning Glassmorphic design, magnetic call-to-action buttons, mouse-repelling 3D justice particles, and a cinematic typing reveal powered by `framer-motion`.
4. **Voice Accessible (Edge TTS)**: Listen to any AI-generated response out loud. JURIQ dynamically streams Microsoft Edge Neural TTS audio into your browser natively in English, Hindi, Telugu, and Kannada voices.
5. **Robust Authentication**: Supports Google OAuth, email-based OTP verification, and secure password hashing using bcrypt.

---

## 🏗️ Architecture Stack

### Frontend (User Interface)
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS + Vanilla CSS (No generic component libraries)
- **Animations**: Framer Motion (Spring physics, 3D Tilt, Scroll Parallax)
- **Icons**: Lucide React
- **Markdown**: `react-markdown`

### Backend (API & AI)
- **Server**: FastAPI + SQLite (Persistent session tracking & feedback)
- **LLM Engine**: Ollama (Running `llama3.2:1b` locally)
- **Embeddings**: `BAAI/bge-large-en-v1.5` (via HuggingFace)
- **Reranker**: `BAAI/bge-reranker-v2-m3` (via CrossEncoder)
- **Vector DB**: ChromaDB

> [!IMPORTANT]
> ### 📂 Official Knowledge Base
> All legal intelligence is powered by a curated dataset of official Indian Department of Justice PDFs.
> <br>
> [![Open Google Drive](https://img.shields.io/badge/View_Legal_Dataset-Google_Drive-4285F4?style=for-the-badge&logo=googledrive&logoColor=white)](https://drive.google.com/drive/folders/1v_GfxZmXoWz_045rSxHg8Uvjr3rS8Zhr?usp=sharing)

---

## 📚 Detailed Documentation

For a deep dive into the specific components of this project, please refer to the dedicated files in the `Docs/` directory:
- 📑 [Backend Architecture & RAG Setup](./Docs/BACKEND_DOCUMENTATION.md)
- 🎨 [Frontend Architecture & UI Design](./Docs/FRONTEND_DOCUMENTATION.md)
- 🔌 [REST API Endpoint Reference](./Docs/API_DOCUMENTATION.md)

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v18+)
- **Python** (3.10+)
- **Ollama** (You must run `ollama pull llama3.2:1b` before starting)

### 2. Environment Variables
In the `backend/` folder, create a `.env` file for OTP emails to work:
```env
SMTP_EMAIL=your_email@gmail.com
SMTP_APP_PASSWORD=your_google_app_password
```

### 3. One-Click Launch (Windows)
We have provided an automated script to launch the entire platform effortlessly.
1. Double click the **`run.bat`** file located in the root directory.
2. It will automatically open **Windows Terminal** with 3 separate tabs:
   - Tab 1: Starts the Ollama LLM Server.
   - Tab 2: Activates the Python virtual environment and starts the FastAPI Backend (`http://127.0.0.1:8000`).
   - Tab 3: Starts the Vite React Frontend (`http://localhost:5173`).
3. Open your browser to `http://localhost:5173` and enjoy!

*(If you are on Linux/Mac, you will need to manually start `ollama serve`, `uvicorn app.main:app`, and `npm run dev` in three terminals).*

---

## 🧠 The AI Pipeline Workflow

1. **User Query**: User types "నాకు ఉన్న చట్టపరమైన హక్కులు ఏమిటి?" (Telugu).
2. **Translation**: `translator.py` auto-detects Telugu and safely translates it to English.
3. **Retrieval**: LangChain embeds the query and fetches the top 20 relevant chunks from ChromaDB.
4. **Reranking**: The CrossEncoder strictly scores the chunks, keeping only the absolute top 5 most relevant legal facts.
5. **Generation**: Ollama (Llama 3) reads the 5 chunks and drafts an English response following a strict Markdown structure.
6. **Dual-Response**: The backend translates the English output back to Telugu, delivering both versions simultaneously to the user.

---

## 🛡️ License & Disclaimers
Built for the **Major Project 2025-26**. 
*Disclaimer: JURIQ is an AI assistant and does not constitute formal legal counsel. Always consult a verified attorney for official legal proceedings.*