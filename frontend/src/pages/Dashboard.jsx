import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Star, Clock, Heart, Sparkles, User, LogOut, X, Camera, ChevronRight, Play, ExternalLink } from 'lucide-react';
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
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const nodesRef = useRef([]);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);

  const exampleQueries = [
    "Как Интерстеллар, но медленнее и без космоса",
    "Мрачный триллер с неожиданной концовкой",
    "Что-то философское про искусственный интеллект",
    "Визуально красивый фильм для вечера",
    "Культовая классика 90-х с глубоким смыслом"
  ];

  // Fetch history and favorites
  useEffect(() => {
    if (user) {
      fetchHistory();
      fetchFavorites();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/history`, { withCredentials: true });
      setHistory(res.data);
    } catch (e) {
      console.error('Error fetching history:', e);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/favorites`, { withCredentials: true });
      setFavorites(res.data);
    } catch (e) {
      console.error('Error fetching favorites:', e);
    }
  };

  // Handle search
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
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Fetch movie detail
  const fetchMovieDetail = async (movieId) => {
    try {
      const res = await axios.get(`${API_URL}/api/movies/${movieId}`);
      setMovieDetail(res.data);
    } catch (e) {
      console.error('Error fetching movie:', e);
    }
  };

  // Toggle favorite
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
    } catch (e) {
      console.error('Error toggling favorite:', e);
    }
  };

  // Update profile
  const updateProfile = async () => {
    try {
      await axios.put(`${API_URL}/api/profile`, { 
        name: profileName, 
        avatar: profileAvatar 
      }, { withCredentials: true });
      setShowProfile(false);
    } catch (e) {
      console.error('Error updating profile:', e);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileAvatar(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Star Map Canvas with larger spread
  useEffect(() => {
    if (!graphData || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size to be larger than viewport
    const containerWidth = canvas.parentElement.clientWidth;
    const containerHeight = canvas.parentElement.clientHeight;
    const canvasWidth = containerWidth * 2;  // 2x viewport for scrolling
    const canvasHeight = containerHeight * 2;
    
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.scale(dpr, dpr);
    
    // Center offset for initial view
    const initialOffsetX = -(canvasWidth - containerWidth) / 2;
    const initialOffsetY = -(canvasHeight - containerHeight) / 2;
    setCanvasOffset({ x: initialOffsetX, y: initialOffsetY });
    
    const nodes = graphData.nodes.map((node, i) => {
      const isTop = node.is_top;
      // Spread nodes widely across the larger canvas
      const angle = (i / graphData.nodes.length) * Math.PI * 2 + Math.random() * 0.5;
      const baseRadius = isTop ? 150 + Math.random() * 200 : 300 + Math.random() * 450;
      
      return {
        ...node,
        x: canvasWidth / 2 + Math.cos(angle) * baseRadius + (Math.random() - 0.5) * 200,
        y: canvasHeight / 2 + Math.sin(angle) * baseRadius + (Math.random() - 0.5) * 200,
        vx: 0,
        vy: 0,
        // Different sizes based on is_top
        size: isTop ? 30 + Math.random() * 15 : 15 + Math.random() * 20,
        glowIntensity: isTop ? 1 : 0.4 + Math.random() * 0.4,
        pulsePhase: Math.random() * Math.PI * 2,
        // Color based on vibe
        color: getVibeColor(node.vibe, isTop)
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
      ctx.fillStyle = 'rgba(1, 2, 4, 0.15)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      time += 0.016;
      
      // Draw connection lines with gradient
      links.forEach(link => {
        if (!link.source || !link.target) return;
        
        const pulse = Math.sin(time * 2 + link.strength * 5) * 0.3 + 0.7;
        const gradient = ctx.createLinearGradient(
          link.source.x, link.source.y,
          link.target.x, link.target.y
        );
        gradient.addColorStop(0, `rgba(139, 92, 246, ${0.1 * link.strength * pulse})`);
        gradient.addColorStop(0.5, `rgba(0, 212, 255, ${0.15 * link.strength * pulse})`);
        gradient.addColorStop(1, `rgba(255, 0, 255, ${0.1 * link.strength * pulse})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1 + link.strength * 1.5;
        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(link.target.x, link.target.y);
        ctx.stroke();
      });
      
      // Draw nodes (stars)
      nodes.forEach((node, i) => {
        const pulse = Math.sin(time * 1.5 + node.pulsePhase) * 0.2 + 0.8;
        const size = node.size * pulse;
        const isHovered = hoveredNode === node.id;
        const isSelected = selectedMovie?.id === node.id;
        const highlight = isHovered || isSelected ? 1.5 : 1;
        
        // Multi-layer glow
        for (let g = 4; g >= 0; g--) {
          const glowSize = size + g * 12 * node.glowIntensity;
          const alpha = (0.15 - g * 0.03) * node.glowIntensity * highlight;
          
          const glowGradient = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, glowSize
          );
          glowGradient.addColorStop(0, node.color.replace(')', `, ${alpha * 2})`).replace('rgb', 'rgba'));
          glowGradient.addColorStop(0.5, node.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba'));
          glowGradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Star core with gradient
        const coreGradient = ctx.createRadialGradient(
          node.x - size * 0.2, node.y - size * 0.2, 0,
          node.x, node.y, size
        );
        coreGradient.addColorStop(0, '#FFFFFF');
        coreGradient.addColorStop(0.3, node.color);
        coreGradient.addColorStop(1, node.color.replace('rgb', 'rgba').replace(')', ', 0.6)'));
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size * highlight, 0, Math.PI * 2);
        ctx.fill();
        
        // Star rays for top movies
        if (node.is_top) {
          const rayCount = 4;
          for (let r = 0; r < rayCount; r++) {
            const rayAngle = (r / rayCount) * Math.PI * 2 + time * 0.3;
            const rayLength = size * 2.5 * pulse;
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * pulse})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(
              node.x + Math.cos(rayAngle) * rayLength,
              node.y + Math.sin(rayAngle) * rayLength
            );
            ctx.stroke();
          }
        }
        
        // Movie title label
        const labelAlpha = isHovered || isSelected ? 1 : 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${labelAlpha})`;
        ctx.font = `${node.is_top ? '600 13px' : '400 11px'} "Space Grotesk", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(node.title_ru || node.title, node.x, node.y + size + 18);
        
        // Year
        ctx.fillStyle = `rgba(180, 180, 200, ${labelAlpha * 0.7})`;
        ctx.font = '300 10px "Inter", sans-serif';
        ctx.fillText(node.year.toString(), node.x, node.y + size + 32);
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [graphData, hoveredNode, selectedMovie]);

  // Get color based on movie vibe
  function getVibeColor(vibe, isTop) {
    const vibeColors = {
      'философ': 'rgb(100, 200, 255)',
      'неонуар': 'rgb(255, 0, 255)',
      'минимал': 'rgb(200, 200, 200)',
      'интеллект': 'rgb(139, 92, 246)',
      'психолог': 'rgb(255, 100, 150)',
      'мрачн': 'rgb(100, 80, 150)',
      'романт': 'rgb(255, 150, 200)',
      'напряж': 'rgb(255, 80, 80)',
      'киберпанк': 'rgb(0, 255, 200)',
      'эпич': 'rgb(255, 180, 50)',
      'камерн': 'rgb(150, 150, 200)',
      'культов': 'rgb(255, 100, 50)',
      'загадочн': 'rgb(180, 100, 255)',
      'хоррор': 'rgb(255, 50, 100)',
      'детектив': 'rgb(100, 150, 200)',
    };
    
    const lowerVibe = (vibe || '').toLowerCase();
    for (const [key, color] of Object.entries(vibeColors)) {
      if (lowerVibe.includes(key)) return color;
    }
    return isTop ? 'rgb(0, 212, 255)' : 'rgb(139, 92, 246)';
  }

  // Canvas mouse handlers
  const handleCanvasMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
  };

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !nodesRef.current.length) return;
    
    if (isDragging) {
      setCanvasOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else {
      // Check hover over nodes
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - canvasOffset.x) * (canvas.width / canvas.clientWidth / (window.devicePixelRatio || 1));
      const y = (e.clientY - rect.top - canvasOffset.y) * (canvas.height / canvas.clientHeight / (window.devicePixelRatio || 1));
      
      let foundNode = null;
      for (const node of nodesRef.current) {
        const dist = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
        if (dist < node.size + 20) {
          foundNode = node.id;
          break;
        }
      }
      setHoveredNode(foundNode);
      canvas.style.cursor = foundNode ? 'pointer' : 'grab';
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = (e) => {
    if (!hoveredNode) return;
    const node = nodesRef.current.find(n => n.id === hoveredNode);
    if (node) {
      setSelectedMovie(node);
      fetchMovieDetail(node.id);
    }
  };

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-[#010204]">
      {/* Cosmic background */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 100% 100% at 30% 20%, rgba(0, 80, 120, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 80% 80% at 70% 80%, rgba(80, 0, 120, 0.1) 0%, transparent 50%)
          `
        }} />
      </div>

      {/* Sidebar - ALWAYS VISIBLE */}
      <aside className="w-72 sidebar-glass flex flex-col z-20 flex-shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="logo-text text-xl">STARMAPS</span>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="p-4 border-b border-white/5">
            <button 
              onClick={() => setShowProfile(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group"
              data-testid="profile-btn"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/30 group-hover:border-purple-500/60 transition-all">
                {profileAvatar || user.picture ? (
                  <img src={profileAvatar || user.picture} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-white/90">{profileName || user.name}</div>
                <div className="text-xs text-white/40">{user.email}</div>
              </div>
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('search')}
            className={`nav-btn ${activeTab === 'search' ? 'active' : ''}`}
            data-testid="nav-search"
          >
            <Search className="w-5 h-5 text-cyan-400" />
            <span className="text-white/80">Поиск</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
            data-testid="nav-history"
          >
            <Clock className="w-5 h-5 text-purple-400" />
            <span className="text-white/80">История</span>
            {history.length > 0 && (
              <span className="ml-auto text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                {history.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('favorites')}
            className={`nav-btn ${activeTab === 'favorites' ? 'active' : ''}`}
            data-testid="nav-favorites"
          >
            <Heart className="w-5 h-5 text-pink-400" />
            <span className="text-white/80">Избранное</span>
            {favorites.length > 0 && (
              <span className="ml-auto text-xs bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full">
                {favorites.length}
              </span>
            )}
          </button>
        </nav>

        {/* History/Favorites list */}
        <div className="flex-1 overflow-auto px-4 pb-4">
          {activeTab === 'history' && (
            <div className="flex flex-col gap-2">
              {history.map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(item.query);
                    handleSearch(item.query);
                    setActiveTab('search');
                  }}
                  className="history-item text-left p-3 rounded-xl text-sm text-white/70 hover:text-white/90 truncate"
                >
                  {item.query}
                </button>
              ))}
              {history.length === 0 && (
                <p className="text-white/30 text-sm text-center py-8">История пуста</p>
              )}
            </div>
          )}
          {activeTab === 'favorites' && (
            <div className="flex flex-col gap-2">
              {favorites.map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedMovie({ id: item.movie_id });
                    fetchMovieDetail(item.movie_id);
                    setActiveTab('search');
                  }}
                  className="history-item flex items-center gap-3 p-2 rounded-xl"
                >
                  {item.movie_poster && (
                    <img src={item.movie_poster} alt="" className="w-10 h-14 object-cover rounded-lg" />
                  )}
                  <span className="text-sm text-white/70 truncate">{item.movie_title}</span>
                </button>
              ))}
              {favorites.length === 0 && (
                <p className="text-white/30 text-sm text-center py-8">Нет избранных</p>
              )}
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-white/5">
          <button 
            onClick={onLogout}
            className="nav-btn text-white/50 hover:text-white/80"
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Search bar - fixed at top */}
        <div className="relative z-20 p-6">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Опиши, какой фильм хочешь найти..."
                className="search-input pr-14"
                data-testid="search-input"
              />
              <button 
                onClick={() => handleSearch()}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 transition-all"
                data-testid="search-btn"
              >
                <Search className="w-5 h-5 text-white" />
              </button>
            </div>
            
            {/* Example queries */}
            {!graphData && !isLoading && (
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {exampleQueries.map((eq, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(eq);
                      handleSearch(eq);
                    }}
                    className="px-4 py-2 rounded-full text-sm text-white/60 border border-white/10 hover:border-purple-500/40 hover:text-white/90 hover:bg-purple-500/10 transition-all"
                    data-testid={`example-query-${i}`}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Star Map Canvas */}
        <div className="flex-1 relative overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-30 bg-[#010204]/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-purple-500 animate-spin" />
                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-pink-400 border-l-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20" />
                </div>
                <span className="text-white/70 font-medium">Строим карту звёзд...</span>
              </div>
            </div>
          )}
          
          {graphData && (
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{ transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)` }}
            >
              <canvas
                ref={canvasRef}
                className="graph-canvas"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onClick={handleCanvasClick}
              />
            </div>
          )}
          
          {!graphData && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/10 to-cyan-500/10 flex items-center justify-center border border-white/5">
                  <Sparkles className="w-16 h-16 text-purple-400/50" />
                </div>
                <h2 className="text-2xl font-semibold text-white/80 mb-2">Введите запрос</h2>
                <p className="text-white/40 max-w-md">
                  Опишите настроение или фильм, который хотите найти, и мы построим для вас звёздную карту рекомендаций
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Query summary */}
        {graphData && !isLoading && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
            <div className="glass-panel-light px-6 py-3 rounded-2xl">
              <p className="text-white/80 text-sm">{graphData.query_summary}</p>
            </div>
          </div>
        )}
      </main>

      {/* Movie Detail Panel */}
      {selectedMovie && movieDetail && (
        <aside className="w-96 glass-panel z-20 flex flex-col overflow-hidden">
          <div className="relative h-56">
            <img 
              src={movieDetail.backdrop || movieDetail.poster} 
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05080F] via-transparent to-transparent" />
            <button 
              onClick={() => { setSelectedMovie(null); setMovieDetail(null); }}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            {/* Favorite button */}
            <button
              onClick={() => toggleFavorite(movieDetail)}
              className="absolute top-4 left-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-all"
              data-testid="favorite-btn"
            >
              <Heart 
                className={`w-5 h-5 ${favorites.some(f => f.movie_id === movieDetail.id) ? 'text-pink-400 fill-pink-400' : 'text-white'}`} 
              />
            </button>
          </div>
          
          <div className="flex-1 p-6 overflow-auto">
            <div className="flex items-start gap-4 mb-4">
              <img 
                src={movieDetail.poster} 
                alt=""
                className="w-20 h-28 object-cover rounded-lg shadow-lg"
              />
              <div>
                <h2 className="text-xl font-bold text-white mb-1">{movieDetail.title_ru}</h2>
                <p className="text-white/50 text-sm mb-2">{movieDetail.title}, {movieDetail.year}</p>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-medium">{movieDetail.rating}</span>
                </div>
              </div>
            </div>
            
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              {movieDetail.description_ru || movieDetail.description}
            </p>
            
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white/90 mb-3">Почему рекомендуем:</h3>
              <div className="flex flex-wrap gap-2">
                {movieDetail.why_recommended?.map((reason, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {reason}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white/90 mb-3">Где смотреть:</h3>
              <div className="flex flex-col gap-2">
                {movieDetail.watch_providers?.map((provider, i) => (
                  <a
                    key={i}
                    href={provider.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-watch"
                  >
                    <Play className="w-4 h-4" />
                    <span>{provider.name}</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="profile-modal w-full max-w-md rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Профиль</h2>
              <button 
                onClick={() => setShowProfile(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            
            <div className="flex flex-col items-center mb-8">
              <label className="avatar-upload cursor-pointer mb-4">
                {profileAvatar ? (
                  <img src={profileAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white/40" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
              <span className="text-sm text-white/40">Нажмите чтобы загрузить фото</span>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm text-white/60 mb-2">Имя</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                placeholder="Ваше имя"
              />
            </div>
            
            <button
              onClick={updateProfile}
              className="btn-primary-neon w-full"
              data-testid="save-profile-btn"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
