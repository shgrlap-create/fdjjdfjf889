import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  History,
  LogOut,
  X,
  Loader2,
  AlertCircle,
  Home,
  Heart,
  Play,
  ChevronRight,
  Bookmark,
  Star,
  Clock,
  Sparkles,
  Trash2,
  User,
  Mail
} from "lucide-react";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Skeleton } from "../components/ui/skeleton";
import { toast } from "sonner";
import axios from "axios";
import { API, AuthContext } from "../App";

// ============== PREMIUM STAR MAP WITH SMOOTH PHYSICS ==============
const PremiumStarMap = ({ graphData, selectedNode, hoveredNode, onNodeClick, onNodeHover }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, clickX: 0, clickY: 0 });
  const [draggedNode, setDraggedNode] = useState(null);
  const nodesRef = useRef([]);
  const dustParticlesRef = useRef([]);
  const animationRef = useRef(null);
  const timeRef = useRef(0);
  const appearanceRef = useRef(0);
  const mousePositionRef = useRef({ x: 0, y: 0, active: false });
  
  // Initialize background stars (реалистичные далёкие звёзды)
  useEffect(() => {
    const particles = [];
    // Маленькие далёкие звёзды - более разреженные и тусклые
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * 2000 - 500,
        y: Math.random() * 1500 - 300,
        size: Math.random() * 1.5 + 0.3,  // Меньше размер
        speed: 0.02 + Math.random() * 0.05, // Медленнее
        angle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.3 + Math.random() * 1.5,
        twinkleOffset: Math.random() * Math.PI * 2,
        isGold: Math.random() > 0.97,  // Редкие золотые
        isBright: Math.random() > 0.92  // Редкие яркие
      });
    }
    dustParticlesRef.current = particles;
  }, []);
  
  // Position nodes in SPREAD OUT constellation - using golden spiral + force layout
  useEffect(() => {
    if (!graphData?.nodes) return;
    
    // Canvas takes full dimensions of container
    const padding = 80;
    
    const availableWidth = dimensions.width - padding * 2;
    const availableHeight = dimensions.height - padding * 2;
    // Shift center slightly left to account for visual balance
    const centerX = dimensions.width * 0.45;
    const centerY = dimensions.height * 0.5;
    
    const sortedNodes = [...graphData.nodes].sort((a, b) => {
      if (a.is_top && !b.is_top) return -1;
      if (!a.is_top && b.is_top) return 1;
      return 0;
    });
    
    const totalNodes = sortedNodes.length;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees
    
    // Calculate appropriate spread radius based on screen size and node count
    const maxRadius = Math.min(availableWidth, availableHeight) * 0.42;
    
    // First pass: place nodes in golden spiral pattern (spread across screen)
    const tempNodes = sortedNodes.map((node, i) => {
      const isTop = node.is_top;
      const topCount = sortedNodes.filter(n => n.is_top).length;
      const topIndex = sortedNodes.filter((n, idx) => n.is_top && idx < i).length;
      const nonTopIndex = sortedNodes.filter((n, idx) => !n.is_top && idx < i).length;
      
      let x, y;
      if (isTop) {
        // TOP nodes in a central spiral pattern
        const angle = topIndex * goldenAngle;
        const radiusFactor = (topIndex + 1) / (topCount + 1);
        const radius = maxRadius * 0.5 * Math.sqrt(radiusFactor) + 50;
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      } else {
        // Secondary nodes spread in larger spiral
        const angle = (nonTopIndex + topCount) * goldenAngle;
        const radiusFactor = (nonTopIndex + 1) / (totalNodes - topCount + 1);
        const radius = maxRadius * 0.95 * Math.sqrt(radiusFactor) + 90;
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      }
      
      // Add some randomness for natural look
      x += (Math.random() - 0.5) * 50;
      y += (Math.random() - 0.5) * 50;
      
      // Clamp to screen bounds
      x = Math.max(padding, Math.min(dimensions.width - padding, x));
      y = Math.max(padding + 30, Math.min(dimensions.height - padding - 30, y));
      
      return {
        ...node,
        x, y,
        originalX: x,
        originalY: y,
        vx: 0,
        vy: 0,
        radius: isTop ? 12 : 7,
        glowRadius: isTop ? 35 : 22,
        appearDelay: i * 0.06,
        appeared: false,
        pulseOffset: Math.random() * Math.PI * 2
      };
    });
    
    // Second pass: apply force-directed repulsion to avoid overlaps
    const minDistance = 85;
    const iterations = 40;
    
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < tempNodes.length; i++) {
        for (let j = i + 1; j < tempNodes.length; j++) {
          const nodeA = tempNodes[i];
          const nodeB = tempNodes[j];
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < minDistance && dist > 0) {
            const force = (minDistance - dist) / dist * 0.5;
            const moveX = dx * force;
            const moveY = dy * force;
            
            nodeA.x -= moveX;
            nodeA.y -= moveY;
            nodeB.x += moveX;
            nodeB.y += moveY;
            
            // Keep within bounds
            nodeA.x = Math.max(padding, Math.min(dimensions.width - padding, nodeA.x));
            nodeA.y = Math.max(padding + 30, Math.min(dimensions.height - padding - 30, nodeA.y));
            nodeB.x = Math.max(padding, Math.min(dimensions.width - padding, nodeB.x));
            nodeB.y = Math.max(padding + 30, Math.min(dimensions.height - padding - 30, nodeB.y));
          }
        }
      }
    }
    
    // Update original positions after spreading
    tempNodes.forEach(node => {
      node.originalX = node.x;
      node.originalY = node.y;
    });
    
    nodesRef.current = tempNodes;
    appearanceRef.current = 0;
  }, [graphData, dimensions]);
  
  // Update dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);
  
  // Main animation loop with smooth physics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const animate = () => {
      timeRef.current += 0.016;
      appearanceRef.current += 0.016;
      
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      
      // Deep space gradient background
      const bgGradient = ctx.createRadialGradient(
        dimensions.width / 2, dimensions.height / 2, 0,
        dimensions.width / 2, dimensions.height / 2, dimensions.width * 0.8
      );
      bgGradient.addColorStop(0, '#040608');
      bgGradient.addColorStop(0.5, '#020305');
      bgGradient.addColorStop(1, '#010203');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      
      // Nebula effect
      const nebulaGradient = ctx.createRadialGradient(
        dimensions.width * 0.3, dimensions.height * 0.4, 0,
        dimensions.width * 0.3, dimensions.height * 0.4, 300
      );
      nebulaGradient.addColorStop(0, 'rgba(79, 70, 229, 0.03)');
      nebulaGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = nebulaGradient;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      
      const nebulaGradient2 = ctx.createRadialGradient(
        dimensions.width * 0.7, dimensions.height * 0.6, 0,
        dimensions.width * 0.7, dimensions.height * 0.6, 250
      );
      nebulaGradient2.addColorStop(0, 'rgba(0, 212, 255, 0.02)');
      nebulaGradient2.addColorStop(1, 'transparent');
      ctx.fillStyle = nebulaGradient2;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      
      // Draw dust particles (много пыли!)
      dustParticlesRef.current.forEach(particle => {
        // Subtle movement
        particle.x += Math.cos(particle.angle) * particle.speed * 0.5;
        particle.y += Math.sin(particle.angle) * particle.speed * 0.3;
        
        // Wrap around
        if (particle.x < -100) particle.x = dimensions.width + 100;
        if (particle.x > dimensions.width + 100) particle.x = -100;
        if (particle.y < -100) particle.y = dimensions.height + 100;
        if (particle.y > dimensions.height + 100) particle.y = -100;
        
        const twinkle = Math.sin(timeRef.current * particle.twinkleSpeed + particle.twinkleOffset) * 0.4 + 0.6;
        const alpha = (particle.isBright ? 0.6 : 0.25) * twinkle;
        
        if (particle.isBright) {
          // Glowing particle
          const glow = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 4
          );
          if (particle.isGold) {
            glow.addColorStop(0, `rgba(255, 215, 0, ${alpha})`);
            glow.addColorStop(0.5, `rgba(255, 215, 0, ${alpha * 0.3})`);
          } else {
            glow.addColorStop(0, `rgba(0, 212, 255, ${alpha})`);
            glow.addColorStop(0.5, `rgba(0, 212, 255, ${alpha * 0.3})`);
          }
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 4, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Core
        ctx.fillStyle = particle.isGold 
          ? `rgba(255, 215, 0, ${alpha})` 
          : `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // ============ SMOOTH PHYSICS WITH MAGNETIC EFFECT ============
      const nodes = nodesRef.current;
      const dragId = draggedNode?.id;
      const mousePos = mousePositionRef.current;
      
      // Get world-space mouse position
      const worldMouseX = mousePos.active ? (mousePos.x - camera.x) / camera.zoom : 0;
      const worldMouseY = mousePos.active ? (mousePos.y - camera.y) / camera.zoom : 0;
      
      nodes.forEach(node => {
        if (!node.appeared) return;
        if (node.id === dragId) return; // Skip dragged node
        
        // Spring force to original position (SMOOTH ELASTIC)
        const dx = node.originalX - node.x;
        const dy = node.originalY - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0.1) {
          // Smooth spring with easing - gentle pull back
          const springStrength = 0.025;
          node.vx += dx * springStrength;
          node.vy += dy * springStrength;
        }
        
        // MAGNETIC ATTRACTION to mouse cursor (soft pull)
        if (mousePos.active && !dragId) {
          const mdx = worldMouseX - node.x;
          const mdy = worldMouseY - node.y;
          const mouseDist = Math.sqrt(mdx * mdx + mdy * mdy);
          const magnetRange = 150; // Range of magnetic effect
          
          if (mouseDist < magnetRange && mouseDist > 20) {
            // Soft attraction - stronger closer to mouse
            const attractionStrength = (1 - mouseDist / magnetRange) * 0.8;
            const easing = Math.pow(attractionStrength, 2); // Quadratic easing for smoothness
            node.vx += (mdx / mouseDist) * easing;
            node.vy += (mdy / mouseDist) * easing;
          }
        }
        
        // SMOOTH REPULSION from dragged node
        if (dragId) {
          const dragNode = nodes.find(n => n.id === dragId);
          if (dragNode) {
            const rdx = node.x - dragNode.x;
            const rdy = node.y - dragNode.y;
            const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
            const minDist = 120;
            
            if (rdist < minDist && rdist > 0) {
              // Smooth exponential repulsion
              const repelFactor = Math.pow((minDist - rdist) / minDist, 2);
              const repelStrength = repelFactor * 4;
              node.vx += (rdx / rdist) * repelStrength;
              node.vy += (rdy / rdist) * repelStrength;
            }
          }
        }
        
        // MUTUAL REPULSION between nodes (prevent overlapping during zoom)
        nodes.forEach(otherNode => {
          if (otherNode.id === node.id || !otherNode.appeared) return;
          
          const ndx = node.x - otherNode.x;
          const ndy = node.y - otherNode.y;
          const nodeDist = Math.sqrt(ndx * ndx + ndy * ndy);
          const minNodeDist = 70 / camera.zoom; // Adjust for zoom level
          
          if (nodeDist < minNodeDist && nodeDist > 0) {
            const pushForce = (minNodeDist - nodeDist) / minNodeDist * 0.3;
            node.vx += (ndx / nodeDist) * pushForce;
            node.vy += (ndy / nodeDist) * pushForce;
          }
        });
        
        // SMOOTH DAMPING with velocity limit
        node.vx *= 0.92;
        node.vy *= 0.92;
        
        // Limit max velocity for smoothness
        const maxVel = 8;
        const vel = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (vel > maxVel) {
          node.vx = (node.vx / vel) * maxVel;
          node.vy = (node.vy / vel) * maxVel;
        }
        
        // Apply velocity
        node.x += node.vx;
        node.y += node.vy;
      });
      
      // Camera transform
      ctx.save();
      ctx.translate(camera.x, camera.y);
      ctx.scale(camera.zoom, camera.zoom);
      
      // Draw connections
      if (graphData?.links) {
        graphData.links.forEach(link => {
          const sourceNode = nodes.find(n => n.id === link.source);
          const targetNode = nodes.find(n => n.id === link.target);
          
          if (sourceNode && targetNode && sourceNode.appeared && targetNode.appeared) {
            const isHighlighted = 
              (selectedNode && (link.source === selectedNode.id || link.target === selectedNode.id)) ||
              (hoveredNode && (link.source === hoveredNode.id || link.target === hoveredNode.id));
            
            if (isHighlighted) {
              // Glowing line
              ctx.shadowColor = '#00D4FF';
              ctx.shadowBlur = 15;
              ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
              ctx.lineWidth = 2;
            } else {
              ctx.shadowBlur = 0;
              ctx.strokeStyle = 'rgba(79, 70, 229, 0.15)';
              ctx.lineWidth = 0.5;
            }
            
            ctx.beginPath();
            ctx.moveTo(sourceNode.x, sourceNode.y);
            ctx.lineTo(targetNode.x, targetNode.y);
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        });
      }
      
      // Draw stars (premium design)
      nodes.forEach(node => {
        const shouldAppear = appearanceRef.current > node.appearDelay;
        if (shouldAppear && !node.appeared) {
          node.appeared = true;
        }
        if (!node.appeared) return;
        
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode?.id === node.id;
        const isDragged = draggedNode?.id === node.id;
        const isTop = node.is_top;
        
        // Appearance animation
        const appearProgress = Math.min(1, (appearanceRef.current - node.appearDelay) / 0.5);
        const scale = 0.3 + appearProgress * 0.7;
        const opacity = appearProgress;
        
        // Pulse animation
        const pulse = Math.sin(timeRef.current * 2 + node.pulseOffset) * 0.15 + 1;
        
        const radius = node.radius * scale;
        const glowRadius = node.glowRadius * scale * pulse;
        
        // ===== OUTER GLOW (большой ореол) =====
        if (opacity > 0.3) {
          const outerGlow = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, glowRadius * 2.5
          );
          
          if (isSelected || isDragged) {
            // Gold glow for selected
            outerGlow.addColorStop(0, `rgba(255, 215, 0, ${0.6 * opacity})`);
            outerGlow.addColorStop(0.2, `rgba(255, 215, 0, ${0.3 * opacity})`);
            outerGlow.addColorStop(0.5, `rgba(0, 212, 255, ${0.15 * opacity})`);
            outerGlow.addColorStop(1, 'transparent');
          } else if (isHovered) {
            outerGlow.addColorStop(0, `rgba(0, 230, 255, ${0.5 * opacity})`);
            outerGlow.addColorStop(0.3, `rgba(0, 212, 255, ${0.25 * opacity})`);
            outerGlow.addColorStop(1, 'transparent');
          } else if (isTop) {
            // Neon blue for TOP
            outerGlow.addColorStop(0, `rgba(0, 212, 255, ${0.5 * opacity * pulse})`);
            outerGlow.addColorStop(0.3, `rgba(0, 212, 255, ${0.2 * opacity})`);
            outerGlow.addColorStop(0.6, `rgba(79, 70, 229, ${0.1 * opacity})`);
            outerGlow.addColorStop(1, 'transparent');
          } else {
            // Gray-blue for secondary
            outerGlow.addColorStop(0, `rgba(80, 100, 140, ${0.3 * opacity})`);
            outerGlow.addColorStop(0.5, `rgba(60, 80, 120, ${0.1 * opacity})`);
            outerGlow.addColorStop(1, 'transparent');
          }
          
          ctx.fillStyle = outerGlow;
          ctx.beginPath();
          ctx.arc(node.x, node.y, glowRadius * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // ===== INNER GLOW =====
        const innerGlow = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, glowRadius
        );
        
        if (isSelected || isDragged) {
          innerGlow.addColorStop(0, `rgba(255, 230, 150, ${0.9 * opacity})`);
          innerGlow.addColorStop(0.4, `rgba(255, 215, 0, ${0.5 * opacity})`);
          innerGlow.addColorStop(1, 'transparent');
        } else if (isTop) {
          innerGlow.addColorStop(0, `rgba(150, 230, 255, ${0.8 * opacity})`);
          innerGlow.addColorStop(0.4, `rgba(0, 212, 255, ${0.4 * opacity})`);
          innerGlow.addColorStop(1, 'transparent');
        } else {
          innerGlow.addColorStop(0, `rgba(100, 130, 180, ${0.5 * opacity})`);
          innerGlow.addColorStop(0.5, `rgba(70, 90, 130, ${0.2 * opacity})`);
          innerGlow.addColorStop(1, 'transparent');
        }
        
        ctx.fillStyle = innerGlow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // ===== STAR CORE (настоящая форма звезды!) =====
        const drawStar = (cx, cy, spikes, outerRadius, innerRadius, rotation = 0) => {
          ctx.beginPath();
          for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2 + rotation;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
        };
        
        // Количество лучей зависит от типа звезды
        const spikes = isTop ? 6 : 4;
        const innerRatio = isTop ? 0.4 : 0.5;
        const starRotation = timeRef.current * (isTop ? 0.2 : 0.15);
        
        drawStar(node.x, node.y, spikes, radius * 1.5, radius * innerRatio, starRotation);
        
        if (isSelected || isDragged) {
          ctx.fillStyle = `rgba(255, 230, 180, ${opacity})`;
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 20;
        } else if (isHovered) {
          ctx.fillStyle = `rgba(150, 230, 255, ${opacity})`;
          ctx.shadowColor = '#00D4FF';
          ctx.shadowBlur = 15;
        } else if (isTop) {
          ctx.fillStyle = `rgba(100, 200, 255, ${opacity})`;
          ctx.shadowColor = '#00D4FF';
          ctx.shadowBlur = 10;
        } else {
          ctx.fillStyle = `rgba(150, 165, 200, ${0.9 * opacity})`;
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // ===== BRIGHT CENTER (круглое ядро внутри звезды) =====
        if (opacity > 0.5) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * opacity})`;
          ctx.fill();
        }
        
        // ===== DIFFRACTION SPIKES (дифракционные лучи для TOP звёзд) =====
        if ((isTop || isSelected) && opacity > 0.6) {
          const spikeLength = radius * 4;
          const spikeAlpha = isSelected ? 0.6 : 0.4;
          
          ctx.strokeStyle = isSelected 
            ? `rgba(255, 215, 0, ${spikeAlpha * opacity})`
            : `rgba(0, 212, 255, ${spikeAlpha * opacity})`;
          ctx.lineWidth = 1.5;
          
          // 4 длинных диагональных луча (как на фото телескопов)
          for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(
              node.x + Math.cos(angle) * spikeLength,
              node.y + Math.sin(angle) * spikeLength
            );
            ctx.stroke();
          }
        }
        
        // ===== LABEL =====
        if (opacity > 0.5) {
          const label = node.title_ru || node.title;
          ctx.font = `500 ${isTop ? 11 : 9}px "Space Grotesk", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          
          const labelY = node.y + glowRadius + 5;
          const labelWidth = ctx.measureText(label).width + 14;
          
          // Label bg
          ctx.fillStyle = `rgba(2, 3, 5, ${0.9 * opacity})`;
          ctx.beginPath();
          ctx.roundRect(node.x - labelWidth/2, labelY - 2, labelWidth, 17, 5);
          ctx.fill();
          
          // Label border
          ctx.strokeStyle = isTop 
            ? `rgba(0, 212, 255, ${0.25 * opacity})`
            : `rgba(100, 120, 160, ${0.15 * opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
          
          // Label text
          ctx.fillStyle = isTop 
            ? `rgba(0, 220, 255, ${opacity})`
            : `rgba(180, 190, 210, ${0.85 * opacity})`;
          ctx.fillText(label, node.x, labelY + 1);
        }
      });
      
      ctx.restore();
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [graphData, selectedNode, hoveredNode, dimensions, camera, draggedNode]);
  
  // Find node at position
  const findNodeAtPosition = useCallback((clientX, clientY) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    
    const x = (clientX - rect.left - camera.x) / camera.zoom;
    const y = (clientY - rect.top - camera.y) / camera.zoom;
    
    for (const node of nodesRef.current) {
      if (!node.appeared) continue;
      const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      if (dist < node.glowRadius * 1.5) {
        return { node, x, y };
      }
    }
    return { node: null, x, y };
  }, [camera]);
  
  // Mouse handlers
  const handleMouseDown = (e) => {
    const { node } = findNodeAtPosition(e.clientX, e.clientY);
    
    if (node) {
      setDraggedNode(node);
    } else {
      setIsDragging(true);
    }
    
    setDragStart({ 
      x: e.clientX - camera.x, 
      y: e.clientY - camera.y, 
      clickX: e.clientX, 
      clickY: e.clientY 
    });
  };
  
  const handleMouseMove = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      // Track mouse position for magnetic effect
      mousePositionRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true
      };
    }
    
    if (draggedNode) {
      if (rect) {
        const x = (e.clientX - rect.left - camera.x) / camera.zoom;
        const y = (e.clientY - rect.top - camera.y) / camera.zoom;
        
        // Move dragged node smoothly
        const node = nodesRef.current.find(n => n.id === draggedNode.id);
        if (node) {
          node.x = x;
          node.y = y;
          node.vx = 0;
          node.vy = 0;
        }
      }
    } else if (isDragging) {
      setCamera(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    } else {
      const { node } = findNodeAtPosition(e.clientX, e.clientY);
      onNodeHover(node);
    }
  };
  
  const handleMouseUp = (e) => {
    if (draggedNode) {
      const moveDistance = Math.sqrt(
        (e.clientX - dragStart.clickX) ** 2 + 
        (e.clientY - dragStart.clickY) ** 2
      );
      
      if (moveDistance < 8) {
        onNodeClick(draggedNode);
      }
      
      setDraggedNode(null);
    } else if (isDragging) {
      setIsDragging(false);
    }
  };
  
  const handleMouseLeave = () => {
    mousePositionRef.current.active = false;
    setIsDragging(false);
    setDraggedNode(null);
    onNodeHover(null);
  };
  
  const handleWheel = (e) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Zoom towards mouse position for better UX
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    const newZoom = Math.max(0.4, Math.min(3, camera.zoom * delta));
    const zoomRatio = newZoom / camera.zoom;
    
    // Adjust camera to zoom towards mouse
    setCamera(prev => ({
      x: mouseX - (mouseX - prev.x) * zoomRatio,
      y: mouseY - (mouseY - prev.y) * zoomRatio,
      zoom: newZoom
    }));
  };
  
  // Touch handlers for mobile
  const touchStartRef = useRef(null);
  const lastTouchDistRef = useRef(null);
  
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const { node } = findNodeAtPosition(touch.clientX, touch.clientY);
        if (node) {
          setDraggedNode(node);
        } else {
          setIsDragging(true);
        }
        touchStartRef.current = {
          x: touch.clientX - camera.x,
          y: touch.clientY - camera.y,
          clickX: touch.clientX,
          clickY: touch.clientY
        };
      }
    } else if (e.touches.length === 2) {
      // Pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDistRef.current = Math.sqrt(dx * dx + dy * dy);
    }
  };
  
  const handleTouchMove = (e) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && touchStartRef.current) {
      const touch = e.touches[0];
      const rect = canvasRef.current?.getBoundingClientRect();
      
      mousePositionRef.current = {
        x: touch.clientX - (rect?.left || 0),
        y: touch.clientY - (rect?.top || 0),
        active: true
      };
      
      if (draggedNode && rect) {
        const x = (touch.clientX - rect.left - camera.x) / camera.zoom;
        const y = (touch.clientY - rect.top - camera.y) / camera.zoom;
        const node = nodesRef.current.find(n => n.id === draggedNode.id);
        if (node) {
          node.x = x;
          node.y = y;
          node.vx = 0;
          node.vy = 0;
        }
      } else if (isDragging) {
        setCamera(prev => ({
          ...prev,
          x: touch.clientX - touchStartRef.current.x,
          y: touch.clientY - touchStartRef.current.y
        }));
      }
    } else if (e.touches.length === 2 && lastTouchDistRef.current) {
      // Pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const delta = dist / lastTouchDistRef.current;
      
      setCamera(prev => ({
        ...prev,
        zoom: Math.max(0.4, Math.min(3, prev.zoom * delta))
      }));
      
      lastTouchDistRef.current = dist;
    }
  };
  
  const handleTouchEnd = (e) => {
    if (draggedNode && touchStartRef.current) {
      const touch = e.changedTouches[0];
      const moveDistance = Math.sqrt(
        (touch.clientX - touchStartRef.current.clickX) ** 2 + 
        (touch.clientY - touchStartRef.current.clickY) ** 2
      );
      
      if (moveDistance < 15) {
        onNodeClick(draggedNode);
      }
    }
    
    mousePositionRef.current.active = false;
    setDraggedNode(null);
    setIsDragging(false);
    touchStartRef.current = null;
    lastTouchDistRef.current = null;
  };
  
  if (!graphData) return null;
  
  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 graph-canvas"
      data-testid="star-map"
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      />
      
      {/* Hover Tooltip */}
      {hoveredNode && !selectedNode && (
        <motion.div 
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute pointer-events-none z-50 glass-panel rounded-xl p-4 min-w-[200px]"
          style={{
            left: '50%',
            top: 70,
            transform: 'translateX(-50%)'
          }}
        >
          <p className="text-white font-medium text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
            {hoveredNode.title_ru || hoveredNode.title}
          </p>
          <p className="text-white/40 text-xs mt-1">{hoveredNode.year}</p>
          {hoveredNode.vibe && (
            <p className="text-[#00D4FF]/70 text-xs mt-2">{hoveredNode.vibe}</p>
          )}
        </motion.div>
      )}
    </div>
  );
};

// ============== MOVIE CARD PANEL ==============
const MovieCardPanel = ({ movie, isLoading, onClose, onAddFavorite, isFavorite }) => {
  if (isLoading || !movie) {
    return (
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[380px] glass-panel z-50"
      >
        <div className="p-6 space-y-4 pt-16">
          <Skeleton className="w-full h-52 rounded-xl bg-white/5" />
          <Skeleton className="w-3/4 h-7 bg-white/5" />
          <Skeleton className="w-1/2 h-4 bg-white/5" />
          <Skeleton className="w-full h-20 bg-white/5" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 bottom-0 w-full sm:w-[380px] glass-panel z-50 overflow-hidden"
      data-testid="movie-card-panel"
    >
      <Button
        data-testid="close-movie-card"
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 rounded-full"
      >
        <X className="w-5 h-5" />
      </Button>

      <ScrollArea className="h-full">
        <div className="pb-8">
          <div className="relative h-56 overflow-hidden">
            <img src={movie.backdrop || movie.poster} alt={movie.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020305] via-[#020305]/60 to-transparent" />
            
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg border border-[#00D4FF]/15">
              <span className="text-lg font-bold text-[#00D4FF]">{movie.rating.toFixed(1)}</span>
              <span className="text-white/40 text-xs">/10</span>
            </div>
          </div>

          <div className="px-5 pt-4">
            <h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              {movie.title_ru || movie.title}
            </h2>
            <p className="text-white/35 text-sm mt-1">{movie.title !== movie.title_ru && movie.title} • {movie.year}</p>

            <p className="text-white/55 text-sm leading-relaxed mt-4">{movie.description_ru || movie.description}</p>

            <div className="mt-5">
              <h3 className="text-xs font-medium text-white/35 uppercase tracking-wider mb-3">Почему рекомендован</h3>
              <ul className="space-y-2">
                {movie.why_recommended?.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/65">
                    <span className="text-[#00D4FF] mt-0.5">—</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-3 mt-5">
              {movie.watch_providers?.length > 0 && (
                <a 
                  href={movie.watch_providers[0].url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-watch"
                >
                  <Play className="w-4 h-4" />
                  Смотреть
                </a>
              )}
              
              <Button
                data-testid="add-favorite-btn"
                variant="outline"
                onClick={() => onAddFavorite(movie.id)}
                className={`rounded-xl border-white/10 text-sm ${isFavorite ? 'bg-[#00D4FF]/15 border-[#00D4FF]/25 text-[#00D4FF]' : 'text-white/60'}`}
              >
                <Bookmark className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-[#00D4FF]' : ''}`} />
                {isFavorite ? "Сохранено" : "Сохранить"}
              </Button>
            </div>

            {movie.reviews?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-medium text-white/35 uppercase tracking-wider mb-3">Отзывы</h3>
                <div className="space-y-3">
                  {movie.reviews.map((review, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#00D4FF] text-sm font-medium">{review.rating}/5</span>
                        <span className="text-xs text-white/25">{review.date}</span>
                      </div>
                      <p className="text-sm text-white/55">{review.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  );
};

// ============== SIDEBAR ==============
const Sidebar = ({ history, favorites, onHistoryClick, onFavoriteClick, onRemoveFavorite, activeTab, setActiveTab, user }) => {
  return (
    <motion.aside
      initial={{ x: -280, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed left-0 top-[53px] bottom-0 w-[260px] sidebar-glass z-30 flex flex-col"
    >
      <ScrollArea className="flex-1 p-4">
        {/* Navigation */}
        <nav className="space-y-2 mb-6">
          <button
            onClick={() => setActiveTab("favorites")}
            className={`nav-btn ${activeTab === "favorites" ? 'active' : ''}`}
          >
            <Star className={`w-5 h-5 ${activeTab === "favorites" ? 'text-[#00D4FF]' : 'text-white/50'}`} />
            <span className={activeTab === "favorites" ? 'text-white' : 'text-white/60'}>Избранное</span>
            {favorites.length > 0 && (
              <span className="ml-auto text-xs bg-[#00D4FF]/15 text-[#00D4FF] px-2 py-0.5 rounded-full">
                {favorites.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("history")}
            className={`nav-btn ${activeTab === "history" ? 'active' : ''}`}
          >
            <Clock className={`w-5 h-5 ${activeTab === "history" ? 'text-[#00D4FF]' : 'text-white/50'}`} />
            <span className={activeTab === "history" ? 'text-white' : 'text-white/60'}>История</span>
          </button>
        </nav>

        {/* Content */}
        {activeTab === "favorites" && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-white/30 uppercase tracking-wider px-2 mb-3">
              Сохранённые фильмы
            </h4>
            {favorites.length === 0 ? (
              <p className="text-white/30 text-sm px-2">Пока пусто</p>
            ) : (
              favorites.map((item) => (
                <div
                  key={item.id}
                  className="history-item w-full flex items-center gap-3 px-3 py-2 rounded-xl group"
                >
                  <button
                    onClick={() => onFavoriteClick({ id: item.movie_id })}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    {item.movie_poster && (
                      <img src={item.movie_poster} alt="" className="w-10 h-14 object-cover rounded-lg" />
                    )}
                    <span className="text-sm text-white/70 truncate">{item.movie_title}</span>
                  </button>
                  {/* Кнопка удаления */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFavorite(item.movie_id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400"
                    title="Удалить из избранного"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-white/30 uppercase tracking-wider px-2 mb-3">
              Последние запросы
            </h4>
            {history.length === 0 ? (
              <p className="text-white/30 text-sm px-2">Пока пусто</p>
            ) : (
              history.slice(0, 15).map((item, i) => (
                <button
                  key={item.id || i}
                  onClick={() => onHistoryClick(item.query)}
                  className="history-item w-full text-left px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white/90 truncate"
                >
                  "{item.query}"
                </button>
              ))
            )}
          </div>
        )}
      </ScrollArea>
      
      {/* User Profile Section */}
      {user && (
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D4FF]/20 to-[#4F46E5]/20 flex items-center justify-center border border-[#00D4FF]/20">
              {user.picture ? (
                <img src={user.picture} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-[#00D4FF]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80 font-medium truncate">{user.name || 'Пользователь'}</p>
              <p className="text-xs text-white/35 truncate flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {user.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
};

// ============== MAIN DASHBOARD ==============
const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState(location.state?.user || AuthContext.user);
  const [isAuthChecking, setIsAuthChecking] = useState(!location.state?.user && !AuthContext.user);
  
  const [query, setQuery] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSearch, setShowSearch] = useState(true);
  
  const [graphData, setGraphData] = useState(null);
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [movieDetail, setMovieDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState("favorites");

  useEffect(() => {
    if (location.state?.user) {
      setUser(location.state.user);
      AuthContext.setUser(location.state.user);
      setIsAuthChecking(false);
      return;
    }
    if (AuthContext.user) {
      setUser(AuthContext.user);
      setIsAuthChecking(false);
      return;
    }
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
        setUser(response.data);
        AuthContext.setUser(response.data);
      } catch (error) {
        setUser(null);
      } finally {
        setIsAuthChecking(false);
      }
    };
    checkAuth();
  }, [location.state]);

  useEffect(() => {
    if (user) {
      loadHistory();
      loadFavorites();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      const response = await axios.get(`${API}/history`, { withCredentials: true });
      setHistory(response.data);
    } catch (e) {}
  };

  const loadFavorites = async () => {
    try {
      const response = await axios.get(`${API}/favorites`, { withCredentials: true });
      setFavorites(response.data);
    } catch (e) {}
  };

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    
    setValidationError(null);
    setSuggestions([]);
    setIsValidating(true);
    
    try {
      const validateResponse = await axios.post(`${API}/movies/validate`, { query: searchQuery });
      
      if (!validateResponse.data.is_valid) {
        setValidationError(validateResponse.data.error_message);
        setSuggestions(validateResponse.data.suggestions || []);
        setIsValidating(false);
        return;
      }
      
      setIsValidating(false);
      setIsLoadingGraph(true);
      setShowSearch(false);
      setSelectedNode(null);
      setMovieDetail(null);
      
      // ВАЖНО: Сбрасываем graphData чтобы показать индикатор загрузки при повторном поиске
      setGraphData(null);
      
      const response = await axios.post(`${API}/movies/recommend`, { query: searchQuery }, { withCredentials: true });
      
      setGraphData({ nodes: response.data.nodes, links: response.data.links });
      setQuery(searchQuery);
      if (user) loadHistory();
      
    } catch (error) {
      toast.error("Ошибка поиска");
      setShowSearch(true);
    } finally {
      setIsValidating(false);
      setIsLoadingGraph(false);
    }
  };

  const handleNodeClick = async (node) => {
    if (!node) {
      setSelectedNode(null);
      setMovieDetail(null);
      return;
    }
    
    setSelectedNode(node);
    setIsLoadingDetail(true);
    
    try {
      const response = await axios.get(`${API}/movies/${node.id}`);
      setMovieDetail(response.data);
    } catch (error) {
      toast.error("Ошибка загрузки");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleAddFavorite = async (movieId) => {
    if (!user) {
      toast.error("Войдите для сохранения");
      return;
    }
    try {
      await axios.post(`${API}/favorites`, { movie_id: movieId }, { withCredentials: true });
      toast.success("Сохранено");
      loadFavorites();
    } catch (e) {
      toast.error("Ошибка");
    }
  };

  const handleRemoveFavorite = async (movieId) => {
    if (!user) return;
    try {
      await axios.delete(`${API}/favorites/${movieId}`, { withCredentials: true });
      toast.success("Удалено из избранного");
      loadFavorites();
    } catch (e) {
      toast.error("Ошибка удаления");
    }
  };

  const handleLogout = async () => {
    try { await axios.post(`${API}/auth/logout`, {}, { withCredentials: true }); } catch (e) {}
    setUser(null);
    AuthContext.setUser(null);
    navigate("/");
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedNode(null);
        setMovieDetail(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNewSearch = () => {
    setGraphData(null);
    setShowSearch(true);
    setQuery("");
  };

  if (isAuthChecking) {
    return (
      <div className="h-screen bg-[#020305] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#00D4FF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#020305] overflow-hidden">
      {/* Header */}
      {graphData && (
        <header className="fixed top-0 left-0 right-0 z-40 glass-panel border-b border-[#00D4FF]/8">
          <div className="flex items-center justify-between px-5 py-3">
            <button onClick={handleNewSearch} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Новый поиск</span>
            </button>
            
            <div className="flex-1 max-w-lg mx-4">
              <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Новый запрос..."
                  className="w-full pl-10 pr-10 py-2 rounded-xl bg-white/5 border border-white/8 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#00D4FF]/25"
                />
                {(isValidating || isLoadingGraph) && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00D4FF] animate-spin" />
                )}
              </form>
            </div>
            
            {user ? (
              <button onClick={handleLogout} className="text-white/35 hover:text-white transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => navigate("/")} className="text-white/35 hover:text-white text-sm transition-colors">Войти</button>
            )}
          </div>
        </header>
      )}

      {/* Sidebar */}
      {graphData && (
        <Sidebar
          history={history}
          favorites={favorites}
          onHistoryClick={handleSearch}
          onFavoriteClick={handleNodeClick}
          onRemoveFavorite={handleRemoveFavorite}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
        />
      )}

      {/* Main */}
      <main className={graphData ? "pt-[53px] pl-[260px]" : ""} style={{ height: '100%' }}>
        <AnimatePresence>
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass-panel rounded-2xl p-5 max-w-md"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#00D4FF] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white/75 font-medium mb-2">{validationError}</p>
                  {suggestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-white/35">Попробуйте:</p>
                      {suggestions.map((s, i) => (
                        <button key={i} onClick={() => { setQuery(s); setValidationError(null); }} className="block w-full text-left text-sm text-[#00D4FF] hover:underline">"{s}"</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Screen */}
        <AnimatePresence>
          {showSearch && !graphData && (
            <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }} className="h-full flex items-center justify-center relative">
              {/* Background dust */}
              <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 200 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      width: Math.random() * 2.5 + 0.5,
                      height: Math.random() * 2.5 + 0.5,
                      background: Math.random() > 0.88 ? 'rgba(0, 212, 255, 0.7)' : Math.random() > 0.95 ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.4)',
                      opacity: Math.random() * 0.5 + 0.1,
                      animation: `dust-float ${8 + Math.random() * 8}s ease-in-out infinite`,
                      animationDelay: `${Math.random() * 5}s`
                    }}
                  />
                ))}
              </div>
              
              <div className="text-center max-w-2xl px-4 relative z-10">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <div className="w-16 h-16 rounded-full bg-[#00D4FF]/10 flex items-center justify-center mx-auto mb-8 glow-neon">
                    <Sparkles className="w-8 h-8 text-[#00D4FF]" />
                  </div>
                  <h1 className="text-3xl font-semibold text-white/90 mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Что хотите посмотреть?</h1>
                  <p className="text-white/40 mb-8">Опишите настроение, жанр или похожий фильм</p>
                </motion.div>
                
                <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="mb-8">
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none" />
                    <input data-testid="search-input" type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Как Интерстеллар, но медленнее..." className="search-input pl-14 pr-14 text-base" autoFocus />
                  </div>
                  {/* Индикатор загрузки под полем ввода */}
                  {(isValidating || isLoadingGraph) && (
                    <div className="flex items-center justify-center mt-4 gap-2">
                      <Loader2 className="w-5 h-5 text-[#00D4FF] animate-spin" />
                      <span className="text-white/40 text-sm">
                        {isValidating ? "Проверяем запрос..." : "Строим карту звёзд..."}
                      </span>
                    </div>
                  )}
                </motion.form>
                
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="space-y-3">
                  {["Как Интерстеллар, но медленнее и без космоса", "Мрачный триллер с неожиданной концовкой", "Философское кино про искусственный интеллект"].map((example, i) => (
                    <button key={i} onClick={() => { setQuery(example); handleSearch(example); }} className="w-full glass-panel-light rounded-xl px-5 py-4 text-left text-white/50 hover:text-white/80 hover:border-[#00D4FF]/15 transition-all flex items-center justify-between group">
                      <span className="text-sm">"{example}"</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-[#00D4FF] transition-opacity" />
                    </button>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        <AnimatePresence>
          {isLoadingGraph && !graphData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex items-center justify-center bg-[#020305]">
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border border-[#00D4FF]/15" />
                  <div className="absolute inset-0 rounded-full border-2 border-[#00D4FF] border-t-transparent animate-spin" />
                  <div className="absolute inset-3 rounded-full border border-[#00D4FF]/30 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                </div>
                <p className="text-white/40">Строим карту звёзд...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Star Map */}
        {graphData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="h-full relative">
            <PremiumStarMap graphData={graphData} selectedNode={selectedNode} hoveredNode={hoveredNode} onNodeClick={handleNodeClick} onNodeHover={setHoveredNode} />
            <AnimatePresence>
              {selectedNode && (
                <MovieCardPanel movie={movieDetail} isLoading={isLoadingDetail} onClose={() => handleNodeClick(null)} onAddFavorite={handleAddFavorite} isFavorite={favorites.some(f => f.movie_id === selectedNode.id)} />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
