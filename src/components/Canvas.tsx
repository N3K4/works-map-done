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
  onUploadClick: () => void;
  onOpenClick: () => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  image, mode, activeCategory, zoom, pan, setZoom, setPan,
  onAddZone, selectedZone, setSelectedZone, containerRef,
  currentPoints, setCurrentPoints, onUploadClick, onOpenClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const mouseDownPosRef = useRef<Point | null>(null);

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

  useEffect(() => {
    setCurrentPoints([]);
  }, [mode, image?.id]);

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

  // Пустое состояние
  if (!image) {
    return (
      <div className="flex-1 relative overflow-hidden bg-gray-950 no-select">
        {/* Фоновый паттерн */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ 
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', 
            backgroundSize: '20px 20px'
          }}
        />
        
        {/* Пустое состояние */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="max-w-md text-center">
            {/* Зона загрузки */}
            <div 
              onClick={onUploadClick}
              className="border-2 border-dashed border-gray-700 rounded-2xl p-10 cursor-pointer hover:border-blue-500/50 hover:bg-gray-800/30 transition-all group mb-4"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🖼️</div>
              <div className="text-lg font-semibold text-gray-300 mb-2">Загрузите изображение</div>
              <div className="text-gray-500 text-sm mb-4">Перетащите файл или нажмите для выбора</div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400 text-sm">
                <span>📁</span>
                <span>Выбрать файл</span>
              </div>
            </div>
            <div className="text-gray-600 text-xs mt-3">Поддерживаются форматы: PNG, JPG, WEBP</div>
            
            {/* Кнопка Открыть проект */}
            <button 
              onClick={onOpenClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-400 text-sm hover:bg-purple-600/30 transition-all mt-4"
            >
              <span>📂</span>
              <span>Открыть проект</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cursorStyle = spacePressed || isPanning ? 'cursor-grabbing' : mode === 'draw' ? 'cursor-crosshair' : 'cursor-pointer';

  return (
    <div className="flex-1 relative overflow-hidden bg-gray-950 no-select">
      {/* Фоновый паттерн */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ 
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', 
          backgroundSize: '20px 20px'
        }}
      />

      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className={`absolute inset-0 overflow-hidden ${cursorStyle}`}
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
            className="shadow-2xl border border-gray-700"
            style={{ display: 'block' }}
          />
        </div>
      </div>

      {/* Подсказка */}
      <div className="absolute top-3 right-3 text-[10px] text-gray-600 pointer-events-none">
        Колесо — зум • Space+ЛКМ — панорама
      </div>

      {/* Статус-бар */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800/95 backdrop-blur-sm rounded-full px-4 py-2 text-xs flex items-center gap-3 shadow-lg ring-1 ring-white/10 pointer-events-none">
        <span className="text-gray-300 font-medium truncate max-w-[120px]">📄 {image.name}</span>
        <span className="text-gray-600">•</span>
        <span 
          className="w-2.5 h-2.5 rounded-full" 
          style={{ backgroundColor: CATEGORIES.find(c => c.id === activeCategory)?.color }}
        />
        <span className="text-gray-300">{CATEGORIES.find(c => c.id === activeCategory)?.name}</span>
        <span className="text-gray-600">•</span>
        <span className="text-gray-400">{mode === 'draw' ? '✏️' : '👆'}</span>
        <span className="text-gray-600">•</span>
        {currentPoints.length > 0 ? (
          <span className="text-yellow-400">{currentPoints.length}т → замкните</span>
        ) : (
          <span className="text-gray-400">{image.zones.length} зон</span>
        )}
        <span className="text-gray-600">•</span>
        <span className="text-gray-400">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
};
