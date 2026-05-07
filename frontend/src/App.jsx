import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { ChatInterface } from './components/ChatMessage';
import { AutoLogout } from './components/AutoLogout';

function AppContent() {
  const { user, isLoading } = useAuth();

  // Protected Route Component
  const ProtectedRoute = ({ children }) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-doj-blue"></div>
        </div>
      );
    }
    return user ? <AutoLogout>{children}</AutoLogout> : <Navigate to="/auth" />;
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <ThemeProvider>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Page (Signup/Login/OTP) */}
        <Route path="/auth" element={user ? <Navigate to="/chat" /> : <AuthPage />} />

        {/* Protected Chat Route - with AutoLogout wrapper */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatInterface onBackToHome={handleBackToHome} />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}