import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AnimatePresence } from "framer-motion";
import axios from "axios";

import LandingPage from "./pages/LandingPage";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const AuthContext = {
  user: null,
  setUser: () => {},
  isLoading: true,
  logout: () => {}
};

// Onboarding Modal Component
function OnboardingModal({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    favorite_genre: '',
    favorite_mood: '',
    favorite_era: '',
    favorite_character: ''
  });
  const [compliment, setCompliment] = useState('');
  const [loading, setLoading] = useState(false);

  const questions = [
    {
      key: 'favorite_genre',
      question: 'Какой жанр вам ближе всего?',
      options: ['Научная фантастика', 'Триллер', 'Драма', 'Криминал', 'Фэнтези']
    },
    {
      key: 'favorite_mood',
      question: 'Какое настроение фильма предпочитаете?',
      options: ['Философское', 'Напряжённое', 'Эпическое', 'Меланхоличное', 'Динамичное']
    },
    {
      key: 'favorite_era',
      question: 'Фильмы какой эпохи вам интереснее?',
      options: ['Классика (до 2000)', '2000-е', '2010-е', 'Современные (2020+)', 'Любые']
    },
    {
      key: 'favorite_character',
      question: 'Какой тип героя вам нравится?',
      options: ['Загадочный одиночка', 'Гениальный интеллектуал', 'Бунтарь', 'Харизматичный лидер', 'Обычный человек в необычных обстоятельствах']
    }
  ];

  const handleSelect = async (value) => {
    const newAnswers = { ...answers, [questions[step].key]: value };
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        const res = await axios.post(`${API}/onboarding`, newAnswers, { withCredentials: true });
        setCompliment(res.data.compliment);
        setStep(questions.length);
      } catch (e) {
        setCompliment('У вас отличный вкус в кино!');
        setStep(questions.length);
      }
      setLoading(false);
    }
  };

  if (step === questions.length) {
    return (
      <div className="modal-overlay">
        <div className="modal-content p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(201, 162, 39, 0.1)', border: '1px solid rgba(201, 162, 39, 0.3)' }}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#C9A227">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#C9A227' }}>Добро пожаловать!</h2>
          <p className="text-white/60 text-sm mb-8 leading-relaxed">{compliment}</p>
          <button onClick={onComplete} className="btn-primary">
            Начать исследование
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content p-8">
        {/* Progress */}
        <div className="flex gap-2 mb-8 justify-center">
          {questions.map((_, i) => (
            <div key={i} className={`progress-dot ${i === step ? 'active' : i < step ? 'completed' : ''}`} />
          ))}
        </div>

        <h2 className="text-xl text-center mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {questions[step].question}
        </h2>
        <p className="text-white/40 text-xs text-center mb-6">Шаг {step + 1} из {questions.length}</p>

        <div className="flex flex-col gap-2">
          {questions[step].options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleSelect(option)}
              disabled={loading}
              className="w-full p-4 text-left rounded text-sm text-white/70 transition-all hover:text-white"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(201, 162, 39, 0.08)';
                e.target.style.borderColor = 'rgba(201, 162, 39, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.03)';
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            >
              {option}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mt-6 text-center">
            <div className="inline-block w-6 h-6 border-2 border-white/20 border-t-amber-500 rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

function AppRouter() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const user = AuthContext.user;
  const isLoading = AuthContext.isLoading;
  
  const handleGoogleAuth = () => {
    const currentUrl = window.location.hostname === 'localhost' 
      ? 'https://film-search.preview.emergentagent.com'
      : window.location.origin;
    const authUrl = `https://demobackend.emergentagent.com/auth/v1/env/google?redirect_url=${encodeURIComponent(currentUrl)}`;
    window.location.href = authUrl;
  };
  
  const handleDemoLogin = async () => {
    try {
      const res = await axios.post(`${API}/auth/demo`, {}, { withCredentials: true });
      AuthContext.setUser(res.data);
      if (!res.data.onboarding_completed) {
        setShowOnboarding(true);
      } else {
        navigate('/dashboard');
      }
    } catch (e) {
      console.error('Demo login error:', e);
    }
  };
  
  useEffect(() => {
    if (user && location.pathname === '/') {
      if (!user.onboarding_completed) {
        setShowOnboarding(true);
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, location.pathname, navigate]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    navigate('/dashboard');
  };
  
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <>
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage onAuthClick={handleGoogleAuth} onDemoClick={handleDemoLogin} />} />
          <Route path="/dashboard" element={
            user ? <Dashboard user={user} onLogout={AuthContext.logout} /> : 
            isLoading ? <div className="h-screen flex items-center justify-center" style={{ background: '#0A0E17' }}><span className="text-white/50">Загрузка...</span></div> :
            <LandingPage onAuthClick={handleGoogleAuth} onDemoClick={handleDemoLogin} />
          } />
          <Route path="/app" element={
            user ? <Dashboard user={user} onLogout={AuthContext.logout} /> : 
            <LandingPage onAuthClick={handleGoogleAuth} onDemoClick={handleDemoLogin} />
          } />
        </Routes>
      </AnimatePresence>
    </>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
        setUser(response.data);
      } catch (error) {
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
  
  AuthContext.user = user;
  AuthContext.setUser = setUser;
  AuthContext.isLoading = isLoading;
  AuthContext.logout = logout;

  return (
    <div className="min-h-screen" style={{ background: '#0A0E17' }}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

export default App;
