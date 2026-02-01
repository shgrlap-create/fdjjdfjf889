import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

const LandingPage = ({ onAuthClick }) => {
  const canvasRef = useRef(null);
  const starsCanvasRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const starsRef = useRef([]);

  // Create stars with individual properties
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 0.5 + Math.random() * 2,
        baseOpacity: 0.2 + Math.random() * 0.6,
        twinkleSpeed: 0.5 + Math.random() * 2,
        twinklePhase: Math.random() * Math.PI * 2,
        // Each star has its own inertia factor - how much it reacts to mouse
        inertia: 0.02 + Math.random() * 0.08, // Very low inertia for sand-like effect
        offsetX: 0,
        offsetY: 0,
        targetOffsetX: 0,
        targetOffsetY: 0
      });
    }
    starsRef.current = stars;
  }, []);

  // Stars canvas with individual movement (sand-like effect)
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
        // Update target offset based on mouse position (inverted, small effect)
        star.targetOffsetX = (mousePos.x * star.inertia * 0.5);
        star.targetOffsetY = (mousePos.y * star.inertia * 0.5);
        
        // Smooth interpolation towards target (sand-like slow follow)
        star.offsetX += (star.targetOffsetX - star.offsetX) * 0.02;
        star.offsetY += (star.targetOffsetY - star.offsetY) * 0.02;
        
        // Calculate twinkle
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5;
        const opacity = star.baseOpacity * (0.3 + twinkle * 0.7);
        
        // Star position with individual offset
        const x = (star.x / 100) * window.innerWidth + star.offsetX;
        const y = (star.y / 100) * window.innerHeight + star.offsetY;
        
        // Draw star with glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, star.size * 3);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(200, 220, 255, ${opacity * 0.3})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, star.size * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
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

  // Realistic planet with WebGL-like canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 700 * dpr;
    canvas.height = 700 * dpr;
    ctx.scale(dpr, dpr);
    
    let time = 0;
    let animationId;
    
    const drawPlanet = () => {
      ctx.clearRect(0, 0, 700, 700);
      const cx = 350;
      const cy = 350;
      const radius = 180;
      
      // Outer glow - multiple layers
      for (let i = 6; i >= 0; i--) {
        const glowRadius = radius + 80 + i * 20;
        const gradient = ctx.createRadialGradient(cx, cy, radius, cx, cy, glowRadius);
        gradient.addColorStop(0, `rgba(0, 180, 255, ${0.02 - i * 0.002})`);
        gradient.addColorStop(0.3, `rgba(100, 60, 200, ${0.03 - i * 0.003})`);
        gradient.addColorStop(0.6, `rgba(200, 60, 150, ${0.02 - i * 0.002})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Atmosphere rim light
      const rimGradient = ctx.createRadialGradient(cx - 30, cy - 30, radius * 0.8, cx, cy, radius + 15);
      rimGradient.addColorStop(0, 'transparent');
      rimGradient.addColorStop(0.85, 'transparent');
      rimGradient.addColorStop(0.95, 'rgba(100, 200, 255, 0.4)');
      rimGradient.addColorStop(1, 'rgba(100, 200, 255, 0.1)');
      ctx.fillStyle = rimGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 15, 0, Math.PI * 2);
      ctx.fill();
      
      // Main planet base - dark blue
      const baseGradient = ctx.createRadialGradient(cx - 60, cy - 60, 0, cx, cy, radius);
      baseGradient.addColorStop(0, '#1a3a5c');
      baseGradient.addColorStop(0.4, '#0d1f33');
      baseGradient.addColorStop(0.7, '#091626');
      baseGradient.addColorStop(1, '#050a12');
      ctx.fillStyle = baseGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Animated cloud layers
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();
      
      // Cloud band 1 - cyan swirls
      for (let i = 0; i < 8; i++) {
        const bandY = cy - radius + (i * 45) + Math.sin(time * 0.3 + i) * 15;
        const waveOffset = Math.sin(time * 0.5 + i * 0.8) * 30 + time * 20;
        
        ctx.beginPath();
        ctx.moveTo(cx - radius - 20, bandY);
        
        for (let x = -radius - 20; x <= radius + 20; x += 10) {
          const wave = Math.sin((x + waveOffset) * 0.03) * 20 + Math.sin((x + waveOffset) * 0.05) * 10;
          ctx.lineTo(cx + x, bandY + wave);
        }
        
        ctx.strokeStyle = `rgba(60, 180, 220, ${0.08 + Math.sin(time * 0.2 + i) * 0.03})`;
        ctx.lineWidth = 12 + Math.sin(time * 0.4 + i) * 4;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      
      // Cloud band 2 - purple/magenta swirls  
      for (let i = 0; i < 6; i++) {
        const bandY = cy - radius + 30 + (i * 60) + Math.cos(time * 0.25 + i) * 20;
        const waveOffset = Math.cos(time * 0.4 + i * 0.6) * 40 - time * 15;
        
        ctx.beginPath();
        ctx.moveTo(cx - radius - 20, bandY);
        
        for (let x = -radius - 20; x <= radius + 20; x += 8) {
          const wave = Math.sin((x + waveOffset) * 0.025) * 25 + Math.cos((x + waveOffset) * 0.04) * 15;
          ctx.lineTo(cx + x, bandY + wave);
        }
        
        ctx.strokeStyle = `rgba(150, 80, 200, ${0.06 + Math.cos(time * 0.15 + i) * 0.02})`;
        ctx.lineWidth = 15 + Math.cos(time * 0.35 + i) * 5;
        ctx.stroke();
      }
      
      // Bright storm spots
      const spots = [
        { x: cx - 50 + Math.sin(time * 0.2) * 10, y: cy + 30, r: 25, color: 'rgba(80, 200, 255, 0.15)' },
        { x: cx + 70, y: cy - 60 + Math.cos(time * 0.3) * 8, r: 18, color: 'rgba(200, 100, 255, 0.12)' },
        { x: cx - 30, y: cy - 80, r: 30, color: 'rgba(255, 150, 200, 0.1)' },
      ];
      
      spots.forEach(spot => {
        const spotGradient = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, spot.r);
        spotGradient.addColorStop(0, spot.color);
        spotGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = spotGradient;
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, spot.r, 0, Math.PI * 2);
        ctx.fill();
      });
      
      ctx.restore();
      
      // Specular highlight
      const specGradient = ctx.createRadialGradient(cx - 80, cy - 80, 0, cx - 80, cy - 80, 120);
      specGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      specGradient.addColorStop(0.4, 'rgba(200, 220, 255, 0.05)');
      specGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = specGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Edge shadow (terminator)
      const shadowGradient = ctx.createLinearGradient(cx + radius * 0.4, cy, cx + radius, cy);
      shadowGradient.addColorStop(0, 'transparent');
      shadowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
      shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
      ctx.fillStyle = shadowGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      
      time += 0.016;
      animationId = requestAnimationFrame(drawPlanet);
    };
    
    drawPlanet();
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Mouse parallax - only for planet, stars handled separately
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#010204]">
      {/* Stars canvas - separate layer with individual movement */}
      <canvas 
        ref={starsCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />
      
      {/* Deep space gradient */}
      <div 
        className="absolute inset-0"
        style={{
          zIndex: 2,
          background: `
            radial-gradient(ellipse 120% 80% at 50% 100%, rgba(30, 10, 60, 0.4) 0%, transparent 60%),
            radial-gradient(ellipse 80% 60% at 80% 20%, rgba(0, 100, 150, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 20% 80%, rgba(100, 0, 100, 0.1) 0%, transparent 40%)
          `,
          pointerEvents: 'none'
        }}
      />

      {/* Logo */}
      <header className="absolute top-8 left-8 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="logo-text text-2xl">STARMAPS</span>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 h-full flex items-center justify-center px-8">
        <div className="flex items-center gap-24 max-w-7xl">
          {/* Planet with parallax - only planet moves, not stars */}
          <div 
            className="relative flex-shrink-0"
            style={{
              transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <canvas 
              ref={canvasRef}
              className="w-[500px] h-[500px]"
              style={{ 
                filter: 'drop-shadow(0 0 80px rgba(100, 60, 200, 0.3))'
              }}
            />
          </div>

          {/* Text content */}
          <div className="flex flex-col max-w-xl">
            <h1 
              className="text-6xl font-bold mb-6 leading-tight"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #E0E7FF 50%, #C4B5FD 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Открой свою
              <br />
              галактику кино
            </h1>
            
            <p className="text-lg text-white/60 mb-8 leading-relaxed font-light">
              Опиши своё настроение — и мы построим звёздную карту фильмов, 
              идеально подходящих именно тебе. AI подберёт уникальные рекомендации 
              из 50+ отобранных картин.
            </p>
            
            <div className="flex flex-col gap-4">
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
            </div>

            {/* Feature highlights */}
            <div className="mt-12 flex gap-8">
              <div className="flex flex-col">
                <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">50+</span>
                <span className="text-sm text-white/40 mt-1">фильмов</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">AI</span>
                <span className="text-sm text-white/40 mt-1">рекомендации</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">∞</span>
                <span className="text-sm text-white/40 mt-1">вдохновения</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)'
        }}
      />
    </div>
  );
};

export default LandingPage;
