import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ProjectImage, Zone, Mode, ProjectFile, Point, Category, LabelToggles } from './types';
import { DEFAULT_CATEGORIES, MIN_ZOOM, MAX_ZOOM } from './constants';
import { loadImage, generateId, polygonCentroid } from './utils/geometry';
import { renderPngBlob, downloadBlob } from './utils/render';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { SaveModal } from './components/SaveModal';
import { ExportModal } from './components/ExportModal';

function App() {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('draw');
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [showLabels, setShowLabels] = useState(true);
  /** Что показывать в подписях зон: название / площадь / категорию */
  const [labelToggles, setLabelToggles] = useState<LabelToggles>({ name: true, area: true, category: true });
  /** Множитель размера названий и площадей (настраивается в меню экспорта) */
  const [labelScale, setLabelScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeImage = images.find(img => img.id === activeImageId) || null;
  const zoomPercent = Math.round(zoom * 100);

  // Fit to screen
  const fitToScreen = useCallback((imgW: number, imgH: number) => {
    const mainElement = document.querySelector('main');
    if (!mainElement) {
      console.warn('fitToScreen: main element not found');
      return;
    }
    const cw = mainElement.clientWidth;
    const ch = mainElement.clientHeight;

    if (cw === 0 || ch === 0) {
      console.warn('fitToScreen: main element has zero dimensions', { cw, ch });
      return;
    }

    const scale = Math.min(cw / imgW, ch / imgH) * 0.9;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale));
    const newPanX = (cw - imgW * newZoom) / 2;
    const newPanY = (ch - imgH * newZoom) / 2;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, []);

  const zoomIn = useCallback(() => {
    setZoom(Math.min(MAX_ZOOM, zoom * 1.2));
  }, [zoom]);

  const zoomOut = useCallback(() => {
    setZoom(Math.max(MIN_ZOOM, zoom / 1.2));
  }, [zoom]);

  const resetZoom = useCallback(() => {
    if (activeImage) {
      fitToScreen(activeImage.img.width, activeImage.img.height);
    }
  }, [activeImage, fitToScreen]);

  const switchImage = useCallback((id: string) => {
    setActiveImageId(id);
    setCurrentPoints([]);
    setSelectedZone(null);
    const img = images.find(i => i.id === id);
    if (img) {
      setTimeout(() => fitToScreen(img.img.width, img.img.height), 30);
    }
  }, [images, fitToScreen]);

  const startRename = useCallback((id: string, name: string) => {
    setEditingName(id);
    setTempName(name);
  }, []);

  const confirmRename = useCallback(() => {
    if (editingName && tempName.trim()) {
      setImages(prev => prev.map(img =>
        img.id === editingName ? { ...img, name: tempName.trim() } : img
      ));
    }
    setEditingName(null);
    setTempName('');
  }, [editingName, tempName]);

  const deleteImage = useCallback((id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (activeImageId === id) {
        setActiveImageId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
    setSelectedZone(null);
  }, [activeImageId]);

  const deleteZone = useCallback((zoneId: string) => {
    if (!activeImage) return;
    setImages(prev => prev.map(img =>
      img.id === activeImageId
        ? { ...img, zones: img.zones.filter(z => z.id !== zoneId) }
        : img
    ));
    if (selectedZone === zoneId) setSelectedZone(null);
  }, [activeImage, activeImageId, selectedZone]);

  const handleAddZone = useCallback((zone: Zone) => {
    setImages(prev => prev.map(img =>
      img.id === activeImageId
        ? { ...img, zones: [...img.zones, zone] }
        : img
    ));
  }, [activeImageId]);

  const updateZone = useCallback((zoneId: string, updates: Partial<Zone>) => {
    setImages(prev => prev.map(img =>
      img.id === activeImageId
        ? { ...img, zones: img.zones.map(z => z.id === zoneId ? { ...z, ...updates } : z) }
        : img
    ));
  }, [activeImageId]);

  // Плавная анимация фокуса вида на зоне
  const focusAnimRef = useRef<number | null>(null);

  /** Фокусировка вида на зоне: центрирует её в видимой области плана.
   *  Зум не меняем — только панорамирование, чтобы вид «не прыгал» при кликах. */
  const focusOnZone = useCallback((zoneId: string) => {
    if (!activeImage) return;
    const zone = activeImage.zones.find(z => z.id === zoneId);
    if (!zone || zone.points.length < 3) return;

    const mainElement = document.querySelector('main');
    if (!mainElement) return;
    const cw = mainElement.clientWidth;
    const ch = mainElement.clientHeight;
    if (cw === 0 || ch === 0) return;

    // Центр масс полигона — для вытянутых L-образных зон надёжнее bounding box
    const c = polygonCentroid(zone.points);
    const targetPan = { x: cw / 2 - c.x * zoom, y: ch / 2 - c.y * zoom };

    // Если цель почти совпадает с текущим видом — ничего не делаем
    if (Math.abs(targetPan.x - pan.x) < 1 && Math.abs(targetPan.y - pan.y) < 1) {
      return;
    }

    // Плавная анимация ~250 мс (ease-out cubic)
    if (focusAnimRef.current !== null) cancelAnimationFrame(focusAnimRef.current);
    const startPan = { ...pan };
    const duration = 250;
    const startTime = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const k = easeOut(t);
      setPan({
        x: startPan.x + (targetPan.x - startPan.x) * k,
        y: startPan.y + (targetPan.y - startPan.y) * k,
      });
      if (t < 1) {
        focusAnimRef.current = requestAnimationFrame(step);
      } else {
        focusAnimRef.current = null;
      }
    };
    focusAnimRef.current = requestAnimationFrame(step);
  }, [activeImage, zoom, pan]);

  useEffect(() => () => {
    if (focusAnimRef.current !== null) cancelAnimationFrame(focusAnimRef.current);
  }, []);

  const clearAllZones = useCallback(() => {
    if (!activeImageId) return;
    if (!confirm('Удалить все области на текущем изображении?')) return;
    setImages(prev => prev.map(img =>
      img.id === activeImageId ? { ...img, zones: [] } : img
    ));
    setSelectedZone(null);
  }, [activeImageId]);

  // ===== Категории: создание / переименование / цвет / удаление =====
  const addCategory = useCallback((name: string, color: string) => {
    const cat: Category = { id: generateId(), name: name.trim() || 'Новая категория', color };
    setCategories(prev => [...prev, cat]);
    setActiveCategory(cat.id);
    return cat.id;
  }, []);

  const renameCategory = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name: trimmed } : c));
  }, []);

  const changeCategoryColor = useCallback((id: string, color: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, color } : c));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    const zonesUsing = images.reduce((sum, img) =>
      sum + img.zones.filter(z => z.category === id).length, 0);
    if (zonesUsing > 0) {
      if (!confirm(`Категория используется в зонах (${zonesUsing} шт. на всех изображениях). Удалить категорию? Зоны тоже будут удалены.`)) {
        return;
      }
      setImages(prev => prev.map(img => ({
        ...img,
        zones: img.zones.filter(z => z.category !== id)
      })));
    }
    setCategories(prev => {
      const filtered = prev.filter(c => c.id !== id);
      const result = filtered.length > 0 ? filtered : DEFAULT_CATEGORIES;
      if (activeCategory === id) {
        setActiveCategory(result[0].id);
      }
      return result;
    });
  }, [images, activeCategory]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const src = ev.target?.result as string;
        try {
          const img = await loadImage(src);
          const newImage: ProjectImage = {
            id: generateId(),
            name: file.name.replace(/\.[^.]+$/, ''),
            src,
            img,
            canvasSize: { width: img.naturalWidth, height: img.naturalHeight },
            zones: []
          };
          setImages(prev => [...prev, newImage]);
          setActiveImageId(newImage.id);
          setTimeout(() => {
            fitToScreen(img.naturalWidth, img.naturalHeight);
          }, 50);
        } catch (err) {
          console.error('Failed to load image:', err);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }, [fitToScreen]);

  const handleOpenProject = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const project: ProjectFile = JSON.parse(text);

      // Проверяем структуру проекта
      if (!project.images || !Array.isArray(project.images)) {
        throw new Error('Неверный формат файла: отсутствует массив images');
      }

      // Восстанавливаем пользовательские категории, если они сохранены в проекте
      if (Array.isArray((project as any).categories) && (project as any).categories.length > 0) {
        const cats: Category[] = (project as any).categories;
        setCategories(cats);
        setActiveCategory(prev => cats.some(c => c.id === prev) ? prev : cats[0].id);
      }

      // Восстанавливаем настройку масштаба подписей
      if (typeof (project as any).labelScale === 'number' && (project as any).labelScale > 0) {
        setLabelScale(Math.min(4, Math.max(0.5, (project as any).labelScale)));
      }

      // Восстанавливаем настройки отображения подписей
      if (typeof (project as any).showLabels === 'boolean') {
        setShowLabels((project as any).showLabels);
      }
      const lt = (project as any).labelToggles;
      if (lt && typeof lt === 'object') {
        setLabelToggles({
          name: typeof lt.name === 'boolean' ? lt.name : true,
          area: typeof lt.area === 'boolean' ? lt.area : true,
          category: typeof lt.category === 'boolean' ? lt.category : true,
        });
      }

      const loadedImages: ProjectImage[] = [];

      // Загружаем все изображения
      for (const imgData of project.images) {
        try {
          const img = await loadImage(imgData.src);
          // Миграция старых проектов: label -> roomNumber
          const zones: Zone[] = (imgData.zones || []).map((z: any) => ({
            id: z.id,
            points: z.points,
            category: z.category,
            roomNumber: z.roomNumber ?? z.label ?? '',
            area: typeof z.area === 'number' ? z.area : null,
          }));
          loadedImages.push({
            id: imgData.id,
            name: imgData.name || 'Без имени',
            src: imgData.src,
            img,
            canvasSize: {
              width: imgData.width || img.naturalWidth,
              height: imgData.height || img.naturalHeight
            },
            zones
          });
        } catch (imgErr) {
          console.error(`Не удалось загрузить изображение: ${imgData.name}`, imgErr);
        }
      }

      if (loadedImages.length === 0) {
        throw new Error('Не удалось загрузить ни одного изображения');
      }

      // Определяем активное изображение
      const activeId = project.activeImageId && loadedImages.find(i => i.id === project.activeImageId)
        ? project.activeImageId
        : loadedImages[0].id;

      // Устанавливаем состояние
      setImages(loadedImages);
      setActiveImageId(activeId);
      setSelectedZone(null);
      setCurrentPoints([]);

      // Подгоняем масштаб после рендера
      setTimeout(() => {
        const activeImg = loadedImages.find(i => i.id === activeId);
        if (activeImg) {
          fitToScreen(activeImg.canvasSize.width, activeImg.canvasSize.height);
        }
      }, 100);

      console.log(`Проект загружен: ${loadedImages.length} изображений`);
    } catch (err) {
      console.error('Ошибка загрузки проекта:', err);
      alert('Ошибка загрузки проекта: ' + (err as Error).message);
    }

    e.target.value = '';
  }, [fitToScreen]);

  const exportZones = useCallback(() => {
    if (!activeImage) return;
    const data = {
      imageId: activeImage.id,
      imageName: activeImage.name,
      categories: categories.map(c => ({ id: c.id, name: c.name, color: c.color })),
      zones: activeImage.zones.map(z => ({
        id: z.id,
        roomNumber: z.roomNumber,
        area: z.area,
        category: categories.find(c => c.id === z.category)?.name || z.category,
        points: z.points
      }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${activeImage.name}_zones.json`);
  }, [activeImage, categories]);

  /** Экспорт PNG в нативном разрешении изображения (умноженном на scale) — без потери качества.
   *  Используется из меню «Экспорт» сайдбара (быстрая кнопка). */
  const exportPng = useCallback(async (scale: number = 1) => {
    if (!activeImage) return;
    try {
      const blob = await renderPngBlob({
        img: activeImage.img,
        width: activeImage.canvasSize.width,
        height: activeImage.canvasSize.height,
        zones: activeImage.zones,
        categories,
        labelScale,
        showLabels,
        labelToggles,
        scale,
      });
      const suffix = scale > 1 ? `@${scale}x` : '';
      downloadBlob(blob, `${activeImage.name}${suffix}.png`);
    } catch (err) {
      console.error('Ошибка экспорта PNG:', err);
      alert('Не удалось экспортировать PNG: ' + (err as Error).message);
    }
  }, [activeImage, categories, labelScale, showLabels, labelToggles]);

  const openSaveModal = useCallback(() => {
    setShowSaveModal(true);
  }, []);

  const openExportModal = useCallback(() => {
    setShowExportModal(true);
  }, []);

  const getProjectData = useCallback(() => {
    const project: ProjectFile = {
      version: '1.3',
      exportedAt: new Date().toISOString(),
      activeImageId: activeImageId || '',
      categories,
      labelScale,
      showLabels,
      labelToggles,
      images: images.map(img => ({
        id: img.id,
        name: img.name,
        src: img.src,
        width: img.canvasSize.width,
        height: img.canvasSize.height,
        zones: img.zones
      }))
    };
    return JSON.stringify(project, null, 2);
  }, [images, activeImageId, categories, labelScale, showLabels, labelToggles]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const digit = parseInt(e.key);
      if (!isNaN(digit) && digit >= 1 && digit <= 9 && categories[digit - 1]) {
        setActiveCategory(categories[digit - 1].id);
        setMode('draw');
        return;
      }

      switch (e.key) {
        case 'd': case 'D': case 'в': case 'В':
          setMode('draw');
          break;
        case 'v': case 'V': case 'м': case 'М':
          setMode('select');
          setCurrentPoints([]);
          break;
        case 'l': case 'L': case 'д': case 'Д':
          setShowLabels(prev => !prev);
          break;
        case 'Delete':
          if (selectedZone) {
            deleteZone(selectedZone);
          }
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (activeImage) {
              fitToScreen(activeImage.img.width, activeImage.img.height);
            }
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedZone, deleteZone, activeImage, fitToScreen, categories]);

  return (
    <div className="app">
      <Header
        fileInputRef={fileInputRef}
        activeImage={activeImage}
        mode={mode}
        setMode={setMode}
        setCurrentPoints={setCurrentPoints}
        zoomPercent={zoomPercent}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        resetZoom={resetZoom}
        fitToScreen={fitToScreen}
        openSaveModal={openSaveModal}
        projectInputRef={projectInputRef}
        openExportModal={openExportModal}
        clearAllZones={clearAllZones}
        images={images}
        showLabels={showLabels}
        setShowLabels={setShowLabels}
      />

      <div className="main-content">
        <Sidebar
          images={images}
          activeImageId={activeImageId}
          activeImage={activeImage}
          fileInputRef={fileInputRef}
          switchImage={switchImage}
          editingName={editingName}
          tempName={tempName}
          setTempName={setTempName}
          confirmRename={confirmRename}
          startRename={startRename}
          setEditingName={setEditingName}
          deleteImage={deleteImage}
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          addCategory={addCategory}
          renameCategory={renameCategory}
          changeCategoryColor={changeCategoryColor}
          deleteCategory={deleteCategory}
          setMode={setMode}
          currentPoints={currentPoints}
          setCurrentPoints={setCurrentPoints}
          selectedZone={selectedZone}
          setSelectedZone={(id) => { setSelectedZone(id); if (id) focusOnZone(id); }}
          deleteZone={deleteZone}
          updateZone={updateZone}
          showLabels={showLabels}
          setShowLabels={setShowLabels}
          labelToggles={labelToggles}
          setLabelToggles={setLabelToggles}
          labelScale={labelScale}
          setLabelScale={setLabelScale}
          openExportModal={openExportModal}
          exportPng={exportPng}
          exportZones={exportZones}
        />

        <Canvas
          image={activeImage}
          mode={mode}
          activeCategory={activeCategory}
          categories={categories}
          showLabels={showLabels}
          labelToggles={labelToggles}
          labelScale={labelScale}
          zoom={zoom}
          pan={pan}
          setZoom={setZoom}
          setPan={setPan}
          onAddZone={handleAddZone}
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
          containerRef={containerRef}
          currentPoints={currentPoints}
          setCurrentPoints={setCurrentPoints}
          onUploadClick={() => fileInputRef.current?.click()}
          onOpenClick={() => projectInputRef.current?.click()}
          images={images}
        />
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleUpload}
      />
      <input
        ref={projectInputRef}
        type="file"
        accept=".zoneproj,.json"
        className="hidden"
        onChange={handleOpenProject}
      />

      {/* Save modal */}
      <SaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        projectData={getProjectData()}
        projectName={activeImage?.name || 'project'}
      />

      {/* Export modal: PNG + настройка масштаба названий/площадей */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        activeImage={activeImage}
        categories={categories}
        labelScale={labelScale}
        setLabelScale={setLabelScale}
        showLabels={showLabels}
        labelToggles={labelToggles}
        setLabelToggles={setLabelToggles}
        exportZones={exportZones}
      />
    </div>
  );
}

export default App;
