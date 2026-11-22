import React, { useRef, useEffect, useState, useMemo } from "react";
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Pause, 
  Play, 
  Filter 
} from "lucide-react";

export function NetworkGraph({ 
  images, 
  onSelectImage, 
  onSelectTag, 
  highlightImageId, 
  highlightTag,
  searchQuery,
  searchTrigger,
  theme = "light"
}) {
  const canvasRef = useRef(null);
  const [filterTag, setFilterTag] = useState("all");
  const [isRunning, setIsRunning] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Camera transform state: pan (x, y) and zoom scale
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const isDraggingRef = useRef(false);
  const draggedNodeRef = useRef(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef(null);
  const imageBitmapsRef = useRef({});

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set();
    images.forEach((img) => img.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [images]);

  // Sync external filterTag if set externally (e.g. from tag focus or clearing)
  useEffect(() => {
    if (highlightTag && highlightTag !== "all") {
      setFilterTag(highlightTag);
    } else if (!highlightTag) {
      setFilterTag("all");
    }
  }, [highlightTag]);

  // Reset filter if active tag was removed from image archive
  useEffect(() => {
    if (filterTag !== "all" && !allTags.includes(filterTag)) {
      setFilterTag("all");
    }
  }, [allTags, filterTag]);

  // Construct graph nodes & links
  const graphData = useMemo(() => {
    const nodes = [];
    const links = [];
    const tagMap = new Map();

    const activeImages = filterTag === "all"
      ? images
      : images.filter((img) => img.tags?.includes(filterTag));

    // 1. Image Nodes
    activeImages.forEach((img, i) => {
      const angle = (i / Math.max(activeImages.length, 1)) * Math.PI * 2;
      const radius = 220 + (i % 3) * 70;
      nodes.push({
        id: `img-${img.id}`,
        type: "image",
        data: img,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: 28,
        label: img.title
      });
    });

    // 2. Tag Nodes & Links
    activeImages.forEach((img) => {
      (img.tags || []).forEach((tag) => {
        if (!tagMap.has(tag)) {
          const count = tagMap.size;
          const tagAngle = (count / Math.max(allTags.length, 1)) * Math.PI * 2 + 0.3;
          const tagNode = {
            id: `tag-${tag}`,
            type: "tag",
            name: tag,
            x: Math.cos(tagAngle) * 110,
            y: Math.sin(tagAngle) * 110,
            vx: 0,
            vy: 0,
            radius: 18,
            label: `#${tag}`,
            degree: 1
          };
          tagMap.set(tag, tagNode);
          nodes.push(tagNode);
        } else {
          tagMap.get(tag).degree++;
        }

        links.push({
          sourceId: `img-${img.id}`,
          targetId: `tag-${tag}`,
          tag: tag
        });
      });
    });

    // Pre-cache images for canvas
    activeImages.forEach((img) => {
      if (!imageBitmapsRef.current[img.imageUrl]) {
        const imageElement = new Image();
        imageElement.crossOrigin = "anonymous";
        imageElement.src = img.imageUrl;
        imageElement.onload = () => {
          imageBitmapsRef.current[img.imageUrl] = imageElement;
        };
      }
    });

    return { nodes, links };
  }, [images, filterTag, allTags]);

  const nodesRef = useRef([]);
  useEffect(() => {
    const oldPos = new Map(nodesRef.current.map((n) => [n.id, { x: n.x, y: n.y, vx: n.vx, vy: n.vy }]));
    nodesRef.current = graphData.nodes.map((n) => {
      if (oldPos.has(n.id)) {
        const prev = oldPos.get(n.id);
        return { ...n, x: prev.x, y: prev.y, vx: prev.vx, vy: prev.vy };
      }
      return { ...n };
    });
  }, [graphData]);

  // Navigate to matching node on search
  useEffect(() => {
    if (!searchQuery || !searchQuery.trim()) return;
    const q = searchQuery.toLowerCase().trim();
    const nodes = nodesRef.current;

    const matchedNode = nodes.find((n) => {
      if (n.type === "image") {
        return (
          n.data.title?.toLowerCase().includes(q) ||
          n.data.camera?.toLowerCase().includes(q) ||
          n.data.aiPrompt?.toLowerCase().includes(q) ||
          n.data.tags?.some((t) => t.toLowerCase().includes(q))
        );
      } else {
        return n.name?.toLowerCase().includes(q);
      }
    });

    if (matchedNode) {
      // Smooth animated pan to center on the found node
      const currentZoom = transformRef.current.k;
      const targetX = window.innerWidth / 2 - matchedNode.x * currentZoom;
      const targetY = window.innerHeight / 2 - matchedNode.y * currentZoom;

      const startX = transformRef.current.x;
      const startY = transformRef.current.y;
      let step = 0;
      const panAnimation = () => {
        step += 0.08;
        if (step < 1) {
          transformRef.current.x = startX + (targetX - startX) * step;
          transformRef.current.y = startY + (targetY - startY) * step;
          requestAnimationFrame(panAnimation);
        } else {
          transformRef.current.x = targetX;
          transformRef.current.y = targetY;
        }
      };
      panAnimation();

      // Trigger selection to open right panel
      if (matchedNode.type === "image" && onSelectImage) {
        onSelectImage(matchedNode.data);
      } else if (matchedNode.type === "tag" && onSelectTag) {
        onSelectTag(matchedNode.name);
      }
    }
  }, [searchQuery, searchTrigger]);

  // Simulation & Rendering loop (Light Mode)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initial centering
    if (transformRef.current.x === 0 && transformRef.current.y === 0) {
      transformRef.current.x = window.innerWidth / 2;
      transformRef.current.y = window.innerHeight / 2;
    }

    const nodeMap = new Map();

    const stepSimulation = () => {
      const nodes = nodesRef.current;
      nodeMap.clear();
      nodes.forEach((n) => nodeMap.set(n.id, n));

      if (isRunning) {
        // Node repulsion
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i];
            const b = nodes[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distSq = dx * dx + dy * dy || 1;
            const dist = Math.sqrt(distSq);

            const minDist = a.radius + b.radius + 36;
            const force = (minDist * minDist * 45) / distSq;
            const fx = (dx / dist) * Math.min(force, 10);
            const fy = (dy / dist) * Math.min(force, 10);

            if (a !== draggedNodeRef.current) {
              a.vx -= fx;
              a.vy -= fy;
            }
            if (b !== draggedNodeRef.current) {
              b.vx += fx;
              b.vy += fy;
            }
          }
        }

        // Link attraction
        graphData.links.forEach((link) => {
          const source = nodeMap.get(link.sourceId);
          const target = nodeMap.get(link.targetId);
          if (!source || !target) return;

          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = 95;
          const springForce = (dist - targetDist) * 0.035;

          const fx = (dx / dist) * springForce;
          const fy = (dy / dist) * springForce;

          if (source !== draggedNodeRef.current) {
            source.vx += fx;
            source.vy += fy;
          }
          if (target !== draggedNodeRef.current) {
            target.vx -= fx;
            target.vy -= fy;
          }
        });

        // Center pull & damping
        nodes.forEach((n) => {
          if (n === draggedNodeRef.current) return;
          n.vx -= n.x * 0.004;
          n.vy -= n.y * 0.004;
          n.vx *= 0.82;
          n.vy *= 0.82;
          n.x += n.vx;
          n.y += n.vy;
        });
      }

      renderCanvas(ctx, canvas);
      animFrameRef.current = requestAnimationFrame(stepSimulation);
    };

    const renderCanvas = (ctx, canvas) => {
      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Light mode subtle technical grid background
      const { x: panX, y: panY, k: zoom } = transformRef.current;

      ctx.save();
      ctx.translate(panX, panY);
      ctx.scale(zoom, zoom);

      // Active highlights
      let highlightedNodeIds = new Set();
      let highlightedLinkIndices = new Set();

      if (hoveredNode) {
        highlightedNodeIds.add(hoveredNode.id);
        graphData.links.forEach((l, idx) => {
          if (l.sourceId === hoveredNode.id) {
            highlightedLinkIndices.add(idx);
            highlightedNodeIds.add(l.targetId);
          } else if (l.targetId === hoveredNode.id) {
            highlightedLinkIndices.add(idx);
            highlightedNodeIds.add(l.sourceId);
          }
        });
      }

      if (highlightImageId) {
        highlightedNodeIds.add(`img-${highlightImageId}`);
      }
      if (highlightTag) {
        highlightedNodeIds.add(`tag-${highlightTag}`);
      }

      const isDark = theme === "dark";

      // Draw Edges - Theme adaptive
      graphData.links.forEach((link, idx) => {
        const s = nodeMap.get(link.sourceId);
        const t = nodeMap.get(link.targetId);
        if (!s || !t) return;

        const isHighlighted = highlightedLinkIndices.has(idx) || (highlightTag && link.tag === highlightTag);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);

        if (hoveredNode || highlightTag) {
          ctx.strokeStyle = isHighlighted
            ? (isDark ? "#38bdf8" : "#0284c7")
            : (isDark ? "rgba(100, 116, 139, 0.2)" : "rgba(148, 163, 184, 0.2)");
          ctx.lineWidth = isHighlighted ? 2.4 : 0.8;
        } else {
          ctx.strokeStyle = isDark ? "rgba(56, 189, 248, 0.2)" : "rgba(2, 132, 199, 0.25)";
          ctx.lineWidth = 1.2;
        }
        ctx.stroke();
      });

      // Draw Nodes - Theme adaptive
      nodesRef.current.forEach((node) => {
        const isHovered = hoveredNode?.id === node.id;
        const isConnected = highlightedNodeIds.has(node.id) || (highlightTag && node.id === `tag-${highlightTag}`);
        const dimmed = (hoveredNode || highlightTag) && !isConnected;

        ctx.save();
        ctx.translate(node.x, node.y);

        if (dimmed) {
          ctx.globalAlpha = 0.22;
        }

        if (node.type === "image") {
          const radius = isHovered ? node.radius + 4 : node.radius;

          if (isHovered || isConnected) {
            ctx.shadowColor = isDark ? "rgba(56, 189, 248, 0.45)" : "rgba(2, 132, 199, 0.35)";
            ctx.shadowBlur = 18;
          } else {
            ctx.shadowColor = isDark ? "rgba(0, 0, 0, 0.5)" : "rgba(15, 23, 42, 0.1)";
            ctx.shadowBlur = 6;
          }

          // Background base
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? "#0f121a" : "#ffffff";
          ctx.fill();

          // Image rendering
          const imgElem = imageBitmapsRef.current[node.data.imageUrl];
          if (imgElem && imgElem.complete && imgElem.naturalWidth !== 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, radius - 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(imgElem, -radius, -radius, radius * 2, radius * 2);
            ctx.restore();
          }

          // Outer border ring
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.strokeStyle = isHovered || isConnected
            ? (isDark ? "#38bdf8" : "#0284c7")
            : (isDark ? "#2d3748" : "#cbd5e1");
          ctx.lineWidth = isHovered || isConnected ? 3 : 1.8;
          ctx.stroke();

          // Title Label
          ctx.shadowBlur = 0;
          ctx.font = isHovered ? "bold 11px 'Plus Jakarta Sans', sans-serif" : "600 10px 'Plus Jakarta Sans', sans-serif";
          ctx.fillStyle = isHovered || isConnected 
            ? (isDark ? "#38bdf8" : "#0284c7") 
            : (isDark ? "#f1f5f9" : "#0f172a");
          ctx.textAlign = "center";
          const maxLabel = node.label.length > 20 ? node.label.substring(0, 18) + "…" : node.label;
          ctx.fillText(maxLabel, 0, radius + 14);
        } else {
          // Tag Node
          const radius = isHovered ? node.radius + 3 : node.radius;

          if (isHovered || isConnected) {
            ctx.shadowColor = "rgba(56, 189, 248, 0.4)";
            ctx.shadowBlur = 14;
          }

          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fillStyle = isHovered || isConnected 
            ? "#38bdf8" 
            : (isDark ? "#171b26" : "#ffffff");
          ctx.fill();

          ctx.strokeStyle = isDark ? "#38bdf8" : "#0284c7";
          ctx.lineWidth = isHovered || isConnected ? 2.2 : 1.2;
          ctx.stroke();

          // Tag text
          ctx.shadowBlur = 0;
          ctx.font = "bold 9px 'JetBrains Mono', monospace";
          ctx.fillStyle = isHovered || isConnected 
            ? "#07080c" 
            : (isDark ? "#38bdf8" : "#0284c7");
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.label, 0, 0);
        }

        ctx.restore();
      });

      ctx.restore();
      ctx.restore();
    };

    animFrameRef.current = requestAnimationFrame(stepSimulation);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [graphData, isRunning, hoveredNode, highlightImageId, highlightTag, theme]);

  // Screen to World coords
  const screenToWorld = (screenX, screenY) => {
    const { x: panX, y: panY, k: zoom } = transformRef.current;
    return {
      x: (screenX - panX) / zoom,
      y: (screenY - panY) / zoom
    };
  };

  const getNodeAt = (worldX, worldY) => {
    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const dx = worldX - node.x;
      const dy = worldY - node.y;
      if (dx * dx + dy * dy <= (node.radius + 6) * (node.radius + 6)) {
        return node;
      }
    }
    return null;
  };

  // Dedicated non-passive wheel event listener:
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleNativeWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const delta = Math.max(-120, Math.min(120, e.deltaY));
      const zoomSensitivity = 0.0028;
      const zoomFactor = Math.pow(2, -delta * zoomSensitivity);

      const currentZoom = transformRef.current.k;
      const newZoom = Math.min(Math.max(currentZoom * zoomFactor, 0.3), 3.2);

      transformRef.current.x = mouseX - (mouseX - transformRef.current.x) * (newZoom / currentZoom);
      transformRef.current.y = mouseY - (mouseY - transformRef.current.y) * (newZoom / currentZoom);
      transformRef.current.k = newZoom;
    };

    canvas.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleNativeWheel);
    };
  }, []);

  const handleMouseDown = (e) => {
    const world = screenToWorld(e.clientX, e.clientY);
    const clickedNode = getNodeAt(world.x, world.y);

    if (clickedNode) {
      draggedNodeRef.current = clickedNode;
      clickedNode.vx = 0;
      clickedNode.vy = 0;
    } else {
      isDraggingRef.current = true;
    }
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    const world = screenToWorld(e.clientX, e.clientY);

    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = world.x;
      draggedNodeRef.current.y = world.y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
    } else if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      transformRef.current.x += dx;
      transformRef.current.y += dy;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    } else {
      const hover = getNodeAt(world.x, world.y);
      setHoveredNode(hover);
      setTooltipPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    draggedNodeRef.current = null;
    isDraggingRef.current = false;
  };

  // Node Click: Opens image in right panel OR opens tag related images in right panel!
  const handleClick = (e) => {
    const world = screenToWorld(e.clientX, e.clientY);
    const clickedNode = getNodeAt(world.x, world.y);
    if (clickedNode) {
      if (clickedNode.type === "image" && onSelectImage) {
        onSelectImage(clickedNode.data);
      } else if (clickedNode.type === "tag" && onSelectTag) {
        onSelectTag(clickedNode.name);
      }
    }
  };

  const handleZoom = (direction) => {
    const factor = direction === "in" ? 1.2 : 0.83;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const currentZoom = transformRef.current.k;
    const newZoom = Math.min(Math.max(currentZoom * factor, 0.3), 3.2);

    transformRef.current.x = centerX - (centerX - transformRef.current.x) * (newZoom / currentZoom);
    transformRef.current.y = centerY - (centerY - transformRef.current.y) * (newZoom / currentZoom);
    transformRef.current.k = newZoom;
  };

  const handleCenter = () => {
    transformRef.current = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      k: 1
    };
  };

  return (
    <div className="fullscreen-canvas-wrapper">
      {/* Canvas fills 100% viewport */}
      <canvas
        ref={canvasRef}
        className="graph-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      />

      {/* Floating HUD Controls */}
      <div className="graph-floating-hud">
        <div className="graph-toolbar">
          <button
            className="graph-control-btn"
            onClick={() => handleZoom("in")}
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>

          <button
            className="graph-control-btn"
            onClick={() => handleZoom("out")}
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>

          <button
            className="graph-control-btn"
            onClick={handleCenter}
            title="Reset to Center"
          >
            <Maximize2 size={14} />
          </button>

          <div className="hud-divider" />

          <button
            className="graph-control-btn"
            onClick={() => setIsRunning(!isRunning)}
            title={isRunning ? "Freeze Physics" : "Resume Physics"}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
          </button>

          <div className="hud-divider" />

          {/* Tag Filter Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 4px" }}>
            <Filter size={12} color="var(--primary-dark)" />
            <select
              className="form-select"
              style={{ 
                padding: "2px 6px", 
                fontSize: "0.72rem", 
                background: "transparent", 
                borderColor: "transparent",
                color: "var(--text-main)",
                cursor: "pointer",
                fontWeight: 600
              }}
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
            >
              <option value="all">All Tags ({allTags.length})</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>#{tag}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend Badge */}
        <div className="graph-legend-badge">
          <div className="legend-item">
            <div className="legend-dot-image" />
            <span>Image</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot-tag" />
            <span>Tag Hub (Click to explore)</span>
          </div>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredNode && hoveredNode.type === "image" && (
        <div
          className="graph-hover-tooltip"
          style={{
            left: `${Math.min(tooltipPos.x + 15, window.innerWidth - 290)}px`,
            top: `${Math.min(tooltipPos.y + 15, window.innerHeight - 150)}px`
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <img
              src={hoveredNode.data.imageUrl}
              alt=""
              style={{ width: "36px", height: "36px", objectFit: "cover", border: "1px solid var(--border-subtle)" }}
            />
            <div>
              <strong style={{ display: "block", fontSize: "0.82rem", color: "var(--text-main)", lineHeight: 1.2 }}>
                {hoveredNode.data.title}
              </strong>
              <span style={{ fontSize: "0.68rem", color: "var(--primary-dark)", fontWeight: 700 }}>
                {hoveredNode.data.aiModel || "AI Visual"}
              </span>
            </div>
          </div>

          {hoveredNode.data.camera && (
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>
              📷 {hoveredNode.data.camera} {hoveredNode.data.aperture ? `• ${hoveredNode.data.aperture}` : ""}
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
            {(hoveredNode.data.tags || []).slice(0, 4).map((t) => (
              <span key={t} className="card-tag" style={{ fontSize: "0.62rem", padding: "1px 4px" }}>
                #{t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
