import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Scale } from 'lucide-react';

const ChatInput = ({ value, onChange, onSend, isLoading, isWelcome = false }) => {
  const[isFocused, setIsFocused] = useState(false);

  // --- NEW STT LOGIC START ---
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // CHANGED: Now waits for manual stop instead of auto-stopping after a pause
      recognitionRef.current.interimResults = true; // Shows words as they speak
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        onChange(transcript);
      };

      recognitionRef.current.onerror = (error) => {
        console.error("Microphone error:", error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [onChange]);

  const toggleMicrophone = () => {
    if (!recognitionRef.current) {
      alert("Microphone not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      onChange(''); // Clear the box before new speech
      recognitionRef.current.start();
      setIsListening(true);
    }
  };
  // --- NEW STT LOGIC END ---



  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend(value);
    }
  };

  const handleSendClick = () => {
    onSend(value);
  };

  return (
    <motion.div
      initial={isWelcome ? {} : { y: 20, opacity: 0 }}
      animate={isWelcome ? {} : { y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      // Completely transparent outer wrapper so it blends with the app background
      className={`relative w-full z-40 bg-transparent ${isWelcome ? 'mb-6' : 'pb-6 pt-2 mt-auto'}`}
    >
      <div className={isWelcome ? 'w-full' : 'max-w-4xl mx-auto relative px-4 sm:px-6'}>



        <motion.div
          animate={{
            boxShadow: isListening 
              ? ['0 0 10px rgba(239, 68, 68, 0.4)', '0 0 20px rgba(239, 68, 68, 0.8)', '0 0 10px rgba(239, 68, 68, 0.4)']
              : isFocused
                ? '0 0 0 2px rgba(245, 130, 32, 0.4)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          transition={
            isListening 
              ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } 
              : { duration: 0.2 }
          }
          className={`relative flex items-end transition-all duration-300 rounded-[2rem] overflow-hidden bg-gray-50 dark:bg-doj-dark-tertiary border ${
            isListening 
              ? 'border-red-500' 
              : 'border-gray-300 dark:border-doj-dark-border'
          }`}
        >
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Type your legal query here..."
            className={`w-full bg-transparent border-none py-3.5 sm:py-4 pl-5 sm:pl-6 pr-24 focus:ring-0 resize-none text-gray-700 dark:text-doj-dark-text placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none ${
              isWelcome ? 'min-h-[56px] max-h-32' : 'max-h-32'
            }`}
            rows={1}
            disabled={isLoading}
          />

          {/* Unified Inline Buttons */}
          <div className="absolute right-2 bottom-1.5 sm:bottom-2 flex items-center gap-1 sm:gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleMicrophone}
              className={`p-2 rounded-full transition-colors ${
                isListening 
                  ? 'text-red-500 bg-red-100 dark:bg-red-900/30 animate-pulse' 
                  : 'text-gray-400 dark:text-gray-500 hover:text-doj-blue dark:hover:text-doj-orange hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              aria-label="Voice input"
            >
              <Mic size={18} />
            </motion.button>

            <motion.button
              whileHover={value.trim() && !isLoading ? { scale: 1.05 } : {}}
              whileTap={value.trim() && !isLoading ? { scale: 0.95 } : {}}
              onClick={handleSendClick}
              disabled={!value.trim() || isLoading}
              className={`p-2 rounded-full flex items-center justify-center transition-all duration-200 ${
                value.trim() && !isLoading
                  ? 'bg-doj-blue dark:bg-doj-blue text-white shadow-md'
                  : 'bg-gray-200 dark:bg-gray-600/50 text-gray-400 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Scale size={18} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="send"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Send size={18} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Footer Text for Active Chat Only */}
      {!isWelcome && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3 flex items-center justify-center gap-2"
        >
          <Scale size={12} />
          <span>Powered by AI • Information provided is for reference only.</span>
          <Scale size={12} />
        </motion.p>
      )}
    </motion.div>
  );
};

export default ChatInput;