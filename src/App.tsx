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
    const mainElement = document.querySelector('main');
    if (!mainElement) return;
    const cw = mainElement.clientWidth;
    const ch = mainElement.clientHeight;
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

  const clearAllZones = useCallback(() => {
    if (!activeImageId) return;
    if (!confirm('Удалить все области на текущем изображении?')) return;
    setImages(prev => prev.map(img =>
      img.id === activeImageId ? { ...img, zones: [] } : img
    ));
    setSelectedZone(null);
  }, [activeImageId]);

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
      setCurrentPoints([]);
      setTimeout(() => {
        if (containerRef.current && loadedImages.length > 0) {
          const active = loadedImages.find(i => i.id === project.activeImageId) || loadedImages[0];
          if (active) {
            fitToScreen(active.canvasSize.width, active.canvasSize.height);
          }
        }
      }, 300);
    } catch (err) {
      alert('Ошибка загрузки проекта: ' + (err as Error).message);
    }
    e.target.value = '';
  }, [fitToScreen]);

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
        exportZones={exportZones}
        clearAllZones={clearAllZones}
        images={images}
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
    </div>
  );
}

export default App;
