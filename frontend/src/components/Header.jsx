import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Scale, Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ProfileDropdown } from './ProfileDropdown';

import juriqLogo_DarkMode from '../JURIQ/JQ Logo Dark Mode.png';
import juriqLogo_WhiteMode from '../JURIQ/JQ Logo White Mode.png';



const Header = ({ showBackToHome = false, onBackToHome, onLogout, isSidebarOpen, onToggleSidebar, isTransparent }) => {
  const { isDark, toggleTheme } = useTheme();
  const emblemFilter = isDark
    ? 'brightness(0) invert(1) drop-shadow(0 0 2px rgba(255, 255, 255, 0.8))'
    : 'brightness(0) invert(0) drop-shadow(0 0 1px rgba(0, 0, 0, 0.2))';

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`z-40 sticky top-0 w-full transition-colors duration-300 ${
        isTransparent
          ? 'bg-transparent border-transparent shadow-none'
          : 'bg-white dark:bg-doj-dark-secondary shadow-sm border-b border-gray-200 dark:border-doj-dark-border backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95'
      }`}
    >
      <div className="w-full px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* The Open Sidebar Button (appears when sidebar is closed) */}
          {!isSidebarOpen && onToggleSidebar && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleSidebar}
              className={`p-2 -ml-2 rounded-lg transition-colors ${
                isTransparent 
                  ? 'text-gray-700 dark:text-doj-dark-text hover:bg-gray-200/50 dark:hover:bg-white/10' 
                  : 'text-gray-700 dark:text-doj-dark-text hover:bg-gray-200 dark:hover:bg-doj-dark-border'
              }`}
              title="Open sidebar"
            >
              <Menu size={24} />
            </motion.button>
          )}



        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            

          <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBackToHome}
          className="relative cursor-pointer"
        >
          <img 
            src={isDark ? juriqLogo_DarkMode : juriqLogo_WhiteMode} 
            alt="JURIQ Logo" 
            className="h-10 w-auto drop-shadow-md filter"
            // style={{ filter: emblemFilter }}
          />
        </motion.div>


            
          </motion.div>
          <div className="flex flex-col">
            <h1 className="text-doj-blue dark:text-doj-dark-text font-bold text-lg leading-tight">
              JURIQ
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide hidden sm:block">
              AI-Based Interactive ChatBot, Department of Justice
            </p>
          </div>
        </motion.div>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-md ${
              isTransparent 
                ? 'bg-orange-50/80 dark:bg-orange-900/20 border-orange-100/50 dark:border-orange-800/30 text-doj-orange dark:text-doj-orange backdrop-blur-sm'
                : 'bg-orange-50 dark:bg-orange-900/30 border-orange-100 dark:border-orange-800/50 text-doj-orange dark:text-doj-orange'
            }`}
          >
            <motion.div
              animate={{ rotate:[0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
              <Scale size={16} className="text-doj-orange" />
            </motion.div>
            <ShieldCheck size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">AI Legal Assistant</span>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors shadow-md ${
              isTransparent
                ? 'bg-white/80 dark:bg-doj-dark-tertiary/80 text-gray-700 dark:text-doj-dark-text hover:bg-white dark:hover:bg-doj-dark-border backdrop-blur-sm'
                : 'bg-gray-100 dark:bg-doj-dark-tertiary text-gray-700 dark:text-doj-dark-text hover:bg-gray-200 dark:hover:bg-doj-dark-border'
            }`}
            aria-label="Toggle dark mode"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Sun size={20} />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Moon size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <ProfileDropdown onLogout={onLogout} />
        </div>
      </div>
    </motion.header>
  );
};

export default Header;