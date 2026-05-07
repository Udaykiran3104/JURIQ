# Frontend Documentation

The JURIQ frontend is built using **React** and **Vite**, focusing heavily on a premium user experience, rich 3D aesthetics, and high performance.

## 🛠️ Technology Stack

- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS + Custom CSS (for scrollbar hiding and glassmorphism)
- **Animations**: `framer-motion` (Spring physics, Parallax scrolling, Layout animations)
- **Routing**: `react-router-dom`
- **Icons**: `lucide-react`
- **Markdown Rendering**: `react-markdown`

## 📂 Key Components

### 1. `LandingPage.jsx`
A full-page immersive 3D experience.
- **Scroll Parallax**: Video backgrounds that shift as the user scrolls.
- **Mouse-Repelling Particles**: A sophisticated `framer-motion` implementation where 12 floating justice icons scatter away from the user's cursor using `useSpring` and `useTransform`.
- **Magnetic Buttons**: Call-to-action buttons that physically "pull" toward the mouse on hover.
- **Typewriter Decoding Text**: The subtitle runs a Matrix-style "decoding" scramble animation via an Intersection Observer when scrolled into view.
- **Multilingual Support**: Uses dynamic CSS `clamp()` and height calculations to ensure Kannada, Telugu, and Hindi glyphs are never trimmed.

### 2. `AuthPage.jsx`
A robust, multi-step authentication state machine.
- **State 0 (Login)**: Standard email/password login or Google OAuth.
- **State 1 (Request OTP)**: Dynamic form handling for Email and Name registration.
- **State 2 (Verify OTP)**: 6-digit OTP validation.
- **State 3 (Set Password)**: Secure password creation workflow.

### 3. `ChatMessage.jsx`
The core conversational interface.
- **Bilingual Message Parsing**: Intelligently parses the backend's dual-language response into separate "English" and "Native Language" UI cards.
- **Text-to-Speech (TTS)**: Each message card has a dedicated "speaker" icon that streams high-quality Microsoft Edge Neural TTS audio. Active playback is visually indicated by an orange glowing aura.
- **Feedback Loop**: Integrated Thumbs Up/Down components linked to the backend `feedback.csv` logging system.
- **Sidebar History**: Dynamic session history that can be hidden or shown, with immediate optimistic UI updates on session deletion.

## 🚀 Setup & Execution

1. Navigate to the `frontend/` directory.
2. Ensure Node.js 18+ is installed.
3. Install dependencies: `npm install`
4. Run the development server: `npm run dev`
5. The UI will be available at `http://localhost:5173`.
