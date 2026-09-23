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
    <aside className="w-64 bg-gray-800/95 border-r border-gray-700 flex flex-col shrink-0 overflow-hidden z-10">
      
      {/* СЕКЦИЯ 1: ИЗОБРАЖЕНИЯ */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Изображения ({images.length})
          </h2>
          <button onClick={() => fileInputRef.current?.click()} className="text-[10px] text-blue-400 hover:text-blue-300">
            + Добавить
          </button>
        </div>
        <div className="space-y-1 max-h-52 overflow-y-auto">
          {images.length === 0 && <p className="text-gray-600 text-xs italic py-2">Нет изображений</p>}
          {images.map(img => (
            <div 
              key={img.id} 
              onClick={() => switchImage(img.id)} 
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all group ${
                activeImageId === img.id 
                  ? 'bg-blue-600/20 ring-1 ring-blue-500/40' 
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="w-8 h-8 rounded bg-gray-700 overflow-hidden shrink-0">
                <img src={img.src} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
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
                    className="w-full bg-gray-700 text-xs px-1.5 py-0.5 rounded border border-blue-500 outline-none" 
                    onClick={(e) => e.stopPropagation()} 
                  />
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium truncate">{img.name}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); startRename(img.id, img.name); }} 
                      className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-blue-400 text-[10px]"
                    >
                      ✎
                    </button>
                  </div>
                )}
                <span className="text-[10px] text-gray-500">{img.zones.length} обл.</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }} 
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-xs p-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* СЕКЦИЯ 2: КАТЕГОРИИ */}
      <div className="p-3 border-b border-gray-700">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Категории</h2>
        <div className="space-y-1">
          {CATEGORIES.map((cat, index) => (
            <button 
              key={cat.id} 
              onClick={() => { 
                setActiveCategory(cat.id); 
                setMode('draw'); 
                if (currentPoints.length > 0) setCurrentPoints([]); 
              }} 
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left ${
                activeCategory === cat.id ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ backgroundColor: cat.color }}></span>
              <span className="text-xs font-medium flex-1">{cat.name}</span>
              <span className="text-[10px] text-gray-500 bg-gray-700/50 px-1.5 py-0.5 rounded">{index + 1}</span>
              <span className="text-[10px] font-bold text-gray-400 min-w-[16px] text-center">
                {activeImage ? activeImage.zones.filter((z: any) => z.category === cat.id).length : 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* СЕКЦИЯ 3: ОБЛАСТИ */}
      <div className="flex-1 overflow-y-auto p-3">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
          Области ({activeImage ? activeImage.zones.length : 0})
        </h2>
        {!activeImage ? <p className="text-gray-600 text-xs italic">Загрузите изображение</p>
          : activeImage.zones.length === 0 ? <p className="text-gray-600 text-xs italic">Нет областей</p>
          : (
            <div className="space-y-1">
              {activeImage.zones.map((zone: any) => {
                const cat = CATEGORIES.find(c => c.id === zone.category);
                return (
                  <div 
                    key={zone.id} 
                    onClick={() => { setSelectedZone(zone.id); setMode('select'); }} 
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all group ${
                      selectedZone === zone.id 
                        ? 'bg-white/10 ring-1 ring-white/20' 
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: cat?.color }}></span>
                    <span className="text-xs flex-1 truncate">{zone.label}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteZone(zone.id); }} 
                      className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      {/* СЕКЦИЯ 4: УПРАВЛЕНИЕ */}
      <div className="p-3 border-t border-gray-700 bg-gray-800/50">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Управление</h3>
        <div className="grid grid-cols-1 gap-0.5 text-[10px] text-gray-500">
          <div><kbd className="text-gray-400">ЛКМ</kbd> — точка / выбрать</div>
          <div><kbd className="text-gray-400">1-я точка</kbd> — замкнуть</div>
          <div><kbd className="text-gray-400">ПКМ/Esc</kbd> — отмена</div>
          <div><kbd className="text-gray-400">Колесо</kbd> — масштаб</div>
          <div><kbd className="text-gray-400">Space+ЛКМ</kbd> — панорама</div>
          <div><kbd className="text-gray-400">Ctrl+0</kbd> — вписать</div>
          <div><kbd className="text-gray-400">D/V</kbd> — режим</div>
          <div><kbd className="text-gray-400">1-5</kbd> — категория</div>
        </div>
      </div>
    </aside>
  );
};
