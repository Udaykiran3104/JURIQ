import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { ThumbsUp, ThumbsDown, RotateCcw, User, Scale, Globe, Menu, Plus, MessageCircle, Sparkles, Gavel, BookOpen, FileText, Volume2, Square, Trash2 } from 'lucide-react'; import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import Header from './Header';
import ChatInput from './ChatInput';
import { TypingIndicator } from './TypingIndicator';

import juriqLogo_DarkMode from '../JURIQ/JQ Logo Dark Mode.png';
import juriqLogo_WhiteMode from '../JURIQ/JQ Logo White Mode.png';

const API_URL = 'http://localhost:8000';

export function ChatMessage({ message, previousUserMessage, onRetry }) {
  const isBot = message.role === 'bot';
  const { isDark } = useTheme();
  const emblemFilter = isDark
    ? 'brightness(0) invert(1) drop-shadow(0 0 2px rgba(255, 255, 255, 0.8))'
    : 'brightness(0) invert(0) drop-shadow(0 0 1px rgba(0, 0, 0, 0.18))';
  const [feedback, setFeedback] = React.useState(null); // 'up' | 'down' | null
  const [isSendingFeedback, setIsSendingFeedback] = React.useState(false);




  // --- UPDATED TTS LOGIC START ---
  const [playingBlockIndex, setPlayingBlockIndex] = React.useState(null);
  const [isAudioLoading, setIsAudioLoading] = React.useState(false);
  const audioRef = useRef(null);

  const handlePlayAudio = async (textToPlay, langCode, blockIndex) => {
    // If clicking the same playing button, stop it
    if (playingBlockIndex === blockIndex) {
      audioRef.current?.pause();
      setPlayingBlockIndex(null);
      return;
    }

    // Stop any currently playing audio before starting new one
    if (audioRef.current) {
      audioRef.current.pause();
    }

    setIsAudioLoading(true);
    setPlayingBlockIndex(blockIndex);

    try {
      const response = await axios.post(`${API_URL}/chat/voice`, {
        text: textToPlay,
        language: langCode
      }, {
        responseType: 'blob'
      });

      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => setPlayingBlockIndex(null);
      audio.play();
    } catch (error) {
      console.error("Failed to fetch audio:", error);
      setPlayingBlockIndex(null);
    } finally {
      setIsAudioLoading(false);
    }
  };
  // --- UPDATED TTS LOGIC END ---



  const messageVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };



  // --- NEW: SPLIT BILINGUAL TEXT INTO BLOCKS ---
  // --- ROBUST BILINGUAL TEXT PARSING (ADDED KANNADA) ---
  const getMessageBlocks = () => {
    if (!isBot) return [{ title: null, text: message.content, lang: 'en' }];

    const content = message.content;
    const blocks = [];

    // Catch variations of Hindi/Telugu/Kannada labels
    const hasEnglish = content.includes("English:");
    const hasTelugu = content.includes("Telugu:");
    const hasHindi = content.includes("Hindi:") || content.includes("हिंदी:");
    const hasKannada = content.includes("Kannada:") || content.includes("ಕನ್ನಡ:");

    if (hasEnglish && (hasTelugu || hasHindi || hasKannada)) {
      let splitToken = hasTelugu ? "Telugu:" :
        (hasKannada ? (content.includes("Kannada:") ? "Kannada:" : "ಕನ್ನಡ:") :
          (content.includes("Hindi:") ? "Hindi:" : "हिंदी:"));

      const parts = content.split(splitToken);
      const engText = parts[0].replace("English:", "").trim();
      const nativeText = parts[1].trim();

      // Determine the correct title and language code
      let nativeTitle = hasTelugu ? "Telugu" : (hasKannada ? "Kannada" : "Hindi");
      let nativeLangCode = message.language || (hasTelugu ? 'te' : (hasKannada ? 'kn' : 'hi'));

      blocks.push({ title: "English", text: engText, lang: "en" });
      blocks.push({
        title: nativeTitle,
        text: nativeText,
        lang: nativeLangCode
      });
    } else {
      // FIX: Always assign a title to single-language responses so the TTS button shows!
      let titleName = "English";
      if (message.language === 'hi') titleName = "Hindi";
      if (message.language === 'te') titleName = "Telugu";
      if (message.language === 'kn') titleName = "Kannada";

      blocks.push({ title: titleName, text: content, lang: message.language || "en" });
    }
    return blocks;
  };

  const messageBlocks = getMessageBlocks();



  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={messageVariants}
      className={`flex gap-4 ${isBot ? 'justify-start' : 'justify-end'}`}
    >
      {/* Bot Icon */}
      {isBot && (
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-doj-blue to-blue-800 dark:from-doj-blue dark:to-blue-900 flex items-center justify-center flex-shrink-0 shadow-lg relative"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
            alt="Bot"
            className="w-6 h-6 filter"
            style={{
              filter: emblemFilter,
            }}
          />
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-doj-dark"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      )}

      <div className={`flex flex-col max-w-[90%] md:max-w-[85%] ${isBot ? 'items-start' : 'items-end'}`}>

        {/* Render Cards */}
        <div className={`flex flex-col gap-4 w-full ${!isBot ? 'items-end' : ''}`}>
          {messageBlocks.map((block, idx) => (
            <motion.div
              key={idx}
              className={`p-4 md:p-5 shadow-md relative w-full ${isBot
                  ? 'bg-white dark:bg-doj-dark-secondary border border-gray-200 dark:border-doj-dark-border text-gray-800 dark:text-doj-dark-text rounded-2xl rounded-tl-none'
                  : 'bg-gradient-to-br from-doj-blue to-blue-700 dark:from-doj-blue dark:to-blue-800 text-white rounded-2xl rounded-tr-none w-auto inline-block'
                }`}
            >
              {/* Card Header (Title + Speaker Button) */}
              {isBot && (
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="font-semibold text-sm text-doj-blue dark:text-doj-orange uppercase tracking-wider">
                    {block.title}
                  </span>

                  {/* DEDICATED SPEAKER BUTTON FOR THIS CARD */}
                  <button
                    onClick={() => handlePlayAudio(block.text, block.lang, idx)}
                    className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${playingBlockIndex === idx
                        ? 'bg-doj-orange/20 text-doj-orange'
                        : 'text-gray-400 hover:text-doj-blue hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    title={`Listen in ${block.title}`}
                  >
                    {isAudioLoading && playingBlockIndex === idx ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <RotateCcw size={16} />
                      </motion.div>
                    ) : playingBlockIndex === idx ? (
                      <Square size={16} fill="currentColor" />
                    ) : (
                      <Volume2 size={16} />
                    )}
                  </button>
                </div>
              )}

              {/* Markdown Content */}
              <div className={`prose prose-sm md:prose-base max-w-none ${!isBot ? 'prose-invert' : 'dark:prose-invert'} prose-p:leading-relaxed prose-li:my-1`}>
                <ReactMarkdown>{block.text}</ReactMarkdown>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Error retry */}
        {isBot && message.isError && message.retry && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => onRetry?.(message.retry)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-doj-blue text-white text-sm font-semibold shadow hover:opacity-95 transition"
            >
              <RotateCcw size={16} />
              Retry
            </button>
          </div>
        )}

        {/* Unified Feedback Buttons at the VERY BOTTOM */}
        {isBot && !message.isError && previousUserMessage?.role === 'user' && (
          <div className="mt-3 flex items-center gap-2">
            <button
              disabled={isSendingFeedback}
              onClick={async () => { /* Your existing upvote logic */ }}
              className={`p-2 rounded-full border shadow-sm transition ${feedback === 'up'
                  ? 'bg-green-100 border-green-300 text-green-700'
                  : 'bg-white dark:bg-doj-dark-secondary border-gray-200 dark:border-doj-dark-border text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                }`}
            >
              <ThumbsUp size={16} />
            </button>
            <button
              disabled={isSendingFeedback}
              onClick={async () => { /* Your existing downvote logic */ }}
              className={`p-2 rounded-full border shadow-sm transition ${feedback === 'down'
                  ? 'bg-red-100 border-red-300 text-red-700'
                  : 'bg-white dark:bg-doj-dark-secondary border-gray-200 dark:border-doj-dark-border text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                }`}
            >
              <ThumbsDown size={16} />
            </button>
          </div>
        )}

      </div>

      {/* User Icon */}
      {!isBot && (
        <motion.div
          whileHover={{ scale: 1.1, rotate: -5 }}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-doj-orange to-orange-600 dark:from-doj-orange dark:to-orange-700 flex items-center justify-center flex-shrink-0 shadow-lg"
        >
          <User size={20} className="text-white" />
        </motion.div>
      )}
    </motion.div>
  );
}

// Individual Chat Message Component
function MessageBubble({ message, previousUserMessage, onRetry }) {
  return <ChatMessage message={message} previousUserMessage={previousUserMessage} onRetry={onRetry} />;
}

// Main Chat Interface Component
// Main Chat Interface Component
export function ChatInterface({ initialQuery = null, onBackToHome }) {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // NEW: Sidebar & Memory States
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  // --- MULTILINGUAL TYPOGRAPHY STATE ---
  const [titleIndex, setTitleIndex] = useState(0);
  const titles = ["JURIQ", "ज्यूरिक", "జ్యూరిక్", "ಜ್ಯೂರಿಕ್"];

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % titles.length);
    }, 3000); // Cycles language every 3 seconds
    return () => clearInterval(interval);
  }, []);
  // -------------------------------------


  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  const emblemFilter = isDark
    ? 'brightness(0) invert(1) drop-shadow(0 0 3px rgba(255, 255, 255, 0.9))'
    : 'brightness(0) invert(0) drop-shadow(0 0 2px rgba(0, 0, 0, 0.18))';

  const suggestedQuestions = [
    { text: "What are my legal rights?", icon: Scale },
    { text: "How do I file a complaint?", icon: FileText },
    { text: "What is the appeal process?", icon: Gavel },
    { text: "Where can I find legal resources?", icon: BookOpen }
  ];

  // Helper to safely get the user ID
  const getUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };
  const user = getUser();

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch Sidebar Sessions on Mount
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user?.user_id) return;
      try {
        const res = await axios.get(`${API_URL}/chat/sessions/${user.user_id}`);
        setSessions(res.data);
      } catch (err) {
        console.error("Failed to load sessions:", err);
      }
    };
    fetchSessions();
  }, [user?.user_id]);

  // Fetch Chat History when a session is selected
  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentSessionId) {
        setMessages([]); // Welcome state
        return;
      }
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_URL}/chat/history/${currentSessionId}`);
        // Map backend response to frontend format
        const formattedMessages = res.data.map((msg, index) => ({
          id: Date.now() + index,
          role: msg.role,
          content: msg.content,
          sources: msg.sources || [],
        }));
        setMessages(formattedMessages);
      } catch (err) {
        console.error("Failed to load history:", err);
        setError("Failed to load previous messages.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [currentSessionId]);

  // If initial query provided, send it automatically
  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  // Handle sending message
  const handleSendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    if (!user?.user_id) {
      setError("You must be logged in to send messages.");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const timestamp = Date.now();

    const userMessage = {
      id: timestamp,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError('');

    try {
      // NEW: Updated API Payload for the Memory System
      const response = await axios.post(`${API_URL}/chat`, {
        user_id: parseInt(user.user_id),
        query: messageText,
        session_id: currentSessionId
      }, {
        signal: abortController.signal
      });

      const botMessage = {
        id: timestamp + 1,
        role: 'bot',
        content: response.data.answer,
        sources: response.data.sources || [],
        language: response.data.detected_language || null,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);

      // NEW: If this was the first message, update the session ID and refresh sidebar
      if (!currentSessionId && response.data.session_id) {
        setCurrentSessionId(response.data.session_id);
        const res = await axios.get(`${API_URL}/chat/sessions/${user.user_id}`);
        setSessions(res.data);
      }

    } catch (err) {
      if (axios.isCancel(err)) {
        return;
      }

      const errorMessageBubble = {
        id: timestamp + 1,
        role: 'bot',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        isError: true,
        timestamp: new Date(),
        retry: messageText,
      };

      setMessages(prev => [...prev, errorMessageBubble]);

      // FIX: Safe Error Parsing to prevent the React Array Crash
      const detail = err.response?.data?.detail;
      const safeErrorMessage = Array.isArray(detail) ? detail[0].msg : (detail || 'Failed to send message');
      setError(safeErrorMessage);

    } finally {
      if (abortControllerRef.current === abortController) {
        setIsLoading(false);
      }
    }
  };

  const handleRetry = (messageText) => {
    handleSendMessage(messageText);
  };

  const handleNewChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Set current session to null to trigger the Welcome Screen
    setCurrentSessionId(null);
    setMessages([]);
    setInputValue('');
    setError('');
    setIsLoading(false);
  };

  const handleSelectSession = (id) => {
    setCurrentSessionId(id);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false); // Auto-close sidebar on mobile after selection
    }
  };




  // --- NEW DELETE SESSION LOGIC ---
  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation(); // Prevents the parent button's onClick (handleSelectSession) from firing

    if (!user?.user_id) return;

    // Optimistically remove it from the sidebar UI immediately for a snappy feel
    setSessions(prev => prev.filter(s => s.id !== sessionId));

    // If the user deletes the chat they are currently looking at, clear the screen
    if (currentSessionId === sessionId) {
      handleNewChat();
    }

    try {
      await axios.delete(`${API_URL}/chat/sessions/${sessionId}`, {
        params: { user_id: parseInt(user.user_id) } // Pass user_id as a query param
      });
    } catch (err) {
      console.error("Failed to delete session:", err);
      // Optional: If it fails, you could re-fetch the sessions here to restore the deleted item
    }
  };
  // --------------------------------




  const handleSuggestionClick = (question) => {
    handleSendMessage(question);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const isWelcomeState = messages.length === 0;

  return (
    <div className="flex h-screen w-full bg-white dark:bg-doj-dark overflow-hidden">
      {/* LEFT SIDEBAR - Fixed */}
      <motion.div
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0 }}
        style={{ width: isSidebarOpen ? 280 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-shrink-0 overflow-hidden bg-gray-50 dark:bg-doj-dark-secondary/80 border-r border-gray-200 dark:border-doj-dark-border backdrop-blur-sm flex flex-col h-full z-50"
      >
        <div className="flex-shrink-0 p-3 flex items-center justify-between gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSidebarOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-700 dark:text-doj-dark-text hover:bg-gray-200 dark:hover:bg-doj-dark-border transition-colors -ml-1"
            title="Close sidebar"
          >
            <Menu size={20} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNewChat}
            className="flex-1 flex items-center justify-between px-3 py-2 bg-transparent hover:bg-gray-200 dark:hover:bg-doj-dark-border rounded-lg text-gray-700 dark:text-doj-dark-text font-medium text-sm transition-colors"
            title="Start new chat"
          >
            <span>New Chat</span>
            <Plus size={18} />
          </motion.button>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 no-scrollbar">
          <div className="px-5 py-2">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Recent
            </h4>
          </div>

          <div className="px-3 space-y-0.5">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <motion.div
                  key={session.id}
                  className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-full transition-colors text-sm cursor-pointer ${currentSessionId === session.id
                      ? 'bg-gray-200 dark:bg-doj-dark-border'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'
                    }`}
                  onClick={() => handleSelectSession(session.id)}
                >
                  <div className={`flex items-center gap-3 overflow-hidden ${currentSessionId === session.id
                      ? 'text-doj-blue dark:text-doj-orange'
                      : 'text-gray-700 dark:text-gray-300'
                    }`}>
                    <MessageCircle size={16} className={`flex-shrink-0 ${currentSessionId === session.id ? 'text-doj-blue dark:text-doj-orange' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis capitalize">
                      {session.title}
                    </span>
                  </div>

                  {/* NEW TRASH BUTTON */}
                  <button
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all flex-shrink-0"
                    title="Delete Chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="px-4 py-4 text-xs text-gray-400 dark:text-gray-500">
                No conversations yet
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen relative overflow-hidden bg-transparent">
        <Header
          showBackToHome={true}
          onBackToHome={onBackToHome}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(true)}
          isTransparent={true}
        />

        {isWelcomeState ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 w-full max-w-4xl mx-auto overflow-y-auto no-scrollbar"
          >
            <motion.div variants={itemVariants} className="relative mb-4 md:mb-6">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative inline-block"
              >
                {/* <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
                  alt="Emblem" 
                  className="w-16 h-16 md:w-20 md:h-20 mx-auto drop-shadow-2xl filter"
                  style={{ filter: emblemFilter }}
                /> */}



                <img
                  src={isDark ? juriqLogo_DarkMode : juriqLogo_WhiteMode}
                  alt="Emblem"
                  className="w-24 h-24 md:w-32 md:h-32 mx-auto drop-shadow-2xl filter"
                />



              </motion.div>
            </motion.div>

            {/* Animated Multilingual Title Container */}
            <motion.div variants={itemVariants} className="relative h-12 md:h-16 w-full max-w-lg flex justify-center items-center mb-2 md:mb-4">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={titleIndex}
                  initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute py-2 leading-tight w-full text-center whitespace-nowrap text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-doj-blue via-doj-orange to-doj-blue dark:from-doj-dark-text dark:via-doj-orange dark:to-doj-dark-text bg-clip-text text-transparent drop-shadow-sm"
                  style={{ backgroundSize: '200% auto' }}
                >
                  {titles[titleIndex]}
                </motion.h1>
              </AnimatePresence>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center mb-6 md:mb-8 max-w-2xl">
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-1 md:mb-2">
                Welcome to the Department of Justice AI Assistant.
              </p>
              <p className="text-doj-blue dark:text-doj-orange font-semibold text-sm md:text-base">
                Get instant, accurate answers grounded in official legal documents.
              </p>
            </motion.div>



            <motion.div variants={itemVariants} className="w-full max-w-3xl">
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSendMessage}
                isLoading={isLoading}
                isWelcome={true}
              />
            </motion.div>

            <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full max-w-3xl">
              {suggestedQuestions.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={index}
                    variants={itemVariants}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSuggestionClick(item.text)}
                    className="group bg-white dark:bg-doj-dark-secondary border border-gray-200 dark:border-doj-dark-border rounded-xl shadow-sm hover:shadow-md hover:border-doj-orange dark:hover:border-doj-orange transition-all text-left relative overflow-hidden p-3 md:p-4"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-doj-blue/5 to-doj-orange/5 dark:from-doj-blue/10 dark:to-doj-orange/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center md:items-start gap-3">
                      <div className="p-2 bg-doj-blue/10 dark:bg-doj-orange/20 rounded group-hover:bg-doj-orange/20 dark:group-hover:bg-doj-orange/30 transition-colors flex-shrink-0">
                        <Icon className="w-4 h-4 md:w-5 md:h-5 text-doj-blue dark:text-doj-orange" />
                      </div>
                      <span className="text-xs md:text-sm text-gray-700 dark:text-doj-dark-text font-medium flex-1 group-hover:text-doj-blue dark:group-hover:text-doj-orange transition-colors line-clamp-2 md:mt-0.5">
                        {item.text}
                      </span>
                    </div>
                  </motion.button>
                );
              })}

            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center gap-2 text-xs md:text-sm text-gray-500 dark:text-gray-400 pt-8 mb-6"
            >
              <Scale className="w-3 h-3 md:w-4 md:h-4" />
              <span>Powered by AI • Trusted Legal Information</span>
              <Scale className="w-3 h-3 md:w-4 md:h-4" />
            </motion.div>




          </motion.div>

        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-8 space-y-6 bg-transparent no-scrollbar">
            <AnimatePresence mode="popLayout">
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  previousUserMessage={idx > 0 ? messages[idx - 1] : null}
                  onRetry={handleRetry}
                />
              ))}
            </AnimatePresence>


            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex justify-start"
              >
                <div className="bg-gray-100 dark:bg-doj-dark-secondary text-gray-800 dark:text-doj-dark-text rounded-2xl rounded-tl-none px-4 py-3 border border-gray-200 dark:border-doj-dark-border">
                  <TypingIndicator />
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm max-w-md text-center"
              >
                {error}
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {!isWelcomeState && (
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSendMessage}
            isLoading={isLoading}
            isWelcome={false}
          />
        )}
      </div>
    </div>
  );
}