import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Moon, Sun, Eye, EyeOff, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'http://localhost:8000';

export function AuthPage() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { saveUser } = useAuth();

  // Authentication state machine: 0=Login, 1=RequestOTP, 2=VerifyOTP, 3=SetPassword
  const [authState, setAuthState] = useState(0);
  const [otpPurpose, setOtpPurpose] = useState(null); // 'signup' or 'reset'
  const [temporaryToken, setTemporaryToken] = useState(null); // Token from OTP verification
  const [activePurpose, setActivePurpose] = useState(null); // Active purpose from request-otp response

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });

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

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  // ============ STATE 0: LOGIN ============
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }

    setIsLoading(true);
    clearMessages();

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: formData.email,
        password: formData.password,
      });

      const userData = {
        user_id: response.data.user_id,
        email: response.data.email,
        name: response.data.name,
        picture: response.data.picture,
        has_password: response.data.has_password,
      };

      saveUser(userData);

      // Set initial activity for auto-logout
      localStorage.setItem('lastActivity', Date.now().toString());

      setSuccess('Login successful! Redirecting...');
      setTimeout(() => navigate('/chat'), 800);
    } catch (err) {
      const errorDetail = err.response?.data?.detail;
      const errorMessage = extractErrorMessage(errorDetail);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ============ STATE 1: REQUEST OTP ============
  const handleRequestOTP = async (e) => {
    e.preventDefault();

    if (otpPurpose === 'signup' && !formData.name) {
      setError('Name is required for signup');
      return;
    }
    if (!formData.email) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);
    clearMessages();

    try {
      const response = await axios.post(`${API_URL}/auth/request-otp`, {
        email: formData.email,
        name: otpPurpose === 'signup' ? formData.name : undefined,
        purpose: otpPurpose,
      });

      // Save the active_purpose from response
      setActivePurpose(response.data.active_purpose);

      setSuccess(`OTP sent to ${formData.email}. Check your email.`);

      // Move to State 2: Verify OTP
      setTimeout(() => {
        setAuthState(2);
        clearMessages();
      }, 1000);
    } catch (err) {
      const errorDetail = err.response?.data?.detail;
      const errorMessage = extractErrorMessage(errorDetail);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ============ STATE 2: VERIFY OTP ============
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    clearMessages();

    try {
      const response = await axios.post(`${API_URL}/auth/verify-otp`, {
        email: formData.email,
        otp: formData.otp,
        purpose: activePurpose || otpPurpose,
      });

      // Save the temporary token from response
      setTemporaryToken(response.data.token);

      setSuccess('OTP verified successfully!');

      // If purpose is 'reset', move to State 3: Set Password
      // If purpose is 'signup', also move to State 3
      setTimeout(() => {
        setAuthState(3);
        clearMessages();
      }, 800);
    } catch (err) {
      const errorDetail = err.response?.data?.detail;
      const errorMessage = extractErrorMessage(errorDetail);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ============ STATE 3: SET PASSWORD ============
  const handleSetPassword = async (e) => {
    e.preventDefault();

    if (!formData.password || !formData.confirmPassword) {
      setError('Both password fields are required');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    clearMessages();

    try {
      const response = await axios.post(`${API_URL}/auth/set-password`, {
        email: formData.email,
        new_password: formData.password,
        token: temporaryToken,
      });

      const userData = {
        user_id: response.data.user_id,
        email: response.data.email,
        name: response.data.name,
        picture: response.data.picture,
        has_password: response.data.has_password !== undefined ? response.data.has_password : true,
      };

      saveUser(userData);

      // Set initial activity for auto-logout
      localStorage.setItem('lastActivity', Date.now().toString());

      setSuccess('Password set successfully! Redirecting to chat...');
      setTimeout(() => navigate('/chat'), 800);
    } catch (err) {
      const errorDetail = err.response?.data?.detail;
      const errorMessage = extractErrorMessage(errorDetail);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth Handler
  const googleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setIsLoading(true);
      clearMessages();

      try {
        const response = await axios.post(`${API_URL}/auth/google`, {
          token: codeResponse.access_token,
        });

        const userData = {
          user_id: response.data.user_id,
          email: response.data.email,
          name: response.data.name,
          picture: response.data.picture,
          has_password: response.data.has_password,
        };

        saveUser(userData);

        // Set initial activity for auto-logout
        localStorage.setItem('lastActivity', Date.now().toString());

        setSuccess('Google sign-in successful! Redirecting...');
        setTimeout(() => navigate('/chat'), 800);
      } catch (err) {
        const errorDetail = err.response?.data?.detail;
        const errorMessage = extractErrorMessage(errorDetail);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError('Google sign-in failed. Please try again.');
    },
    flow: 'implicit',
  });

  return (
    <div className="min-h-screen bg-doj-bg dark:bg-doj-dark flex items-center justify-center p-4">
      {/* Theme Toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/80 dark:bg-doj-dark-secondary/80 text-gray-700 dark:text-doj-dark-text hover:bg-white dark:hover:bg-doj-dark-border transition-colors shadow-lg"
        aria-label="Toggle dark mode"
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </motion.button>

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-doj-blue/10 dark:bg-doj-blue/20 rounded-full blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, 80, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-doj-orange/10 dark:bg-doj-orange/20 rounded-full blur-3xl"
          animate={{ x: [0, -120, 0], y: [0, -100, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md bg-white dark:bg-doj-dark-secondary rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-doj-dark-border"
      >
        {/* State 0: Login */}
        {authState === 0 && (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-doj-blue dark:text-doj-dark-text mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Sign in to access the chatbot
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-start gap-3"
              >
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Success Alert */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm flex items-start gap-3"
              >
                <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{success}</span>
              </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-doj-dark-border bg-white dark:bg-doj-dark text-gray-900 dark:text-doj-dark-text rounded-lg focus:outline-none focus:ring-2 focus:ring-doj-blue focus:ring-opacity-50 dark:focus:ring-doj-orange"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-doj-dark-border bg-white dark:bg-doj-dark text-gray-900 dark:text-doj-dark-text rounded-lg focus:outline-none focus:ring-2 focus:ring-doj-blue focus:ring-opacity-50 dark:focus:ring-doj-orange"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setAuthState(1);
                    setOtpPurpose('reset');
                    setFormData({ name: '', email: '', password: '', confirmPassword: '', otp: '' });
                    clearMessages();
                  }}
                  className="text-sm text-doj-blue dark:text-doj-orange hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-doj-blue to-blue-700 dark:from-doj-blue dark:to-blue-800 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Signing in...
                  </>
                ) : (
                  <>
                    Submit
                    <ArrowRight size={20} />
                  </>
                )}
              </motion.button>

              {/* Sign Up Link */}
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthState(1);
                    setOtpPurpose('signup');
                    setFormData({ name: '', email: '', password: '', confirmPassword: '', otp: '' });
                    clearMessages();
                  }}
                  className="text-doj-blue dark:text-doj-orange font-bold hover:underline"
                >
                  Sign up
                </button>
              </div>
            </form>
          </>
        )}

        {/* State 1: Request OTP */}
        {authState === 1 && (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-doj-blue dark:text-doj-dark-text mb-2">
                {otpPurpose === 'signup' ? 'Create Account' : 'Reset Password'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {otpPurpose === 'signup' ? 'Join us to get started' : 'We\'ll send you a code to verify'}
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-start gap-3"
              >
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Success Alert */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm flex items-start gap-3"
              >
                <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{success}</span>
              </motion.div>
            )}

            {/* Request OTP Form */}
            <form onSubmit={handleRequestOTP} className="space-y-4">
              {/* Name (only for signup) */}
              {otpPurpose === 'signup' && (
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input
                    type="text"
                    name="name"
                    placeholder="Full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-doj-dark-border bg-white dark:bg-doj-dark text-gray-900 dark:text-doj-dark-text rounded-lg focus:outline-none focus:ring-2 focus:ring-doj-blue focus:ring-opacity-50 dark:focus:ring-doj-orange"
                  />
                </div>
              )}

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-doj-dark-border bg-white dark:bg-doj-dark text-gray-900 dark:text-doj-dark-text rounded-lg focus:outline-none focus:ring-2 focus:ring-doj-blue focus:ring-opacity-50 dark:focus:ring-doj-orange"
                />
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-doj-blue to-blue-700 dark:from-doj-blue dark:to-blue-800 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Sending Code...
                  </>
                ) : (
                  <>
                    Send Code
                    <ArrowRight size={20} />
                  </>
                )}
              </motion.button>

              {/* Back to Login */}
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                <button
                  type="button"
                  onClick={() => {
                    setAuthState(0);
                    setFormData({ name: '', email: '', password: '', confirmPassword: '', otp: '' });
                    clearMessages();
                  }}
                  className="text-doj-blue dark:text-doj-orange font-bold hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </form>
          </>
        )}

        {/* State 2: Verify OTP */}
        {authState === 2 && (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-doj-blue dark:text-doj-dark-text mb-2">
                Verify OTP
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Enter the 6-digit code sent to <br /> <span className="font-semibold">{formData.email}</span>
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-start gap-3"
              >
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Success Alert */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm flex items-start gap-3"
              >
                <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{success}</span>
              </motion.div>
            )}

            {/* Verify OTP Form */}
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              {/* OTP Input */}
              <div className="relative">
                <input
                  type="text"
                  name="otp"
                  placeholder="000000"
                  maxLength="6"
                  value={formData.otp}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value)) {
                      handleInputChange(e);
                    }
                  }}
                  className="w-full px-4 py-4 text-center text-3xl tracking-widest border-2 border-gray-300 dark:border-doj-dark-border bg-white dark:bg-doj-dark text-gray-900 dark:text-doj-dark-text rounded-lg focus:outline-none focus:ring-2 focus:ring-doj-blue focus:ring-opacity-50 dark:focus:ring-doj-orange font-mono font-bold"
                />
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-doj-blue to-blue-700 dark:from-doj-blue dark:to-blue-800 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Code
                    <ArrowRight size={20} />
                  </>
                )}
              </motion.button>

              {/* Back Button */}
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                <button
                  type="button"
                  onClick={() => {
                    setAuthState(1);
                    setFormData(prev => ({ ...prev, otp: '' }));
                    clearMessages();
                  }}
                  className="text-doj-blue dark:text-doj-orange font-bold hover:underline"
                >
                  Back to Send Code
                </button>
              </div>
            </form>
          </>
        )}

        {/* State 3: Set Password */}
        {authState === 3 && (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-doj-blue dark:text-doj-dark-text mb-2">
                Set Password
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Create a secure password for your account
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-start gap-3"
              >
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Success Alert */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm flex items-start gap-3"
              >
                <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{success}</span>
              </motion.div>
            )}

            {/* Set Password Form */}
            <form onSubmit={handleSetPassword} className="space-y-4">
              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="New password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-doj-dark-border bg-white dark:bg-doj-dark text-gray-900 dark:text-doj-dark-text rounded-lg focus:outline-none focus:ring-2 focus:ring-doj-blue focus:ring-opacity-50 dark:focus:ring-doj-orange"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-doj-dark-border bg-white dark:bg-doj-dark text-gray-900 dark:text-doj-dark-text rounded-lg focus:outline-none focus:ring-2 focus:ring-doj-blue focus:ring-opacity-50 dark:focus:ring-doj-orange"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Password Requirements Hint */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                • Password must be at least 6 characters
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-doj-blue to-blue-700 dark:from-doj-blue dark:to-blue-800 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Setting Password...
                  </>
                ) : (
                  <>
                    Set Password
                    <ArrowRight size={20} />
                  </>
                )}
              </motion.button>

              {/* Back Button */}
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                <button
                  type="button"
                  onClick={() => {
                    setAuthState(2);
                    clearMessages();
                  }}
                  className="text-doj-blue dark:text-doj-orange font-bold hover:underline"
                >
                  Back to Verify OTP
                </button>
              </div>
            </form>
          </>
        )}

        {/* Divider */}
        {authState === 0 && (
          <>
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-300 dark:border-doj-dark-border"></div>
              <span className="px-3 text-gray-500 dark:text-gray-400 text-sm">OR</span>
              <div className="flex-1 border-t border-gray-300 dark:border-doj-dark-border"></div>
            </div>

            {/* Google Sign In Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => googleLogin()}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 border-2 border-gray-300 dark:border-doj-dark-border bg-white dark:bg-doj-dark text-gray-700 dark:text-doj-dark-text font-bold py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-doj-dark-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  );
}
