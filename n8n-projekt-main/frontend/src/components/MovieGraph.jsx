import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { motion } from "framer-motion";

const MovieGraph = ({ data, onNodeClick, selectedNode }) => {
  const graphRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState(null);

  // Update dimensions on resize
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

  // Process data for force graph
  const graphData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };
    
    return {
      nodes: data.nodes.map(node => ({
        ...node,
        fx: node.x,
        fy: node.y
      })),
      links: data.links.map(link => ({
        source: link.source,
        target: link.target,
        value: link.strength
      }))
    };
  }, [data]);

  // Center camera on selected node
  useEffect(() => {
    if (selectedNode && graphRef.current) {
      const node = graphData.nodes.find(n => n.id === selectedNode.id);
      if (node) {
        graphRef.current.centerAt(node.x, node.y, 800);
        graphRef.current.zoom(1.5, 800);
      }
    }
  }, [selectedNode, graphData.nodes]);

  // Initial zoom
  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      setTimeout(() => {
        graphRef.current.zoomToFit(500, 100);
      }, 500);
    }
  }, [graphData.nodes.length]);

  // Node paint function
  const paintNode = useCallback((node, ctx, globalScale) => {
    const isSelected = selectedNode?.id === node.id;
    const isHovered = hoveredNode?.id === node.id;
    const isTop = node.is_top;
    
    const baseRadius = isTop ? 25 : 18;
    const radius = baseRadius / Math.max(globalScale * 0.5, 0.5);
    
    // Glow effect
    if (isTop || isSelected || isHovered) {
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius * 2.5);
      if (isTop) {
        gradient.addColorStop(0, "rgba(255, 215, 0, 0.4)");
        gradient.addColorStop(1, "rgba(255, 215, 0, 0)");
      } else {
        gradient.addColorStop(0, "rgba(76, 201, 240, 0.3)");
        gradient.addColorStop(1, "rgba(76, 201, 240, 0)");
      }
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius * 2.5, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Main circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    
    if (isTop) {
      ctx.fillStyle = isSelected ? "#FFD700" : "rgba(255, 215, 0, 0.9)";
    } else {
      ctx.fillStyle = isSelected ? "#4CC9F0" : "rgba(160, 160, 160, 0.7)";
    }
    ctx.fill();
    
    // Border
    if (isSelected || isHovered) {
      ctx.strokeStyle = isTop ? "#FFD700" : "#4CC9F0";
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    }
    
    // Load and draw poster for selected/hovered nodes
    if ((isSelected || isHovered) && node.poster) {
      const img = new Image();
      img.src = node.poster;
      
      // Draw poster as background if loaded
      if (img.complete) {
        const posterSize = radius * 1.8;
        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 0.9, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(
          img,
          node.x - posterSize / 2,
          node.y - posterSize / 2,
          posterSize,
          posterSize
        );
        ctx.restore();
      }
    }
    
    // Label
    const label = node.title_ru || node.title;
    const fontSize = Math.max(10 / globalScale, 8);
    ctx.font = `600 ${fontSize}px Outfit`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    
    // Label background
    const textWidth = ctx.measureText(label).width;
    ctx.fillStyle = "rgba(5, 5, 8, 0.8)";
    ctx.fillRect(
      node.x - textWidth / 2 - 4,
      node.y + radius + 4,
      textWidth + 8,
      fontSize + 4
    );
    
    // Label text
    ctx.fillStyle = isTop ? "#FFD700" : "#E2E2E2";
    ctx.fillText(label, node.x, node.y + radius + 6);
    
    // Vibe text for hovered
    if (isHovered && node.vibe) {
      const vibeFontSize = fontSize * 0.8;
      ctx.font = `400 ${vibeFontSize}px Outfit`;
      ctx.fillStyle = "rgba(160, 160, 160, 0.9)";
      ctx.fillText(node.vibe, node.x, node.y + radius + fontSize + 10);
    }
  }, [selectedNode, hoveredNode]);

  // Link paint function
  const paintLink = useCallback((link, ctx, globalScale) => {
    const isConnectedToSelected = selectedNode && 
      (link.source.id === selectedNode.id || link.target.id === selectedNode.id);
    const isConnectedToHovered = hoveredNode && 
      (link.source.id === hoveredNode.id || link.target.id === hoveredNode.id);
    
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    
    if (isConnectedToSelected || isConnectedToHovered) {
      ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
      ctx.lineWidth = 2 / globalScale;
    } else {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1 / globalScale;
    }
    
    ctx.stroke();
  }, [selectedNode, hoveredNode]);

  // Handle node hover
  const handleNodeHover = useCallback((node) => {
    setHoveredNode(node);
    if (containerRef.current) {
      containerRef.current.style.cursor = node ? "pointer" : "grab";
    }
  }, []);

  // Handle node click
  const handleNodeClick = useCallback((node) => {
    if (node && onNodeClick) {
      onNodeClick(node);
    }
  }, [onNodeClick]);

  if (!data || data.nodes.length === 0) {
    return null;
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0"
      style={{ cursor: "grab" }}
      data-testid="movie-graph"
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="#050508"
        nodeRelSize={1}
        nodeCanvasObject={paintNode}
        linkCanvasObject={paintLink}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        enableNodeDrag={false}
        enablePanInteraction={true}
        enableZoomInteraction={true}
        minZoom={0.3}
        maxZoom={4}
        linkDirectionalParticles={0}
        nodeLabel={() => ""}
        onBackgroundClick={() => onNodeClick && onNodeClick(null)}
      />
      
      {/* Tooltip */}
      {hoveredNode && !selectedNode && (
        <div
          className="fixed pointer-events-none z-50 glass rounded-lg px-3 py-2"
          style={{
            left: "50%",
            top: 80,
            transform: "translateX(-50%)"
          }}
        >
          <p className="text-sm font-medium text-white">
            {hoveredNode.title_ru || hoveredNode.title}
            <span className="text-neutral-400 ml-2">{hoveredNode.year}</span>
          </p>
          {hoveredNode.vibe && (
            <p className="text-xs text-neutral-400">{hoveredNode.vibe}</p>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default MovieGraph;
