import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Point, Zone, ProjectImage, Mode, Category, LabelToggles } from '../types';
import { CLOSE_RADIUS, DRAG_THRESHOLD } from '../constants';
import { pointInPolygon, distance, hexToRgba } from '../utils/geometry';
import { drawZones } from '../utils/render';

interface CanvasProps {
  image: ProjectImage | null;
  mode: Mode;
  activeCategory: string;
  categories: Category[];
  showLabels: boolean;
  labelToggles?: LabelToggles;
  labelScale: number;
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
  image, mode, activeCategory, categories, showLabels, labelToggles, labelScale, zoom, pan, setZoom, setPan,
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
    // Надёжное преобразование через фактический прямоугольник canvas на экране:
    // getBoundingClientRect() учитывает CSS transform scale(zoom) контейнера,
    // поэтому точки рисования попадают точно под курсор при любом зуме/пане.
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: (sx - rect.left) / zoom, y: (sy - rect.top) / zoom };
  }, [zoom]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Размер задаём только при изменении (присваивание width очищает канвас —
    // при каждом тике зума это вызывало мерцание «прыгающего» рисования)
    if (canvas.width !== image.canvasSize.width) canvas.width = image.canvasSize.width;
    if (canvas.height !== image.canvasSize.height) canvas.height = image.canvasSize.height;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(image.img, 0, 0);

    // Draw zones (общий рендерер — тот же, что используется при экспорте в PNG).
    // ВАЖНО: зоны рисуются в координатах ПЛАНА без ctx.scale(zoom):
    // CSS transform: scale(zoom) на контейнере сам масштабирует канвас.
    // Масштабирование только через CSS исключает рассинхрон трансформаций
    // (прыжки зума и «прыгающее» отображение рисования зон).
    drawZones(ctx, image.zones, categories, {
      labelScale,
      showLabels,
      labelToggles,
      selectedZone,
      zoom,
    });

    // Draw current drawing
    if (currentPoints.length > 0) {
      const cat = categories.find(c => c.id === activeCategory);
      const color = cat?.color || '#666';

      ctx.save();

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

      // Толщины/радиусы делим на zoom — визуально остаются постоянными
      // в экранных пикселях после CSS-масштабирования контейнера.
      ctx.strokeStyle = color;
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([8 / zoom, 4 / zoom]);
      ctx.stroke();
      ctx.setLineDash([]);

      currentPoints.forEach((p, i) => {
        const isFirst = i === 0;
        const radius = (isFirst ? 8 : 5) / zoom;

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

      ctx.restore();
    }
  }, [image, currentPoints, mousePos, selectedZone, zoom, activeCategory, categories, showLabels, labelToggles, labelScale]);

  // Wheel zoom
  useEffect(() => {
    // Вешаем на window с passive:false: listener живёт всё время, что смонтирован
    // Canvas (canvas-container появляется только при загруженном изображении —
    // навешивание на ref в ранний момент было источником «зум не работает»).
    const handleWheel = (e: WheelEvent) => {
      const el = containerRef.current;
      if (!el || !image) return;
      // Зумим только когда курсор над рабочей областью (main)
      const main = el.parentElement;
      if (!main) return;
      const mr = main.getBoundingClientRect();
      if (e.clientX < mr.left || e.clientX > mr.right || e.clientY < mr.top || e.clientY > mr.bottom) return;

      e.preventDefault();

      // Точка фиксации — курсор. pan живёт в системе координат main
      // (canvas-container позиционируется left/top = pan внутри main).
      const mouseX = e.clientX - mr.left;
      const mouseY = e.clientY - mr.top;

      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(10, currentZoom * delta));
      const k = newZoom / currentZoom;

      // Пересчёт pan по формуле transform-origin: 0 0:
      // screen = pan + zoom * plan  =>  pan' = mouse - k * (mouse - pan)
      // Точка под курсором остаётся на месте — нет скачков назад/вперёд.
      const newPanX = mouseX - k * (mouseX - currentPan.x);
      const newPanY = mouseY - k * (mouseY - currentPan.y);

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });

      // Обновляем refs сразу, чтобы следующий тик колеса не использовал устаревшие значения
      zoomRef.current = newZoom;
      panRef.current = { x: newPanX, y: newPanY };
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [containerRef, setZoom, setPan, image]);

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
