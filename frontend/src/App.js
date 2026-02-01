import { useEffect, useState, useRef } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

// Pages
import LandingPage from "./pages/LandingPage";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
export const AuthContext = {
  user: null,
  setUser: () => {},
  isLoading: true,
  logout: () => {}
};

function AppRouter() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check URL fragment for session_id synchronously during render
  // This prevents race conditions by processing new session_id FIRST
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  // Google OAuth handler
  const handleGoogleAuth = () => {
    const currentUrl = window.location.origin;
    const authUrl = `https://demobackend.emergentagent.com/auth/v1/env/google?redirect_url=${encodeURIComponent(currentUrl)}`;
    window.location.href = authUrl;
  };
  
  // Get user from context
  const user = AuthContext.user;
  const isLoading = AuthContext.isLoading;
  
  // If user is authenticated, redirect to dashboard
  useEffect(() => {
    if (user && location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [user, location.pathname, navigate]);
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage onAuthClick={handleGoogleAuth} />} />
        <Route path="/dashboard" element={
          user ? <Dashboard user={user} onLogout={AuthContext.logout} /> : 
          isLoading ? <div className="h-screen flex items-center justify-center bg-[#010204]"><span className="text-white/50">Загрузка...</span></div> :
          <LandingPage onAuthClick={handleGoogleAuth} />
        } />
        <Route path="/app" element={
          user ? <Dashboard user={user} onLogout={AuthContext.logout} /> : 
          <LandingPage onAuthClick={handleGoogleAuth} />
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API}/auth/me`, {
          withCredentials: true
        });
        setUser(response.data);
      } catch (error) {
        // Not authenticated
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (e) {
      console.error("Logout error", e);
    }
    setUser(null);
  };
  
  // Provide auth context globally
  AuthContext.user = user;
  AuthContext.setUser = setUser;
  AuthContext.isLoading = isLoading;
  AuthContext.logout = logout;

  return (
    <div className="min-h-screen bg-background">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

export default App;
