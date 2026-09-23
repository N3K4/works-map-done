import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ProjectImage, Zone, Mode, ProjectFile } from './types';
import { CATEGORIES, MIN_ZOOM, MAX_ZOOM } from './constants';
import { loadImage, generateId } from './utils/geometry';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { SaveModal } from './components/SaveModal';

function App() {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('draw');
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const openInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeImage = images.find(img => img.id === activeImageId) || null;

  // Fit to screen
  const fitToScreen = useCallback(() => {
    if (!activeImage || !containerRef.current) return;
    const container = containerRef.current;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const iw = activeImage.canvasSize.width;
    const ih = activeImage.canvasSize.height;
    const scale = Math.min(cw / iw, ch / ih) * 0.9;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale));
    const newPanX = (cw - iw * newZoom) / 2;
    const newPanY = (ch - ih * newZoom) / 2;
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [activeImage]);

  // Load images
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
          // Fit after a tick to let DOM update
          setTimeout(() => {
            setImages(current => {
              const target = current.find(im => im.id === newImage.id);
              if (target && containerRef.current) {
                const cw = containerRef.current.clientWidth;
                const ch = containerRef.current.clientHeight;
                const iw = target.canvasSize.width;
                const ih = target.canvasSize.height;
                const scale = Math.min(cw / iw, ch / ih) * 0.9;
                const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale));
                setZoom(nz);
                setPan({ x: (cw - iw * nz) / 2, y: (ch - ih * nz) / 2 });
              }
              return current;
            });
          }, 50);
        } catch (err) {
          console.error('Failed to load image:', err);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }, []);

  // Open project
  const handleOpenProject = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const project: ProjectFile = JSON.parse(text);
      const loadedImages: ProjectImage[] = [];
      for (const imgData of project.images) {
        const img = await loadImage(imgData.src);
        loadedImages.push({
          id: imgData.id,
          name: imgData.name,
          src: imgData.src,
          img,
          canvasSize: { width: imgData.width, height: imgData.height },
          zones: imgData.zones
        });
      }
      setImages(loadedImages);
      setActiveImageId(project.activeImageId || loadedImages[0]?.id || null);
      setSelectedZoneId(null);
      setTimeout(() => {
        if (containerRef.current && loadedImages.length > 0) {
          const active = loadedImages.find(i => i.id === project.activeImageId) || loadedImages[0];
          const cw = containerRef.current.clientWidth;
          const ch = containerRef.current.clientHeight;
          const iw = active.canvasSize.width;
          const ih = active.canvasSize.height;
          const scale = Math.min(cw / iw, ch / ih) * 0.9;
          const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale));
          setZoom(nz);
          setPan({ x: (cw - iw * nz) / 2, y: (ch - ih * nz) / 2 });
        }
      }, 100);
    } catch (err) {
      alert('Ошибка загрузки проекта: ' + (err as Error).message);
    }
    e.target.value = '';
  }, []);

  // Add zone
  const handleAddZone = useCallback((zone: Zone) => {
    setImages(prev => prev.map(img =>
      img.id === activeImageId
        ? { ...img, zones: [...img.zones, zone] }
        : img
    ));
  }, [activeImageId]);

  // Delete zone
  const handleDeleteZone = useCallback(() => {
    if (!selectedZoneId || !activeImageId) return;
    setImages(prev => prev.map(img =>
      img.id === activeImageId
        ? { ...img, zones: img.zones.filter(z => z.id !== selectedZoneId) }
        : img
    ));
    setSelectedZoneId(null);
  }, [selectedZoneId, activeImageId]);

  // Delete image
  const handleDeleteImage = useCallback((id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (activeImageId === id) {
        setActiveImageId(filtered[0]?.id || null);
      }
      return filtered;
    });
    setSelectedZoneId(null);
  }, [activeImageId]);

  // Rename image
  const handleRenameImage = useCallback((id: string, name: string) => {
    setImages(prev => prev.map(img =>
      img.id === id ? { ...img, name } : img
    ));
  }, []);

  // Export zones only
  const handleExport = useCallback(() => {
    if (!activeImage) return;
    const data = {
      imageId: activeImage.id,
      imageName: activeImage.name,
      zones: activeImage.zones.map(z => ({
        id: z.id,
        label: z.label,
        category: z.category,
        points: z.points
      }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeImage.name}_zones.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeImage]);

  // Clear zones
  const handleClear = useCallback(() => {
    if (!activeImageId) return;
    if (!confirm('Удалить все области на текущем изображении?')) return;
    setImages(prev => prev.map(img =>
      img.id === activeImageId ? { ...img, zones: [] } : img
    ));
    setSelectedZoneId(null);
  }, [activeImageId]);

  // Save project data
  const getProjectData = useCallback(() => {
    const project: ProjectFile = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      activeImageId: activeImageId || '',
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
  }, [images, activeImageId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case '1': case '2': case '3': case '4': case '5':
          setActiveCategory(CATEGORIES[parseInt(e.key) - 1].id);
          break;
        case 'd': case 'D': case 'в': case 'В':
          setMode('draw');
          break;
        case 'v': case 'V': case 'м': case 'М':
          setMode('select');
          break;
        case 'Escape':
          setSelectedZoneId(null);
          break;
        case 'Delete':
          handleDeleteZone();
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            fitToScreen();
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteZone, fitToScreen]);

  // Fit on image switch
  useEffect(() => {
    if (activeImageId) {
      setTimeout(fitToScreen, 50);
    }
  }, [activeImageId, fitToScreen]);

  const hasZones = activeImage ? activeImage.zones.length > 0 : false;

  // Status bar info
  const statusInfo = {
    fileName: activeImage?.name || '',
    category: CATEGORIES.find(c => c.id === activeCategory)?.name || '',
    mode: mode === 'draw' ? 'Рисование' : 'Выбор',
    zoneCount: activeImage?.zones.length || 0,
    zoom: Math.round(zoom * 100)
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      <Header
        onUpload={() => fileInputRef.current?.click()}
        mode={mode}
        setMode={setMode}
        zoom={zoom}
        onZoomIn={() => setZoom(z => Math.min(MAX_ZOOM, z * 1.2))}
        onZoomOut={() => setZoom(z => Math.max(MIN_ZOOM, z / 1.2))}
        onFitScreen={fitToScreen}
        onSave={() => setShowSaveModal(true)}
        onOpen={() => openInputRef.current?.click()}
        onExport={handleExport}
        onClear={handleClear}
        hasZones={hasZones}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          images={images}
          activeImageId={activeImageId}
          onSelectImage={setActiveImageId}
          onRenameImage={handleRenameImage}
          onDeleteImage={handleDeleteImage}
          selectedZoneId={selectedZoneId}
          onSelectZone={setSelectedZoneId}
          onDeleteZone={handleDeleteZone}
          mode={mode}
        />

        <Canvas
          image={activeImage}
          mode={mode}
          activeCategory={activeCategory}
          zoom={zoom}
          pan={pan}
          setZoom={setZoom}
          setPan={setPan}
          onAddZone={handleAddZone}
          selectedZoneId={selectedZoneId}
          onSelectZone={setSelectedZoneId}
          onDeleteZone={handleDeleteZone}
          containerRef={containerRef}
        />
      </div>

      {/* Status bar */}
      <div className="h-8 bg-gray-900 border-t border-gray-700 flex items-center justify-center px-4 shrink-0">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          {statusInfo.fileName && (
            <>
              <span>📄 {statusInfo.fileName}</span>
              <span className="text-gray-600">|</span>
            </>
          )}
          <span>
            <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: CATEGORIES.find(c => c.id === activeCategory)?.color }} />
            {statusInfo.category}
          </span>
          <span className="text-gray-600">|</span>
          <span>{statusInfo.mode}</span>
          <span className="text-gray-600">|</span>
          <span>Зон: {statusInfo.zoneCount}</span>
          <span className="text-gray-600">|</span>
          <span>{statusInfo.zoom}%</span>
        </div>
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
        ref={openInputRef}
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
    </div>
  );
}

export default App;
