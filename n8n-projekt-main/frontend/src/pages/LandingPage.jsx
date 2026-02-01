import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import { API, AuthContext } from "../App";

// Star Dust Particles - iPhone style
const StarDust = () => {
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 80; i++) {
      arr.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 8,
        duration: 6 + Math.random() * 6,
        isGold: Math.random() > 0.85
      });
    }
    return arr;
  }, []);

  return (
    <div className="star-dust">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`dust-particle ${p.isGold ? 'gold' : ''}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`
          }}
        />
      ))}
    </div>
  );
};

// Deep Space Background with twinkling stars
const DeepSpaceBackground = () => {
  const stars = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 300; i++) {
      arr.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.1,
        twinkleDelay: Math.random() * 5,
        twinkleDuration: 2 + Math.random() * 3
      });
    }
    return arr;
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient nebula effect */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 30%, rgba(79, 70, 229, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 70%, rgba(0, 212, 255, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse 50% 30% at 50% 50%, rgba(0, 100, 150, 0.08) 0%, transparent 50%)
          `
        }}
      />
      
      {/* Stars */}
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            background: star.size > 1.5 
              ? 'radial-gradient(circle, rgba(0, 212, 255, 0.9) 0%, rgba(0, 212, 255, 0.3) 50%, transparent 100%)'
              : 'rgba(255, 255, 255, 0.8)',
            opacity: star.opacity,
            animation: star.size > 1 ? `star-twinkle ${star.twinkleDuration}s ease-in-out infinite` : 'none',
            animationDelay: `${star.twinkleDelay}s`,
            boxShadow: star.size > 1.5 ? '0 0 6px rgba(0, 212, 255, 0.5)' : 'none'
          }}
        />
      ))}
    </div>
  );
};

// Beautiful Earth Planet with WebGL-like quality
const EarthPlanet = () => {
  const canvasRef = useRef(null);
  const rotationRef = useRef(0);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const size = 340;
    canvas.width = size;
    canvas.height = size;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 130;

    const animate = () => {
      rotationRef.current += 0.002;
      ctx.clearRect(0, 0, size, size);

      // Outer atmosphere glow
      const outerGlow = ctx.createRadialGradient(centerX, centerY, radius, centerX, centerY, radius * 1.4);
      outerGlow.addColorStop(0, 'rgba(0, 212, 255, 0.15)');
      outerGlow.addColorStop(0.5, 'rgba(0, 212, 255, 0.05)');
      outerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Planet base - dark blue ocean
      const planetGradient = ctx.createRadialGradient(
        centerX - radius * 0.3, centerY - radius * 0.3, 0,
        centerX, centerY, radius
      );
      planetGradient.addColorStop(0, '#1a3a5c');
      planetGradient.addColorStop(0.5, '#0d2840');
      planetGradient.addColorStop(1, '#061525');
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = planetGradient;
      ctx.fill();
      ctx.clip();

      // Continents (simplified)
      const drawContinent = (startAngle, width, height, offsetY) => {
        const angle = startAngle + rotationRef.current;
        const x = centerX + Math.cos(angle) * radius * 0.6;
        const y = centerY + offsetY;
        const visible = Math.cos(angle) > -0.3;
        
        if (visible) {
          const scale = (Math.cos(angle) + 0.3) / 1.3;
          ctx.save();
          ctx.translate(x, y);
          ctx.scale(scale, 1);
          
          const continentGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, width);
          continentGrad.addColorStop(0, 'rgba(34, 85, 102, 0.8)');
          continentGrad.addColorStop(0.7, 'rgba(25, 65, 82, 0.6)');
          continentGrad.addColorStop(1, 'transparent');
          
          ctx.fillStyle = continentGrad;
          ctx.beginPath();
          ctx.ellipse(0, 0, width * scale, height, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      };

      // Draw multiple "continents"
      drawContinent(0, 45, 30, -30);
      drawContinent(Math.PI * 0.7, 55, 40, 10);
      drawContinent(Math.PI * 1.3, 35, 25, -50);
      drawContinent(Math.PI * 1.8, 40, 35, 40);
      drawContinent(Math.PI * 0.4, 30, 20, 60);

      // City lights (golden dots)
      const drawCityLights = () => {
        const cities = [
          { angle: 0.2, lat: -0.2, size: 3 },
          { angle: 0.8, lat: 0.1, size: 2.5 },
          { angle: 1.5, lat: -0.3, size: 2 },
          { angle: 2.2, lat: 0.2, size: 3 },
          { angle: 2.8, lat: -0.1, size: 2 },
          { angle: 3.5, lat: 0.3, size: 2.5 },
          { angle: 4.2, lat: -0.2, size: 2 },
          { angle: 4.8, lat: 0.1, size: 3 },
          { angle: 5.5, lat: -0.3, size: 2.5 },
        ];

        cities.forEach(city => {
          const angle = city.angle + rotationRef.current;
          const visible = Math.cos(angle) > 0;
          if (visible) {
            const x = centerX + Math.cos(angle) * radius * 0.7;
            const y = centerY + city.lat * radius * 0.8;
            const brightness = Math.cos(angle);
            
            ctx.fillStyle = `rgba(255, 215, 0, ${brightness * 0.8})`;
            ctx.beginPath();
            ctx.arc(x, y, city.size * brightness, 0, Math.PI * 2);
            ctx.fill();
            
            // Glow
            const glow = ctx.createRadialGradient(x, y, 0, x, y, city.size * 4);
            glow.addColorStop(0, `rgba(255, 215, 0, ${brightness * 0.4})`);
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(x, y, city.size * 4, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      };

      drawCityLights();

      // Clouds layer
      const drawClouds = () => {
        const clouds = [
          { angle: 0.5, lat: -0.15, width: 40, height: 15 },
          { angle: 1.8, lat: 0.25, width: 50, height: 18 },
          { angle: 3.2, lat: -0.3, width: 35, height: 12 },
          { angle: 4.5, lat: 0.1, width: 45, height: 16 },
          { angle: 5.8, lat: -0.2, width: 30, height: 10 },
        ];

        clouds.forEach(cloud => {
          const angle = cloud.angle + rotationRef.current * 1.1;
          const visible = Math.cos(angle) > -0.2;
          if (visible) {
            const scale = (Math.cos(angle) + 0.2) / 1.2;
            const x = centerX + Math.cos(angle) * radius * 0.75;
            const y = centerY + cloud.lat * radius;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${scale * 0.15})`;
            ctx.beginPath();
            ctx.ellipse(x, y, cloud.width * scale, cloud.height, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      };

      drawClouds();

      ctx.restore();

      // Inner atmosphere rim
      const rimGradient = ctx.createRadialGradient(centerX, centerY, radius * 0.95, centerX, centerY, radius);
      rimGradient.addColorStop(0, 'transparent');
      rimGradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.1)');
      rimGradient.addColorStop(1, 'rgba(0, 212, 255, 0.3)');
      
      ctx.strokeStyle = rimGradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Specular highlight
      const specular = ctx.createRadialGradient(
        centerX - radius * 0.4, centerY - radius * 0.4, 0,
        centerX - radius * 0.4, centerY - radius * 0.4, radius * 0.5
      );
      specular.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      specular.addColorStop(1, 'transparent');
      ctx.fillStyle = specular;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <canvas 
        ref={canvasRef} 
        className="w-[340px] h-[340px]"
        style={{ filter: 'drop-shadow(0 0 40px rgba(0, 212, 255, 0.3))' }}
      />
      
      {/* Orbital ring */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          border: '1px solid rgba(0, 212, 255, 0.15)',
          transform: 'scale(1.25) rotateX(75deg)',
          boxShadow: '0 0 20px rgba(0, 212, 255, 0.1)'
        }}
      />
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (AuthContext.user && !AuthContext.isLoading) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleGoogleAuth = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Введите email");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/auth/magic-link`, { email });
      toast.success("Magic link отправлен!");
      
      if (response.data.demo_token) {
        const verifyResponse = await axios.post(
          `${API}/auth/magic-link/verify`,
          { token: response.data.demo_token },
          { withCredentials: true }
        );
        AuthContext.setUser(verifyResponse.data);
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error("Ошибка отправки");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccess = () => {
    navigate("/dashboard");
  };

  return (
    <div className="h-screen w-screen bg-[#020305] relative overflow-hidden">
      {/* Deep Space Background */}
      <DeepSpaceBackground />
      
      {/* Star Dust Particles */}
      <StarDust />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-center text-xl sm:text-2xl font-light text-white/70 mb-12 tracking-wide"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          Вход в интеллектуальную систему подбора фильмов
        </motion.h1>

        {/* Earth Planet */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="mb-12"
        >
          <EarthPlanet />
        </motion.div>

        {/* Auth Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-4 w-full max-w-sm"
        >
          {!showEmailLogin ? (
            <>
              {/* Google Auth */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                data-testid="google-auth-btn"
                onClick={handleGoogleAuth}
                className="btn-auth"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Войти через Google
              </motion.button>

              {/* Demo access */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                onClick={handleDemoAccess}
                className="text-white/35 hover:text-white/60 transition-colors text-sm mt-4"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Продолжить без входа →
              </motion.button>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel rounded-2xl p-6"
            >
              <button
                onClick={() => setShowEmailLogin(false)}
                className="text-white/35 hover:text-white text-sm mb-4"
              >
                ← Назад
              </button>
              
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <Input
                    data-testid="email-input"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 bg-[#0a1628] border-white/10 rounded-xl py-3 text-white placeholder:text-white/30"
                  />
                </div>
                
                <Button
                  data-testid="magic-link-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary-neon"
                >
                  {isLoading ? "Отправка..." : "Получить ссылку"}
                </Button>
              </form>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;
