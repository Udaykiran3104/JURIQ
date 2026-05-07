import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AutoLogout({ children }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const lastActivityRef = useRef(Date.now());
  const checkIntervalRef = useRef(null);

  // Debounced activity tracker
  const debouncedUpdateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    localStorage.setItem('lastActivity', lastActivityRef.current.toString());
  }, []);

  useEffect(() => {
    // Initialize last activity on mount
    const stored = localStorage.getItem('lastActivity');
    if (stored) {
      lastActivityRef.current = parseInt(stored);
    } else {
      lastActivityRef.current = Date.now();
      localStorage.setItem('lastActivity', lastActivityRef.current.toString());
    }

    // Track user activity with debouncing
    const handleActivity = () => {
      debouncedUpdateActivity();
    };

    // Activity event listeners
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check for inactivity every 10 seconds
    checkIntervalRef.current = setInterval(() => {
      const stored = localStorage.getItem('lastActivity');
      const lastActivity = stored ? parseInt(stored) : Date.now();
      const now = Date.now();
      const inactiveTime = now - lastActivity;

      // 5 minutes = 300000 milliseconds
      if (inactiveTime > 600000) {
        // Auto-logout
        logout();
        localStorage.removeItem('lastActivity');
        
        // Alert user
        alert('Session expired due to inactivity. Please log in again.');
        
        // Redirect to auth
        navigate('/auth');
      }
    }, 10000);

    return () => {
      // Cleanup event listeners
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });

      // Clear interval
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [navigate, logout, debouncedUpdateActivity]);

  return children;
}
