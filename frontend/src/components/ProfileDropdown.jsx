import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, Lock, Mail, AlertCircle, CheckCircle, Eye, EyeOff, Loader } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const API_URL = 'http://localhost:8000';

// Safe error extraction to handle both string and array errors
const extractErrorMessage = (errorData) => {
  if (typeof errorData === 'string') {
    return errorData;
  }
  if (Array.isArray(errorData)) {
    return errorData[0]?.msg || errorData[0]?.detail || 'An error occurred';
  }
  return 'An error occurred';
};

export function ProfileDropdown({ onLogout }) {
  const { user, logout, saveUser } = useAuth();
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Password Modal States
  const [modalState, setModalState] = useState(0); // 0: Init, 1: OTP, 2: NewPassword
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [modalFormData, setModalFormData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });

  const clearModalMessages = useCallback(() => {
    setModalError('');
    setModalSuccess('');
  }, []);

  // Password Management Handlers
  const handleOpenPasswordModal = () => {
    setModalState(0);
    setModalFormData({ otp: '', newPassword: '', confirmPassword: '' });
    clearModalMessages();
    setVerificationToken(null);
    setShowPasswordModal(true);
    setIsOpen(false);
  };

  const handleSendCode = async () => {
    setModalLoading(true);
    clearModalMessages();

    try {
      const response = await axios.post(`${API_URL}/auth/request-otp`, {
        email: user.email,
        purpose: 'reset',
      });

      setModalSuccess('OTP sent to your email. Check your inbox.');
      setTimeout(() => {
        setModalState(1);
        clearModalMessages();
      }, 800);
    } catch (err) {
      const errorDetail = err.response?.data?.detail;
      const errorMessage = extractErrorMessage(errorDetail);
      setModalError(errorMessage);
    } finally {
      setModalLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!modalFormData.otp || modalFormData.otp.length !== 6) {
      setModalError('Please enter a valid 6-digit OTP');
      return;
    }

    setModalLoading(true);
    clearModalMessages();

    try {
      const response = await axios.post(`${API_URL}/auth/verify-otp`, {
        email: user.email,
        otp: modalFormData.otp,
        purpose: 'reset',
      });

      setVerificationToken(response.data.token);
      setModalSuccess('OTP verified! Set your new password.');
      setTimeout(() => {
        setModalState(2);
        clearModalMessages();
      }, 800);
    } catch (err) {
      const errorDetail = err.response?.data?.detail;
      const errorMessage = extractErrorMessage(errorDetail);
      setModalError(errorMessage);
    } finally {
      setModalLoading(false);
    }
  };

  const handleSetNewPassword = async () => {
    if (!modalFormData.newPassword || !modalFormData.confirmPassword) {
      setModalError('Both password fields are required');
      return;
    }

    if (modalFormData.newPassword.length < 6) {
      setModalError('Password must be at least 6 characters');
      return;
    }

    if (modalFormData.newPassword !== modalFormData.confirmPassword) {
      setModalError('Passwords do not match');
      return;
    }

    setModalLoading(true);
    clearModalMessages();

    try {
      const response = await axios.post(`${API_URL}/auth/set-password`, {
        email: user.email,
        new_password: modalFormData.newPassword,
        token: verificationToken,
      });

      // Update user data with new has_password flag
      const updatedUser = {
        ...user,
        has_password: true,
      };
      saveUser(updatedUser);

      setModalSuccess('Password updated successfully!');
      setTimeout(() => {
        setShowPasswordModal(false);
        setModalState(0);
        clearModalMessages();
      }, 1000);
    } catch (err) {
      const errorDetail = err.response?.data?.detail;
      const errorMessage = extractErrorMessage(errorDetail);
      setModalError(errorMessage);
    } finally {
      setModalLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div ref={dropdownRef} className="relative z-50">
      {/* Profile Picture Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-doj-blue dark:border-doj-orange overflow-hidden hover:shadow-lg transition-shadow"
        title="Open user menu"
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-6 h-6 text-doj-blue dark:text-doj-orange" />
        )}
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-64 bg-white dark:bg-doj-dark-secondary rounded-lg shadow-xl border border-gray-200 dark:border-doj-dark-border overflow-hidden"
          >
            {/* User Info Section */}
            <div className="p-4 border-b border-gray-200 dark:border-doj-dark-border bg-gray-50 dark:bg-doj-dark-secondary/50">
              <p className="text-sm font-semibold text-gray-900 dark:text-doj-dark-text truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>

            {/* Phone Number Placeholder
            <div className="px-4 py-3 border-b border-gray-200 dark:border-doj-dark-border">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Phone Number</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Not provided
              </p>
            </div> */}

            {/* Password Management Button */}
            <motion.button
              onClick={handleOpenPasswordModal}
              whileHover={{ backgroundColor: isDark ? '#1a2b3d' : '#f3f4f6' }}
              className="w-full px-4 py-3 flex items-center gap-2 text-sm font-semibold text-doj-blue dark:text-doj-orange hover:bg-gray-100 dark:hover:bg-doj-dark/60 transition-colors border-b border-gray-200 dark:border-doj-dark-border"
            >
              <Lock size={16} />
              {user.has_password ? 'Change Password' : 'Set Password'}
            </motion.button>

            {/* Logout Button */}
            <motion.button
              onClick={handleLogout}
              whileHover={{ backgroundColor: isDark ? '#1a2b3d' : '#f3f4f6' }}
              className="w-full px-4 py-3 flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-doj-dark/60 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Management Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-doj-dark-secondary rounded-xl shadow-2xl max-w-md w-full p-8 border border-gray-200 dark:border-doj-dark-border"
            >
              {/* State 0: Init */}
              {modalState === 0 && (
                <>
                  <h2 className="text-2xl font-bold text-doj-blue dark:text-doj-dark-text mb-4">
                    Secure Your Account
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    We will send a verification code to <strong>{user.email}</strong> to secure your account.
                  </p>

                  {modalError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-start gap-2"
                    >
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      <span>{modalError}</span>
                    </motion.div>
                  )}

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowPasswordModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-doj-dark-border text-gray-700 dark:text-doj-dark-text rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-doj-dark/60 transition-colors"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSendCode}
                      disabled={modalLoading}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-doj-blue to-blue-700 dark:from-doj-blue dark:to-blue-800 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {modalLoading ? (
                        <>
                          <Loader className="animate-spin" size={16} />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail size={16} />
                          Send Code
                        </>
                      )}
                    </motion.button>
                  </div>
                </>
              )}

              {/* State 1: OTP */}
              {modalState === 1 && (
                <>
                  <h2 className="text-2xl font-bold text-doj-blue dark:text-doj-dark-text mb-4">
                    Verify Code
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Enter the 6-digit code sent to your email.
                  </p>

                  {modalError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-start gap-2"
                    >
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      <span>{modalError}</span>
                    </motion.div>
                  )}

                  {modalSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm flex items-start gap-2"
                    >
                      <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                      <span>{modalSuccess}</span>
                    </motion.div>
                  )}

                  <div className="mb-6">
                    <input
                      type="text"
                      maxLength="6"
                      inputMode="numeric"
                      placeholder="000000"
                      value={modalFormData.otp}
                      onChange={(e) => {
                        if (/^\d*$/.test(e.target.value)) {
                          setModalFormData({ ...modalFormData, otp: e.target.value });
                        }
                      }}
                      className="w-full px-4 py-4 text-center text-3xl tracking-widest border-2 border-gray-300 dark:border-doj-dark-border bg-white dark:bg-doj-dark text-gray-900 dark:text-doj-dark-text rounded-lg focus:outline-none focus:ring-2 focus:ring-doj-blue focus:ring-opacity-50 dark:focus:ring-doj-orange font-mono font-bold"
                    />
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setModalState(0);
                        setModalFormData({ ...modalFormData, otp: '' });
                        clearModalMessages();
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-doj-dark-border text-gray-700 dark:text-doj-dark-text rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-doj-dark/60 transition-colors"
                    >
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleVerifyOTP}
                      disabled={modalLoading || !modalFormData.otp || modalFormData.otp.length !== 6}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-doj-blue to-blue-700 dark:from-doj-blue dark:to-blue-800 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {modalLoading ? (
                        <>
                          <Loader className="animate-spin" size={16} />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Verify
                        </>
                      )}
                    </motion.button>
                  </div>
                </>
              )}

              {/* State 2: New Password */}
              {modalState === 2 && (
                <>
                  <h2 className="text-2xl font-bold text-doj-blue dark:text-doj-dark-text mb-4">
                    Set New Password
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Create a strong password for your account.
                  </p>

                  {modalError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-start gap-2"
                    >
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      <span>{modalError}</span>
                    </motion.div>
                  )}

                  {modalSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm flex items-start gap-2"
                    >
                      <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                      <span>{modalSuccess}</span>
                    </motion.div>
                  )}

                  <div className="space-y-4 mb-6">
                    {/* New Password */}
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="New Password"
                        value={modalFormData.newPassword}
                        onChange={(e) => setModalFormData({ ...modalFormData, newPassword: e.target.value })}
                        className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-doj-dark-border bg-white dark:bg-doj-dark text-gray-900 dark:text-doj-dark-text rounded-lg focus:outline-none focus:ring-2 focus:ring-doj-blue focus:ring-opacity-50 dark:focus:ring-doj-orange"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* Confirm Password */}
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm Password"
                        value={modalFormData.confirmPassword}
                        onChange={(e) => setModalFormData({ ...modalFormData, confirmPassword: e.target.value })}
                        className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-doj-dark-border bg-white dark:bg-doj-dark text-gray-900 dark:text-doj-dark-text rounded-lg focus:outline-none focus:ring-2 focus:ring-doj-blue focus:ring-opacity-50 dark:focus:ring-doj-orange"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setModalState(1);
                        setModalFormData({ ...modalFormData, newPassword: '', confirmPassword: '' });
                        clearModalMessages();
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-doj-dark-border text-gray-700 dark:text-doj-dark-text rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-doj-dark/60 transition-colors"
                    >
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSetNewPassword}
                      disabled={modalLoading}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-doj-blue to-blue-700 dark:from-doj-blue dark:to-blue-800 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {modalLoading ? (
                        <>
                          <Loader className="animate-spin" size={16} />
                          Setting...
                        </>
                      ) : (
                        <>
                          <Lock size={16} />
                          Update Password
                        </>
                      )}
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
