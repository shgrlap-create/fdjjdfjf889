import React, { useEffect, useRef, useState } from 'react';
import { Mail, Send } from 'lucide-react';

const LandingPage = ({ onAuthClick, onDemoClick }) => {
  const starsCanvasRef = useRef(null);
  const trailCanvasRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showContacts, setShowContacts] = useState(false);
  const starsRef = useRef([]);
  const trailRef = useRef([]);

  // Create stars
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 0.3 + Math.random() * 1.5,
        baseOpacity: 0.15 + Math.random() * 0.4,
        twinkleSpeed: 0.3 + Math.random() * 1.5,
        twinklePhase: Math.random() * Math.PI * 2,
        inertia: 0.01 + Math.random() * 0.04,
        offsetX: 0,
        offsetY: 0,
      });
    }
    starsRef.current = stars;
  }, []);

  // Stars canvas
  useEffect(() => {
    const canvas = starsCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    
    let animationId;
    let time = 0;
    
    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      time += 0.016;
      
      starsRef.current.forEach(star => {
        star.offsetX += ((mousePos.x * star.inertia * 0.3) - star.offsetX) * 0.015;
        star.offsetY += ((mousePos.y * star.inertia * 0.3) - star.offsetY) * 0.015;
        
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5;
        const opacity = star.baseOpacity * (0.4 + twinkle * 0.6);
        
        const x = (star.x / 100) * window.innerWidth + star.offsetX;
        const y = (star.y / 100) * window.innerHeight + star.offsetY;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationId);
  }, [mousePos]);

  // Trail effect - smaller particles, more of them
  useEffect(() => {
    const canvas = trailCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    
    let animationId;
    
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 14, 23, 0.12)';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      
      trailRef.current.forEach((particle) => {
        particle.life -= 0.03;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.96;
        particle.vy *= 0.96;
        
        if (particle.life > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${particle.life * 0.25})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      trailRef.current = trailRef.current.filter(p => p.life > 0);
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Mouse handler with smaller, more particles
  useEffect(() => {
    let lastX = 0, lastY = 0;
    
    const handleMouseMove = (e) => {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const speed = Math.sqrt(dx * dx + dy * dy);
      
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
      
      // Check if near bottom of screen
      const nearBottom = e.clientY > window.innerHeight - 150;
      setShowContacts(nearBottom);
      
      // More particles, smaller size
      if (speed > 2) {
        const particleCount = Math.min(Math.floor(speed / 3), 5);
        for (let i = 0; i < particleCount; i++) {
          trailRef.current.push({
            x: e.clientX + (Math.random() - 0.5) * 6,
            y: e.clientY + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 1.5 - dx * 0.02,
            vy: (Math.random() - 0.5) * 1.5 - dy * 0.02,
            size: 0.5 + Math.random() * 1,  // Smaller
            life: 0.3 + Math.random() * 0.4
          });
        }
      }
      
      lastX = e.clientX;
      lastY = e.clientY;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#0A0E17' }}>
      {/* Stars */}
      <canvas ref={starsCanvasRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }} />
      
      {/* Trail */}
      <canvas ref={trailCanvasRef} className="trail-canvas" style={{ zIndex: 2 }} />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0" style={{
        zIndex: 3,
        background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(30, 58, 95, 0.15) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      {/* Logo */}
      <header className="absolute top-8 left-8 z-20">
        <span className="logo-text">STARMAPS</span>
      </header>

      {/* Main content */}
      <div className="relative z-10 h-full flex items-center justify-center px-8">
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl md:text-6xl mb-6 leading-tight text-white/90" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300 }}>
            Откройте свою
            <br />
            <span style={{ color: '#C9A227' }}>галактику кино</span>
          </h1>
          
          <p className="text-base text-white/50 mb-10 leading-relaxed font-light max-w-lg mx-auto" style={{ fontFamily: "'Raleway', sans-serif" }}>
            Опишите настроение — и мы построим карту фильмов, 
            идеально подходящих именно вам
          </p>
          
          <div className="flex flex-col gap-3 items-center">
            <button 
              data-testid="google-auth-btn"
              onClick={onAuthClick}
              className="btn-auth"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Войти через Google</span>
            </button>
            
            <button 
              data-testid="demo-btn"
              onClick={onDemoClick}
              className="btn-demo"
            >
              <span>Войти без регистрации</span>
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 flex gap-12 justify-center">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-light" style={{ color: '#C9A227' }}>30</span>
              <span className="text-xs text-white/30 mt-1 tracking-wider">ФИЛЬМОВ</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-light" style={{ color: '#C9A227' }}>AI</span>
              <span className="text-xs text-white/30 mt-1 tracking-wider">ПОДБОР</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact sphere at bottom - appears on hover */}
      <div 
        className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none z-30 transition-all duration-700"
        style={{
          transform: showContacts ? 'translateY(0)' : 'translateY(80%)',
          opacity: showContacts ? 1 : 0
        }}
      >
        <div 
          className="relative w-96 h-48 flex flex-col items-center justify-center pb-4"
          style={{
            background: 'radial-gradient(ellipse 100% 100% at 50% 100%, rgba(30, 80, 140, 0.4) 0%, rgba(20, 60, 120, 0.2) 40%, transparent 70%)',
            filter: 'blur(0px)'
          }}
        >
          {/* Neon glow effect */}
          <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-32 rounded-t-full"
            style={{
              background: 'radial-gradient(ellipse 100% 100% at 50% 100%, rgba(40, 100, 180, 0.5) 0%, rgba(30, 80, 150, 0.3) 30%, transparent 60%)',
              filter: 'blur(20px)'
            }}
          />
          
          <div className="relative z-10 text-center pointer-events-auto">
            <p className="text-xs text-white/40 mb-3 tracking-widest">КОНТАКТЫ</p>
            <div className="flex flex-col gap-2">
              <a href="mailto:rabocijakaunt74@gmail.com" className="flex items-center gap-2 text-sm text-white/60 hover:text-white/90 transition-colors">
                <Mail className="w-4 h-4" style={{ color: '#5090D0' }} />
                <span>rabocijakaunt74@gmail.com</span>
              </a>
              <a href="https://t.me/negrwhite" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-white/60 hover:text-white/90 transition-colors">
                <Send className="w-4 h-4" style={{ color: '#5090D0' }} />
                <span>@negrwhite</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
