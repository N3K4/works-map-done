import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ProjectImage, Zone, Mode, ProjectFile, Point } from './types';
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
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
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
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const scale = Math.min(cw / imgW, ch / imgH) * 0.9;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale));
    const newPanX = (cw - imgW * newZoom) / 2;
    const newPanY = (ch - imgH * newZoom) / 2;
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, []);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setZoom(z => Math.min(MAX_ZOOM, z * 1.2));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(z => Math.max(MIN_ZOOM, z / 1.2));
  }, []);

  const resetZoom = useCallback(() => {
    if (activeImage) {
      fitToScreen(activeImage.img.width, activeImage.img.height);
    }
  }, [activeImage, fitToScreen]);

  // Switch image
  const switchImage = useCallback((id: string) => {
    setActiveImageId(id);
    setCurrentPoints([]);
    setSelectedZone(null);
    const img = images.find(i => i.id === id);
    if (img) {
      setTimeout(() => fitToScreen(img.img.width, img.img.height), 30);
    }
  }, [images, fitToScreen]);

  // Rename
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

  // Delete image
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

  // Delete zone
  const deleteZone = useCallback((zoneId: string) => {
    if (!activeImage) return;
    setImages(prev => prev.map(img =>
      img.id === activeImageId
        ? { ...img, zones: img.zones.filter(z => z.id !== zoneId) }
        : img
    ));
    if (selectedZone === zoneId) setSelectedZone(null);
  }, [activeImage, activeImageId, selectedZone]);

  // Update zones
  const updateZones = useCallback((zones: Zone[]) => {
    setImages(prev => prev.map(img =>
      img.id === activeImageId
        ? { ...img, zones }
        : img
    ));
  }, [activeImageId]);

  // Add zone
  const handleAddZone = useCallback((zone: Zone) => {
    setImages(prev => prev.map(img =>
      img.id === activeImageId
        ? { ...img, zones: [...img.zones, zone] }
        : img
    ));
  }, [activeImageId]);

  // Clear all zones
  const clearAllZones = useCallback(() => {
    if (!activeImageId) return;
    if (!confirm('Удалить все области на текущем изображении?')) return;
    setImages(prev => prev.map(img =>
      img.id === activeImageId ? { ...img, zones: [] } : img
    ));
    setSelectedZone(null);
  }, [activeImageId]);

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
      setSelectedZone(null);
      setTimeout(() => {
        if (containerRef.current && loadedImages.length > 0) {
          const active = loadedImages.find(i => i.id === project.activeImageId) || loadedImages[0];
          fitToScreen(active.canvasSize.width, active.canvasSize.height);
        }
      }, 100);
    } catch (err) {
      alert('Ошибка загрузки проекта: ' + (err as Error).message);
    }
    e.target.value = '';
  }, [fitToScreen]);

  // Export zones only
  const exportZones = useCallback(() => {
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

  // Save modal
  const openSaveModal = useCallback(() => {
    setShowSaveModal(true);
  }, []);

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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case '1': case '2': case '3': case '4': case '5':
          setActiveCategory(CATEGORIES[parseInt(e.key) - 1].id);
          setMode('draw');
          break;
        case 'd': case 'D': case 'в': case 'В':
          setMode('draw');
          break;
        case 'v': case 'V': case 'м': case 'М':
          setMode('select');
          setCurrentPoints([]);
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
  }, [selectedZone, deleteZone, activeImage, fitToScreen]);

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-200 overflow-hidden">
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
        exportZones={exportZones}
        clearAllZones={clearAllZones}
        images={images}
      />

      <div className="flex flex-1 overflow-hidden">
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
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          setMode={setMode}
          currentPoints={currentPoints}
          setCurrentPoints={setCurrentPoints}
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
          deleteZone={deleteZone}
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
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
          containerRef={containerRef}
          currentPoints={currentPoints}
          setCurrentPoints={setCurrentPoints}
        />
      </div>

      {/* Status bar */}
      <div className="h-12 bg-gradient-to-t from-slate-700/70 to-slate-800/70 backdrop-blur-lg border-t border-slate-600/30 flex items-center justify-center px-6 shrink-0">
        <div className="flex items-center gap-6 text-base">
          {activeImage && (
            <>
              <span className="flex items-center gap-2.5 text-slate-400">
                <span className="text-lg">📄</span>
                <span className="text-slate-200 font-semibold">{activeImage.name}</span>
              </span>
              <span className="text-slate-500">•</span>
            </>
          )}
          <span className="flex items-center gap-2.5 text-slate-400">
            <span 
              className="inline-block w-4 h-4 rounded-xl shadow-lg" 
              style={{ backgroundColor: CATEGORIES.find(c => c.id === activeCategory)?.color }} 
            />
            <span className="text-slate-200 font-semibold">{CATEGORIES.find(c => c.id === activeCategory)?.name}</span>
          </span>
          <span className="text-slate-500">•</span>
          <span className="flex items-center gap-2.5 text-slate-400">
            <span className="text-lg">{mode === 'draw' ? '✏️' : '👆'}</span>
            <span className="text-slate-200 font-semibold">{mode === 'draw' ? 'Рисование' : 'Выбор'}</span>
          </span>
          <span className="text-slate-500">•</span>
          <span className="flex items-center gap-2.5 text-slate-400">
            <span className="text-lg">📐</span>
            <span className="text-slate-200 font-bold text-lg">{activeImage?.zones.length || 0}</span>
            <span className="text-sm">областей</span>
          </span>
          <span className="text-slate-500">•</span>
          <span className="flex items-center gap-2.5 text-slate-400">
            <span className="text-lg">🔍</span>
            <span className="text-slate-200 font-mono font-bold text-lg">{zoomPercent}%</span>
          </span>
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
    </div>
  );
}

export default App;
