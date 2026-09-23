import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Point, Zone, ProjectImage, Mode } from '../types';
import { CATEGORIES, CLOSE_RADIUS, DRAG_THRESHOLD } from '../constants';
import { pointInPolygon, distance, hexToRgba } from '../utils/geometry';

interface CanvasProps {
  image: ProjectImage | null;
  mode: Mode;
  activeCategory: string;
  zoom: number;
  pan: { x: number; y: number };
  setZoom: (fn: (z: number) => number) => void;
  setPan: (p: { x: number; y: number }) => void;
  onAddZone: (zone: Zone) => void;
  selectedZone: string | null;
  setSelectedZone: (id: string | null) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  currentPoints: Point[];
  setCurrentPoints: (p: Point[]) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  image, mode, activeCategory, zoom, pan, setZoom, setPan,
  onAddZone, selectedZone, setSelectedZone, containerRef,
  currentPoints, setCurrentPoints
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const mouseDownPosRef = useRef<Point | null>(null);

  // Screen to canvas coordinates
  const screenToCanvas = useCallback((sx: number, sy: number): Point => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const relX = sx - rect.left;
    const relY = sy - rect.top;
    const x = (relX - pan.x) / zoom;
    const y = (relY - pan.y) / zoom;
    return { x, y };
  }, [zoom, pan, containerRef]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = image.canvasSize.width;
    canvas.height = image.canvasSize.height;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(image.img, 0, 0);

    // Draw zones
    image.zones.forEach(zone => {
      const cat = CATEGORIES.find(c => c.id === zone.category);
      const color = cat?.color || '#666';
      const isSelected = zone.id === selectedZone;
      const fillAlpha = isSelected ? 0.55 : 0.3;
      const lineWidth = isSelected ? 3 : 1.5;

      ctx.beginPath();
      zone.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();

      ctx.fillStyle = hexToRgba(color, fillAlpha);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth / zoom;
      ctx.stroke();

      // Label
      if (zone.points.length > 0) {
        const cx = zone.points.reduce((s, p) => s + p.x, 0) / zone.points.length;
        const cy = zone.points.reduce((s, p) => s + p.y, 0) / zone.points.length;
        ctx.font = `${14 / zoom}px sans-serif`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 3 / zoom;
        ctx.strokeText(zone.label, cx, cy);
        ctx.fillText(zone.label, cx, cy);
      }
    });

    // Draw current drawing
    if (currentPoints.length > 0) {
      const cat = CATEGORIES.find(c => c.id === activeCategory);
      const color = cat?.color || '#666';

      ctx.beginPath();
      currentPoints.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });

      if (mousePos) {
        ctx.lineTo(mousePos.x, mousePos.y);
        // Close hint line
        if (currentPoints.length >= 3) {
          ctx.moveTo(mousePos.x, mousePos.y);
          ctx.lineTo(currentPoints[0].x, currentPoints[0].y);
        }
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([8 / zoom, 4 / zoom]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw points
      currentPoints.forEach((p, i) => {
        const isFirst = i === 0;
        const radius = isFirst ? 8 / zoom : 5 / zoom;

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isFirst ? '#fff' : color;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();
      });

      // First point highlight when can close
      if (currentPoints.length >= 3 && mousePos) {
        const dist = distance(mousePos, currentPoints[0]);
        if (dist < CLOSE_RADIUS / zoom) {
          ctx.beginPath();
          ctx.arc(currentPoints[0].x, currentPoints[0].y, 12 / zoom, 0, Math.PI * 2);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();
        }
      }
    }
  }, [image, currentPoints, mousePos, selectedZone, zoom, activeCategory]);

  // Wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prevZoom => {
        const newZoom = Math.max(0.1, Math.min(10, prevZoom * delta));
        const scale = newZoom / prevZoom;
        const newPanX = mouseX - scale * (mouseX - pan.x);
        const newPanY = mouseY - scale * (mouseY - pan.y);
        setPan({ x: newPanX, y: newPanY });
        return newZoom;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [pan, setZoom, setPan, containerRef]);

  // Reset drawing on mode/image change
  useEffect(() => {
    setCurrentPoints([]);
  }, [mode, image?.id]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(true);
      }
      if (e.code === 'Escape') {
        setCurrentPoints([]);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        setIsPanning(false);
        panStartRef.current = null;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setCurrentPoints]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const pos = { x: e.clientX, y: e.clientY };
    mouseDownPosRef.current = pos;

    if (e.button === 1 || (e.button === 0 && spacePressed)) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      e.preventDefault();
    }
  }, [spacePressed, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setMousePos(canvasPos);

    if (isPanning && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
    }
  }, [isPanning, screenToCanvas, setPan]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
      return;
    }
    if (mouseDownPosRef.current) {
      const dragDist = distance(mouseDownPosRef.current, { x: e.clientX, y: e.clientY });
      if (dragDist > DRAG_THRESHOLD) {
        mouseDownPosRef.current = null;
        return;
      }
    }
    mouseDownPosRef.current = null;
  }, [isPanning]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (spacePressed || isPanning) return;

    if (mouseDownPosRef.current) {
      const dragDist = distance(mouseDownPosRef.current, { x: e.clientX, y: e.clientY });
      if (dragDist > DRAG_THRESHOLD) return;
    }

    const canvasPos = screenToCanvas(e.clientX, e.clientY);

    if (mode === 'draw') {
      if (currentPoints.length >= 3) {
        const dist = distance(canvasPos, currentPoints[0]);
        if (dist < CLOSE_RADIUS / zoom) {
          const cat = CATEGORIES.find(c => c.id === activeCategory);
          const zoneCount = image?.zones.filter(z => z.category === activeCategory).length || 0;
          const newZone: Zone = {
            id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
            points: [...currentPoints],
            category: activeCategory,
            label: `${cat?.name || 'Область'} ${zoneCount + 1}`
          };
          onAddZone(newZone);
          setCurrentPoints([]);
          return;
        }
      }
      setCurrentPoints([...currentPoints, canvasPos]);
    } else if (mode === 'select') {
      if (image) {
        let found = false;
        for (let i = image.zones.length - 1; i >= 0; i--) {
          if (pointInPolygon(canvasPos, image.zones[i].points)) {
            setSelectedZone(image.zones[i].id);
            found = true;
            break;
          }
        }
        if (!found) {
          setSelectedZone(null);
        }
      }
    }
  }, [mode, currentPoints, zoom, activeCategory, image, screenToCanvas, onAddZone, setSelectedZone, spacePressed, isPanning, setCurrentPoints]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentPoints([]);
  }, [setCurrentPoints]);

  const handleMouseLeave = useCallback(() => {
    setMousePos(null);
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
    }
  }, [isPanning]);

  if (!image) {
    return (
      <div 
        className="flex-1 flex items-center justify-center" 
        style={{ 
          backgroundImage: 'radial-gradient(circle, rgba(71, 85, 105, 0.3) 1px, transparent 1px)', 
          backgroundSize: '24px 24px',
          backgroundColor: '#0c0e14'
        }}
      >
        <div className="text-center animate-fade-in">
          <div className="text-7xl mb-5 opacity-80">🏗️</div>
          <p className="text-slate-300 text-lg font-medium">Загрузите изображение для начала работы</p>
          <p className="text-slate-500 text-sm mt-3">Нажмите "📁 Загрузить" в панели выше</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="absolute inset-0 overflow-hidden"
        style={{
          cursor: spacePressed || isPanning ? 'grab' : mode === 'draw' ? 'crosshair' : 'default',
          backgroundImage: 'radial-gradient(circle, rgba(71, 85, 105, 0.25) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundColor: '#0c0e14'
        }}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: image.canvasSize.width,
            height: image.canvasSize.height,
          }}
        >
          <canvas
            ref={canvasRef}
            width={image.canvasSize.width}
            height={image.canvasSize.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            onMouseLeave={handleMouseLeave}
            className="shadow-soft-lg rounded-lg"
            style={{ display: 'block' }}
          />
        </div>
      </div>

      {/* Hint */}
      <div className="absolute top-4 right-4 bg-slate-800/70 text-slate-400 text-xs px-4 py-2 rounded-xl backdrop-blur-md pointer-events-none border border-slate-700/50 shadow-soft">
        Колесо — зум • Space+ЛКМ — панорама
      </div>
    </div>
  );
};
