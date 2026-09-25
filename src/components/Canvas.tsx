import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Point, Zone, ProjectImage, Mode, Category } from '../types';
import { CLOSE_RADIUS, DRAG_THRESHOLD } from '../constants';
import { pointInPolygon, distance, hexToRgba } from '../utils/geometry';

interface CanvasProps {
  image: ProjectImage | null;
  mode: Mode;
  activeCategory: string;
  categories: Category[];
  showLabels: boolean;
  zoom: number;
  pan: { x: number; y: number };
  setZoom: (z: number) => void;
  setPan: (p: { x: number; y: number }) => void;
  onAddZone: (zone: Zone) => void;
  selectedZone: string | null;
  setSelectedZone: (id: string | null) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  currentPoints: Point[];
  setCurrentPoints: (p: Point[]) => void;
  onUploadClick: () => void;
  onOpenClick: () => void;
  images: any[];
}

export const Canvas: React.FC<CanvasProps> = ({
  image, mode, activeCategory, categories, showLabels, zoom, pan, setZoom, setPan,
  onAddZone, selectedZone, setSelectedZone, containerRef,
  currentPoints, setCurrentPoints, onUploadClick, onOpenClick, images
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const mouseDownPosRef = useRef<Point | null>(null);
  
  // Refs для хранения актуальных значений zoom и pan
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  
  // Обновляем refs при изменении state
  useEffect(() => {
    zoomRef.current = zoom;
    panRef.current = pan;
  }, [zoom, pan]);

  const screenToCanvas = useCallback((sx: number, sy: number): Point => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    // Получаем viewport (main element) - родитель контейнера
    const viewport = container.parentElement;
    if (!viewport) return { x: 0, y: 0 };
    const viewportRect = viewport.getBoundingClientRect();
    // Координаты относительно viewport
    const relX = sx - viewportRect.left;
    const relY = sy - viewportRect.top;
    // Преобразуем в координаты canvas
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
      const cat = categories.find(c => c.id === zone.category);
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

      if (showLabels && zone.points.length > 0) {
        const cx = zone.points.reduce((s, p) => s + p.x, 0) / zone.points.length;
        const cy = zone.points.reduce((s, p) => s + p.y, 0) / zone.points.length;
        // Название зоны = номер помещения; при наличии — площадь второй строкой
        const lines: string[] = [];
        if (zone.roomNumber) lines.push(zone.roomNumber);
        if (zone.area != null) lines.push(`${zone.area} м²`);
        if (lines.length > 0) {
          ctx.font = `${14 / zoom}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.strokeStyle = 'rgba(0,0,0,0.7)';
          ctx.lineWidth = 3 / zoom;
          const lineHeight = 18 / zoom;
          const startY = cy - ((lines.length - 1) * lineHeight) / 2;
          lines.forEach((line, li) => {
            ctx.strokeText(line, cx, startY + li * lineHeight);
            ctx.fillStyle = 'white';
            ctx.fillText(line, cx, startY + li * lineHeight);
          });
        }
      }
    });

    // Draw current drawing
    if (currentPoints.length > 0) {
      const cat = categories.find(c => c.id === activeCategory);
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
  }, [image, currentPoints, mousePos, selectedZone, zoom, activeCategory, categories, showLabels]);

  // Wheel zoom
  useEffect(() => {
    // Находим main элемент
    const mainElement = document.querySelector('main');
    if (!mainElement) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Координаты мыши относительно main
      const mainRect = mainElement.getBoundingClientRect();
      const mouseX = e.clientX - mainRect.left;
      const mouseY = e.clientY - mainRect.top;

      // Используем актуальные значения из refs
      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(10, currentZoom * delta));
      const scale = newZoom / currentZoom;
      
      // Пересчитываем pan так, чтобы точка под курсором оставалась на месте
      const newPanX = mouseX - scale * (mouseX - currentPan.x);
      const newPanY = mouseY - scale * (mouseY - currentPan.y);
      
      // Обновляем state
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
      
      // Обновляем refs сразу
      zoomRef.current = newZoom;
      panRef.current = { x: newPanX, y: newPanY };
    };

    // Добавляем listener на main
    mainElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => mainElement.removeEventListener('wheel', handleWheel);
  }, [setZoom, setPan]);

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
          // Название не задаём: у зоны есть номер помещения и площадь — их вводит пользователь
          const newZone: Zone = {
            id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
            points: [...currentPoints],
            category: activeCategory,
            roomNumber: '',
            area: null
          };
          onAddZone(newZone);
          setSelectedZone(newZone.id);
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

  const cursorClass = isPanning || spacePressed ? 'cursor-grabbing' : mode === 'draw' ? 'cursor-crosshair' : 'cursor-pointer';

  return (
    <main className={cursorClass}>
      <div className="viewport-bg"></div>
      
      {!image && (
        <div className="upload-area">
          <div className="upload-content">
            <div className="upload-box" onClick={onUploadClick}>
              <div className="upload-icon">🖼️</div>
              <div className="upload-title">Загрузите изображение</div>
              <div className="upload-desc">План помещения, чертёж или фото — начните выделять зоны</div>
              <div className="upload-btn">
                <span>📁</span>
                <span>Нажмите для выбора файла</span>
              </div>
              <div className="upload-hint">Можно загрузить несколько файлов сразу</div>
            </div>
            <div className="or-divider">или</div>
            <button className="project-btn" onClick={onOpenClick}>
              <span>📂</span>
              <span>Открыть сохранённый проект</span>
            </button>
            <div className="project-hint">Формат .zoneproj</div>
          </div>
        </div>
      )}

      {image && (
        <>
          <div
            ref={containerRef as React.RefObject<HTMLDivElement>}
            className="canvas-container"
            style={{
              left: pan.x,
              top: pan.y,
              transform: `scale(${zoom})`
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
            />
          </div>

          <div className="status-bar">
            <div className="status-item">
              <span>📄</span>
              <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {image.name}
              </span>
            </div>
            <div className="status-divider">•</div>
            <div 
              className="status-dot" 
              style={{ backgroundColor: categories.find(c => c.id === activeCategory)?.color }}
            ></div>
            <div className="status-item">{categories.find(c => c.id === activeCategory)?.name || 'Без категории'}</div>
            <div className="status-divider">•</div>
            <div className="status-item">{mode === 'draw' ? '✏️' : '👆'}</div>
            {currentPoints.length > 0 && mode === 'draw' && (
              <>
                <div className="status-divider">•</div>
                <div className="status-item status-warning">
                  {currentPoints.length}т {currentPoints.length >= 3 ? '→ замкните' : ''}
                </div>
              </>
            )}
            <div className="status-divider">•</div>
            <div className="status-item">{Math.round(zoom * 100)}%</div>
          </div>

          <div className="zoom-hint">Колесо — зум • Space+ЛКМ — панорама</div>
        </>
      )}
    </main>
  );
};
