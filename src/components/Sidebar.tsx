import React from 'react';
import { CATEGORIES } from '../constants';

interface SidebarProps {
  images: any[];
  activeImageId: string | null;
  activeImage: any;
  fileInputRef: React.RefObject<HTMLInputElement>;
  switchImage: (id: string) => void;
  editingName: string | null;
  tempName: string;
  setTempName: (v: string) => void;
  confirmRename: () => void;
  startRename: (id: string, name: string) => void;
  setEditingName: (v: string | null) => void;
  deleteImage: (id: string) => void;
  activeCategory: string;
  setActiveCategory: (c: string) => void;
  setMode: (m: 'draw' | 'select') => void;
  currentPoints: any[];
  setCurrentPoints: (p: any[]) => void;
  selectedZone: string | null;
  setSelectedZone: (id: string | null) => void;
  deleteZone: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  images,
  activeImageId,
  activeImage,
  fileInputRef,
  switchImage,
  editingName,
  tempName,
  setTempName,
  confirmRename,
  startRename,
  setEditingName,
  deleteImage,
  activeCategory,
  setActiveCategory,
  setMode,
  currentPoints,
  setCurrentPoints,
  selectedZone,
  setSelectedZone,
  deleteZone
}) => {
  return (
    <aside>
      {/* Секция: Изображения */}
      <div className="sidebar-section">
        <div className="sidebar-title">
          <span>Изображения ({images.length})</span>
          <button onClick={() => fileInputRef.current?.click()}>+ Добавить</button>
        </div>
        <div className="image-list">
          {images.length === 0 && <div className="empty-state">Нет загруженных изображений</div>}
          {images.map(img => (
            <div 
              key={img.id} 
              className={`image-item ${activeImageId === img.id ? 'active' : ''}`}
              onClick={() => switchImage(img.id)}
            >
              <div className="image-thumb">
                <img src={img.src} alt="" />
              </div>
              <div className="image-info">
                {editingName === img.id ? (
                  <input 
                    type="text" 
                    value={tempName} 
                    onChange={(e) => setTempName(e.target.value)} 
                    onBlur={confirmRename} 
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter') confirmRename(); 
                      if (e.key === 'Escape') { setEditingName(null); setTempName(''); } 
                      e.stopPropagation(); 
                    }} 
                    autoFocus 
                    onClick={(e) => e.stopPropagation()} 
                  />
                ) : (
                  <div className="image-name">
                    <span>{img.name}</span>
                    <button 
                      className="rename-btn"
                      onClick={(e) => { e.stopPropagation(); startRename(img.id, img.name); }}
                    >
                      ✎
                    </button>
                  </div>
                )}
                <div className="image-zones-count">{img.zones.length} обл.</div>
              </div>
              <button 
                className="delete-btn"
                onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Секция: Категории */}
      <div className="sidebar-section">
        <div className="sidebar-title">Категории</div>
        <div className="category-list">
          {CATEGORIES.map((cat, index) => (
            <button 
              key={cat.id} 
              className={`category-item ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => { 
                setActiveCategory(cat.id); 
                setMode('draw'); 
                if (currentPoints.length > 0) setCurrentPoints([]); 
              }}
            >
              <div className="category-color" style={{ backgroundColor: cat.color }}></div>
              <div className="category-name">{cat.name}</div>
              <div className="category-shortcut">{index + 1}</div>
              <div className="category-count">
                {activeImage ? activeImage.zones.filter((z: any) => z.category === cat.id).length : 0}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Секция: Области */}
      <div className="zones-list">
        <div className="sidebar-title">Области ({activeImage ? activeImage.zones.length : 0})</div>
        {!activeImage ? (
          <div className="empty-state">Загрузите изображение</div>
        ) : activeImage.zones.length === 0 ? (
          <div className="empty-state">Нет выделенных областей</div>
        ) : (
          activeImage.zones.map((zone: any) => {
            const cat = CATEGORIES.find(c => c.id === zone.category);
            return (
              <div 
                key={zone.id} 
                className={`zone-item ${selectedZone === zone.id ? 'selected' : ''}`}
                onClick={() => { setSelectedZone(zone.id); setMode('select'); }}
              >
                <div className="zone-color" style={{ backgroundColor: cat?.color }}></div>
                <div className="zone-label">{zone.label}</div>
                <button 
                  className="zone-delete"
                  onClick={(e) => { e.stopPropagation(); deleteZone(zone.id); }}
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Секция: Управление */}
      <div className="instructions">
        <div className="instructions-title">Управление</div>
        <div className="instructions-list">
          <div><kbd>ЛКМ</kbd> — точка / выбрать</div>
          <div><kbd>1-я точка</kbd> — замкнуть</div>
          <div><kbd>ПКМ/Esc</kbd> — отмена</div>
          <div><kbd>Колесо</kbd> — масштаб</div>
          <div><kbd>Space+перетаскивание</kbd> — панорама</div>
          <div><kbd>D/V</kbd> — режим</div>
          <div><kbd>1-5</kbd> — категория</div>
        </div>
      </div>
    </aside>
  );
};
