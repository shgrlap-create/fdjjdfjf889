import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock, Heart, User, LogOut, X, Upload, Sparkles, Play, ExternalLink, Star, Mail, Send } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = ({ user, onLogout }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetail, setMovieDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('search');
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || user?.picture || '');
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const canvasRef = useRef(null);
  const trailCanvasRef = useRef(null);
  const animationRef = useRef(null);
  const nodesRef = useRef([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const trailRef = useRef([]);

  const exampleQueries = [
    "Как Интерстеллар, но без космоса",
    "Мрачный триллер с неожиданной концовкой",
    "Что-то философское про реальность"
  ];

  useEffect(() => {
    if (user) {
      fetchHistory();
      fetchFavorites();
    }
  }, [user]);

  // Trail effect - smaller, more particles
  useEffect(() => {
    const canvas = trailCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    
    let animationId;
    
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 14, 23, 0.1)';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      
      trailRef.current.forEach((p) => {
        p.life -= 0.035;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        
        if (p.life > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${p.life * 0.2})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      trailRef.current = trailRef.current.filter(p => p.life > 0);
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Mouse trail - smaller, more particles
  useEffect(() => {
    let lastX = 0, lastY = 0;
    
    const handleMouseMove = (e) => {
      // Skip if over canvas
      if (e.target.classList.contains('graph-canvas')) return;
      
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const speed = Math.sqrt(dx * dx + dy * dy);
      
      if (speed > 2) {
        const count = Math.min(Math.floor(speed / 4), 4);
        for (let i = 0; i < count; i++) {
          trailRef.current.push({
            x: e.clientX + (Math.random() - 0.5) * 5,
            y: e.clientY + (Math.random() - 0.5) * 5,
            vx: (Math.random() - 0.5) * 1.2 - dx * 0.02,
            vy: (Math.random() - 0.5) * 1.2 - dy * 0.02,
            size: 0.4 + Math.random() * 0.8,
            life: 0.25 + Math.random() * 0.35
          });
        }
      }
      
      lastX = e.clientX;
      lastY = e.clientY;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/history`, { withCredentials: true });
      setHistory(res.data);
    } catch (e) {}
  };

  const fetchFavorites = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/favorites`, { withCredentials: true });
      setFavorites(res.data);
    } catch (e) {}
  };

  const handleSearch = async (searchQuery) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    
    setIsLoading(true);
    setSelectedMovie(null);
    setMovieDetail(null);
    
    try {
      const res = await axios.post(`${API_URL}/api/movies/recommend`, { query: q }, { withCredentials: true });
      setGraphData(res.data);
      if (user) fetchHistory();
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const fetchMovieDetail = async (movieId) => {
    try {
      const res = await axios.get(`${API_URL}/api/movies/${movieId}`);
      setMovieDetail(res.data);
    } catch (e) {}
  };

  const toggleFavorite = async (movie) => {
    if (!user) return;
    const isFav = favorites.some(f => f.movie_id === movie.id);
    
    try {
      if (isFav) {
        await axios.delete(`${API_URL}/api/favorites/${movie.id}`, { withCredentials: true });
      } else {
        await axios.post(`${API_URL}/api/favorites`, { movie_id: movie.id }, { withCredentials: true });
      }
      fetchFavorites();
    } catch (e) {}
  };

  const updateProfile = async () => {
    try {
      await axios.put(`${API_URL}/api/profile`, { name: profileName, avatar: profileAvatar }, { withCredentials: true });
      setShowProfile(false);
    } catch (e) {}
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setProfileAvatar(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const generateAIAvatar = async () => {
    setGeneratingAvatar(true);
    try {
      const res = await axios.post(`${API_URL}/api/profile/generate-avatar`, {}, { withCredentials: true });
      setProfileAvatar(res.data.avatar);
    } catch (e) {
      console.error('Avatar generation error:', e);
    }
    setGeneratingAvatar(false);
  };

  // Star Map Canvas
  useEffect(() => {
    if (!graphData || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    const containerWidth = canvas.parentElement.clientWidth;
    const containerHeight = canvas.parentElement.clientHeight;
    
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    ctx.scale(dpr, dpr);
    
    const nodes = graphData.nodes.map((node, i) => {
      const isTop = node.is_top;
      const angle = (i / graphData.nodes.length) * Math.PI * 2;
      const baseRadius = isTop ? 80 + Math.random() * 120 : 150 + Math.random() * 250;
      
      return {
        ...node,
        x: containerWidth / 2 + Math.cos(angle) * baseRadius + (Math.random() - 0.5) * 150,
        y: containerHeight / 2 + Math.sin(angle) * baseRadius + (Math.random() - 0.5) * 150,
        size: isTop ? 4 + Math.random() * 2 : 2 + Math.random() * 2.5,
        glowIntensity: isTop ? 0.8 : 0.4 + Math.random() * 0.3,
        pulsePhase: Math.random() * Math.PI * 2
      };
    });
    nodesRef.current = nodes;
    
    const links = graphData.links.map(link => ({
      source: nodes.find(n => n.id === link.source),
      target: nodes.find(n => n.id === link.target),
      strength: link.strength
    })).filter(l => l.source && l.target);
    
    let time = 0;
    
    const animate = () => {
      ctx.fillStyle = '#0A0E17';
      ctx.fillRect(0, 0, containerWidth, containerHeight);
      
      time += 0.008;
      
      // Draw links - dark gold, fully visible
      links.forEach(link => {
        if (!link.source || !link.target) return;
        
        const gradient = ctx.createLinearGradient(
          link.source.x, link.source.y,
          link.target.x, link.target.y
        );
        gradient.addColorStop(0, `rgba(139, 115, 85, ${0.15 + link.strength * 0.1})`);
        gradient.addColorStop(0.5, `rgba(139, 115, 85, ${0.2 + link.strength * 0.15})`);
        gradient.addColorStop(1, `rgba(139, 115, 85, ${0.15 + link.strength * 0.1})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 0.5 + link.strength * 0.5;
        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(link.target.x, link.target.y);
        ctx.stroke();
      });
      
      // Draw stars
      nodes.forEach((node) => {
        const pulse = Math.sin(time * 1.5 + node.pulsePhase) * 0.15 + 0.85;
        const size = node.size * pulse;
        const isHovered = hoveredNode === node.id;
        const isSelected = selectedMovie?.id === node.id;
        const highlight = isHovered || isSelected ? 1.3 : 1;
        
        // Soft glow
        const glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 6);
        glowGradient.addColorStop(0, `rgba(255, 255, 255, ${0.08 * node.glowIntensity * highlight})`);
        glowGradient.addColorStop(0.5, `rgba(200, 200, 220, ${0.03 * node.glowIntensity})`);
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size * 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        const coreGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * highlight);
        coreGradient.addColorStop(0, '#FFFFFF');
        coreGradient.addColorStop(0.5, node.is_top ? '#E8E6FF' : '#D0D4E0');
        coreGradient.addColorStop(1, `rgba(200, 210, 230, 0.5)`);
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size * highlight, 0, Math.PI * 2);
        ctx.fill();
        
        // Label
        const labelAlpha = isHovered || isSelected ? 0.9 : 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${labelAlpha})`;
        ctx.font = `${node.is_top ? '500 11px' : '400 10px'} "Raleway", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(node.title_ru || node.title, node.x, node.y + size + 14);
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [graphData, hoveredNode, selectedMovie]);

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !nodesRef.current.length) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let foundNode = null;
    for (const node of nodesRef.current) {
      const dist = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
      if (dist < 25) {
        foundNode = node.id;
        break;
      }
    }
    setHoveredNode(foundNode);
  };

  const handleCanvasClick = () => {
    if (!hoveredNode) return;
    const node = nodesRef.current.find(n => n.id === hoveredNode);
    if (node) {
      setSelectedMovie(node);
      fetchMovieDetail(node.id);
    }
  };

  return (
    <div className="fixed inset-0 flex overflow-hidden" style={{ background: '#0A0E17' }}>
      {/* Trail canvas */}
      <canvas ref={trailCanvasRef} className="trail-canvas" />
      
      {/* Sidebar */}
      <aside className="w-64 sidebar-glass flex flex-col z-20 flex-shrink-0">
        <div className="p-5 border-b" style={{ borderColor: 'rgba(201, 162, 39, 0.1)' }}>
          <span className="logo-text text-lg">STARMAPS</span>
        </div>

        {user && (
          <div className="p-4 border-b" style={{ borderColor: 'rgba(201, 162, 39, 0.1)' }}>
            <button 
              onClick={() => setShowProfile(true)}
              className="w-full flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-all"
              data-testid="profile-btn"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden" style={{ border: '1px solid rgba(201, 162, 39, 0.3)' }}>
                {profileAvatar || user.picture ? (
                  <img src={profileAvatar || user.picture} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(201, 162, 39, 0.1)' }}>
                    <User className="w-5 h-5 text-white/50" />
                  </div>
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm text-white/80">{profileName || user.name}</div>
                <div className="text-xs text-white/30">{user.email}</div>
              </div>
            </button>
          </div>
        )}

        <nav className="p-3 flex flex-col gap-1">
          <button onClick={() => setActiveTab('search')} className={`nav-btn ${activeTab === 'search' ? 'active' : ''}`}>
            <Search className="w-4 h-4" style={{ color: '#C9A227' }} />
            <span className="text-white/70">Поиск</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}>
            <Clock className="w-4 h-4" style={{ color: '#8B7355' }} />
            <span className="text-white/70">История</span>
            {history.length > 0 && <span className="ml-auto text-xs text-white/30">{history.length}</span>}
          </button>
          <button onClick={() => setActiveTab('favorites')} className={`nav-btn ${activeTab === 'favorites' ? 'active' : ''}`}>
            <Heart className="w-4 h-4" style={{ color: '#8B7355' }} />
            <span className="text-white/70">Избранное</span>
            {favorites.length > 0 && <span className="ml-auto text-xs text-white/30">{favorites.length}</span>}
          </button>
        </nav>

        <div className="flex-1 overflow-auto px-3 pb-3">
          {activeTab === 'history' && (
            <div className="flex flex-col gap-1">
              {history.map((item, i) => (
                <button key={i} onClick={() => { setQuery(item.query); handleSearch(item.query); setActiveTab('search'); }}
                  className="history-item text-left p-2 rounded text-xs text-white/50 hover:text-white/80 truncate">
                  {item.query}
                </button>
              ))}
              {history.length === 0 && <p className="text-white/20 text-xs text-center py-6">История пуста</p>}
            </div>
          )}
          {activeTab === 'favorites' && (
            <div className="flex flex-col gap-1">
              {favorites.map((item, i) => (
                <button key={i} onClick={() => { setSelectedMovie({ id: item.movie_id }); fetchMovieDetail(item.movie_id); setActiveTab('search'); }}
                  className="history-item flex items-center gap-2 p-2 rounded">
                  {item.movie_poster && <img src={item.movie_poster} alt="" className="w-8 h-10 object-cover rounded" />}
                  <span className="text-xs text-white/50 truncate">{item.movie_title}</span>
                </button>
              ))}
              {favorites.length === 0 && <p className="text-white/20 text-xs text-center py-6">Нет избранных</p>}
            </div>
          )}
        </div>

        {/* Contacts */}
        <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(201, 162, 39, 0.1)' }}>
          <p className="text-xs text-white/25 mb-2 tracking-wider">КОНТАКТЫ</p>
          <div className="flex flex-col gap-1.5">
            <a href="mailto:rabocijakaunt74@gmail.com" className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors">
              <Mail className="w-3 h-3" style={{ color: '#5090D0' }} />
              <span className="truncate">rabocijakaunt74@gmail.com</span>
            </a>
            <a href="https://t.me/negrwhite" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors">
              <Send className="w-3 h-3" style={{ color: '#5090D0' }} />
              <span>@negrwhite</span>
            </a>
          </div>
        </div>

        <div className="p-3 border-t" style={{ borderColor: 'rgba(201, 162, 39, 0.1)' }}>
          <button onClick={onLogout} className="nav-btn text-white/40 hover:text-white/70">
            <LogOut className="w-4 h-4" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="relative z-20 p-5">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyPress={handleKeyPress}
                placeholder="Опишите, какой фильм ищете..." className="search-input pr-12" data-testid="search-input"
              />
              <button onClick={() => handleSearch()} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded" style={{ background: 'rgba(201, 162, 39, 0.2)' }}>
                <Search className="w-4 h-4" style={{ color: '#C9A227' }} />
              </button>
            </div>
            
            {!graphData && !isLoading && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {exampleQueries.map((eq, i) => (
                  <button key={i} onClick={() => { setQuery(eq); handleSearch(eq); }}
                    className="px-3 py-1.5 rounded text-xs text-white/40 border border-white/10 hover:border-amber-700/40 hover:text-white/70 transition-all">
                    {eq}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-30" style={{ background: 'rgba(10, 14, 23, 0.9)' }}>
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border border-white/20 border-t-amber-600 rounded-full animate-spin" />
                <span className="text-white/50 text-sm">Строим карту...</span>
              </div>
            </div>
          )}
          
          {graphData && (
            <canvas ref={canvasRef} className="graph-canvas w-full h-full"
              onMouseMove={handleCanvasMouseMove} onClick={handleCanvasClick} />
          )}
          
          {!graphData && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(201, 162, 39, 0.05)', border: '1px solid rgba(201, 162, 39, 0.1)' }}>
                  <Search className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-white/30 text-sm">Введите запрос для поиска</p>
              </div>
            </div>
          )}
        </div>

        {graphData && !isLoading && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
            <div className="glass-panel-light px-4 py-2 rounded">
              <p className="text-white/60 text-xs">{graphData.query_summary}</p>
            </div>
          </div>
        )}
      </main>

      {/* Movie Detail */}
      {selectedMovie && movieDetail && (
        <aside className="w-80 glass-panel z-20 flex flex-col overflow-hidden">
          <div className="relative h-44">
            <img src={movieDetail.backdrop || movieDetail.poster} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0F1522, transparent)' }} />
            <button onClick={() => { setSelectedMovie(null); setMovieDetail(null); }}
              className="absolute top-3 right-3 p-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.5)' }}>
              <X className="w-4 h-4 text-white" />
            </button>
            <button onClick={() => toggleFavorite(movieDetail)} className="absolute top-3 left-3 p-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.5)' }}>
              <Heart className={`w-4 h-4 ${favorites.some(f => f.movie_id === movieDetail.id) ? 'text-amber-500 fill-amber-500' : 'text-white'}`} />
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-auto">
            <div className="flex items-start gap-3 mb-3">
              <img src={movieDetail.poster} alt="" className="w-14 h-20 object-cover rounded" />
              <div>
                <h2 className="text-base font-medium text-white mb-1">{movieDetail.title_ru}</h2>
                <p className="text-white/40 text-xs mb-1">{movieDetail.title}, {movieDetail.year}</p>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" style={{ color: '#C9A227', fill: '#C9A227' }} />
                  <span className="text-white text-xs">{movieDetail.rating}</span>
                </div>
              </div>
            </div>
            
            <p className="text-white/50 text-xs leading-relaxed mb-4">{movieDetail.description_ru || movieDetail.description}</p>
            
            <div className="mb-4">
              <h3 className="text-xs font-medium text-white/70 mb-2">Почему рекомендуем:</h3>
              <div className="flex flex-wrap gap-1">
                {movieDetail.why_recommended?.map((reason, i) => (
                  <span key={i} className="px-2 py-1 rounded text-xs" style={{ background: 'rgba(201, 162, 39, 0.1)', color: 'rgba(201, 162, 39, 0.8)' }}>
                    {reason}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-xs font-medium text-white/70 mb-2">Где смотреть:</h3>
              <div className="flex flex-col gap-1">
                {movieDetail.watch_providers?.map((provider, i) => (
                  <a key={i} href={provider.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded text-xs text-white/60 hover:text-white transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <Play className="w-3 h-3" />
                    <span>{provider.name}</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div className="modal-overlay">
          <div className="modal-content p-6 max-w-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Профиль</h2>
              <button onClick={() => setShowProfile(false)} className="p-1 rounded hover:bg-white/10">
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>
            
            <div className="flex gap-4 mb-6">
              <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0" style={{ border: '1px solid rgba(201, 162, 39, 0.3)' }}>
                {profileAvatar ? (
                  <img src={profileAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(201, 162, 39, 0.1)' }}>
                    <User className="w-8 h-8 text-white/30" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2 justify-center">
                <label className="avatar-btn-normal flex items-center gap-2 cursor-pointer">
                  <Upload className="w-3 h-3" />
                  <span>Загрузить</span>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
                <button onClick={generateAIAvatar} disabled={generatingAvatar}
                  className="avatar-btn-ai flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  <span>{generatingAvatar ? 'Генерация...' : 'AI Аватар'}</span>
                </button>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-xs text-white/50 mb-2">Имя</label>
              <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-amber-700/50"
                placeholder="Ваше имя" />
            </div>
            
            <button onClick={updateProfile} className="btn-primary w-full mb-4">
              Сохранить
            </button>

            {/* Contacts in profile */}
            <div className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <p className="text-xs text-white/25 mb-2 tracking-wider">КОНТАКТЫ</p>
              <div className="flex flex-col gap-1.5">
                <a href="mailto:rabocijakaunt74@gmail.com" className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors">
                  <Mail className="w-3 h-3" style={{ color: '#5090D0' }} />
                  <span>rabocijakaunt74@gmail.com</span>
                </a>
                <a href="https://t.me/negrwhite" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors">
                  <Send className="w-3 h-3" style={{ color: '#5090D0' }} />
                  <span>@negrwhite</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
