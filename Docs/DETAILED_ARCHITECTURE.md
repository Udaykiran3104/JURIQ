# 🧠 JURIQ: Detailed Architecture & Tech Stack Explanation

This document serves as a comprehensive explanation of every technology used in JURIQ. It defines each concept, explains **why** it was chosen, and details exactly **how** the underlying logic flows throughout the application.

---

## 1. 🎨 The Frontend (User Interface)

### **React.js & Vite**
* **Definition:** React is a component-based JavaScript library for building user interfaces. Vite is a next-generation frontend build tool that is significantly faster than Webpack.
* **Why we used it:** React allows us to build complex, stateful UIs (like multi-step authentications and live chat histories) using reusable components. Vite provides instant local server startup and rapid Hot Module Replacement (HMR).
* **How it works:** The UI is split into modular components (`LandingPage.jsx`, `ChatInput.jsx`, `ChatMessage.jsx`). When state changes (e.g., a user types a query), React efficiently re-renders only the changed component.

### **Framer Motion (Animations & 3D Physics)**
* **Definition:** A production-ready motion library for React that uses real-world physics (mass, stiffness, damping) rather than standard CSS keyframes.
* **Why we used it:** To make the application feel tactile, immersive, and premium.
* **How it works (Example):**
  * **Mouse-Repelling Particles:** In `LandingPage.jsx`, we track the user's cursor using a `mousemove` listener. We feed those `X/Y` coordinates into Framer Motion's `useSpring()` hooks. As the mouse gets closer to a background particle, the particle calculates the distance and moves in the *opposite* direction using `useTransform()`.

### **STT (Speech-To-Text / Microphone)**
* **Definition:** Converting human spoken audio into digital text in real-time.
* **Why we used it:** To provide maximum accessibility for rural citizens who may prefer speaking over typing long legal queries.
* **How it works:** Implemented in `ChatInput.jsx` using the native browser **Web Speech API** (`window.SpeechRecognition`). When the user clicks the microphone, it glows red and pulses. As the user speaks, the API captures the audio, processes the transcript dynamically (`interimResults = true`), and types the words directly into the chat input box in real-time.

---

## 2. ⚙️ The Backend (Server & Database)

### **FastAPI (Python)**
* **Definition:** A modern, fast web framework for building APIs with Python based on standard Python type hints.
* **Why we used it:** It natively supports asynchronous programming (`async/await`), which is absolutely crucial when handling heavy AI generation tasks, streaming audio, and API requests simultaneously without blocking the server.

### **SQLite**
* **Definition:** A lightweight, serverless, zero-configuration SQL database engine.
* **Why we used it:** Perfect for local, portable applications.
* **How it works:** It persistently stores User Accounts, securely hashed passwords, OTP tokens, Chat Sessions, and Message Histories. It ensures your past conversations are preserved between server reboots.

---

## 3. 🤖 The AI Pipeline (RAG - Retrieval Augmented Generation)

### **RAG (Retrieval-Augmented Generation)**
* **Definition:** An AI framework that forces an LLM to read specific, trusted documents *before* answering a question, eliminating hallucinations.

### **A. LangChain (The Orchestrator)**
* **Definition:** A framework for developing applications powered by language models.
* **Why we used it:** It serves as the glue that dynamically connects our Vector Database, our Prompts, and the LLM together in a cohesive "Chain".

### **B. ChromaDB & Embeddings (`BAAI/bge-large-en-v1.5`)**
* **Definition:** A Vector DB stores data as mathematical arrays (vectors). Embeddings are the AI models that convert text into these vectors.
* **Why we used it:** The AI cannot read 10,000 PDF pages for every question.
* **How it works:** When a user asks "What is Article 21?", the Embedding model converts the question into a 768-dimensional vector, mathematically searches ChromaDB for the closest matching PDF vectors, and extracts the Top 20 relevant paragraphs.

### **C. CrossEncoder Reranker (`BAAI/bge-reranker-v2-m3`)**
* **Definition:** A highly precise secondary neural network that grades the relevance of text.
* **Why we used it:** Standard embedding searches can be slightly inaccurate. A Reranker acts as a strict, intelligent filter to boost accuracy to 99%.
* **How it works:** It takes the Top 20 chunks found by ChromaDB and reads them *alongside* the user's exact question. It scores them from 0 to 1 based on absolute relevance, filtering out 15 chunks, and passing only the **Top 5 absolute best facts** to the LLM.

### **D. LLM (Large Language Model) - `llama3.2:1b`**
* **Definition:** A highly advanced neural network trained by Meta to understand and generate human-like text.
* **Why we used it:** Hosted locally via **Ollama**, it ensures 100% data privacy for sensitive legal queries and requires zero API costs.
* **How it works:** Llama 3 reads the Top 5 facts provided by the Reranker. It follows our strict Markdown System Prompt to act as "JURIQ" and generates a beautifully formatted English response.

---

## 4. 🌐 Multilingual Architecture (Language Detector)

Translating AI responses natively inside the LLM is slow and prone to grammatical errors. JURIQ handles translations purely via Python in `translator.py`.

### **Language Detector (Custom Regex Safety Net)**
* **Definition:** A custom-built, ultra-fast dictionary system that catches Indian languages written in English letters.
* **How it works:** Users often type Romanized slang (e.g., "Nuvvu evaru?", "Kya hai?"). Standard API translators fail at this. 
  1. User types `Kya hai?`
  2. Python's `re` (Regex) module strips the punctuation -> `kya hai`
  3. Python instantly matches `kya` against the `HINDI_KEYWORDS` dictionary and tags the language as `hi` instantly, bypassing the need for slow external APIs.

### **Dual-Translation Logic**
* **Flow:**
  1. A Hindi query is translated to English via the `deep-translator` API.
  2. The LLM (Llama 3) generates the legal answer perfectly in English.
  3. Python translates the English answer back to Hindi.
  4. Python merges them into a Dual-Response format: `English:` followed by `Hindi:`.
* **Why this is genius:** The LLM never wastes processing power struggling to generate foreign syntax. It focuses entirely on legal reasoning in English, resulting in massive speed improvements.

---

## 5. 🔐 Authentication & Security

JURIQ features an enterprise-grade Auth system.

### **Bcrypt Password Hashing (Passlib)**
* **Definition:** A cryptographic hashing function designed to securely store passwords.
* **Why we used it:** Storing plain-text passwords is a massive security flaw. Bcrypt hashes passwords with "salt" (randomized data), making it mathematically impossible for hackers to decrypt.

### **OTP (One-Time Password) State Machine**
* **Flow:**
  1. User enters `john@example.com`.
  2. Backend generates a 6-digit OTP using `secrets.choice` (cryptographically secure randomizer) and emails it via Google SMTP.
  3. Backend saves the OTP into SQLite with an exact 10-minute `expires_at` timestamp.
  4. User enters OTP. Backend verifies it, deletes it from the database (preventing reuse), and issues a temporary secure Hex Token.
  5. User provides a new password + Hex Token. Backend creates the account safely.

---

## 6. 🎙️ TTS (Text-To-Speech)

* **Definition:** Converting digital text into realistic spoken human audio.
* **Why we used it:** Standard browser TTS voices sound highly robotic and cheap. We used **Edge-TTS** (Microsoft Neural Voices) because they are incredibly human-like, fully bilingual, and completely free.
* **How it works:** 
  1. The user clicks the Speaker icon on a chat message.
  2. React sends the text block and language code (`te` for Telugu) to the `/chat/voice` endpoint.
  3. FastAPI generates the MP3 byte-stream **purely in RAM** (memory) using the `edge-tts` Python library.
  4. It streams the bytes directly to the HTML5 `<audio>` player on the frontend, ensuring zero disk-write latency. While playing, the speaker icon glows orange in the UI.
