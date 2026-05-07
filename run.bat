@echo off
echo ===================================================
echo     STARTING JURIQ PLATFORM (IN TABS)
echo ===================================================

echo Resolving dynamic root directory: %~dp0
echo Launching Windows Terminal with 3 tabs...

wt new-tab -d "%~dp0." -p "Command Prompt" --title "Ollama Server" cmd /k "ollama serve" ; new-tab -d "%~dp0backend" -p "Command Prompt" --title "FastAPI Backend" cmd /k "call venv\Scripts\activate && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000" ; new-tab -d "%~dp0frontend" -p "Command Prompt" --title "React Frontend" cmd /k "npm run dev"

exit
