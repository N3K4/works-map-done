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
    <aside className="w-64 bg-gradient-to-b from-slate-800/70 to-slate-900/70 backdrop-blur-md border-r border-slate-700/50 flex flex-col shrink-0 overflow-hidden z-10">
      {/* Секция: Изображения */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Изображения ({images.length})
          </h2>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors duration-200"
          >
            + Добавить
          </button>
        </div>
        <div className="space-y-1.5 max-h-52 overflow-y-auto">
          {images.length === 0 && (
            <p className="text-slate-500 text-xs italic py-3 text-center">Нет изображений</p>
          )}
          {images.map(img => (
            <div 
              key={img.id} 
              onClick={() => switchImage(img.id)} 
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group ${
                activeImageId === img.id 
                  ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 ring-1 ring-indigo-400/40 shadow-soft' 
                  : 'hover:bg-slate-700/40'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-slate-700/60 overflow-hidden shrink-0 ring-1 ring-slate-600/30">
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
                    className="w-full bg-slate-700/80 text-xs px-2 py-1 rounded-lg border border-indigo-400/50 text-slate-200" 
                    onClick={(e) => e.stopPropagation()} 
                  />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-200 truncate">{img.name}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); startRename(img.id, img.name); }} 
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-indigo-400 text-[10px] transition-all duration-200"
                    >
                      ✎
                    </button>
                  </div>
                )}
                <span className="text-[10px] text-slate-500">{img.zones.length} обл.</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }} 
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 text-xs p-1.5 rounded-lg hover:bg-rose-500/10 transition-all duration-200"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Секция: Категории */}
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Категории</h2>
        <div className="space-y-1.5">
          {CATEGORIES.map((cat, index) => (
            <button 
              key={cat.id} 
              onClick={() => { 
                setActiveCategory(cat.id); 
                setMode('draw'); 
                if (currentPoints.length > 0) setCurrentPoints([]); 
              }} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left ${
                activeCategory === cat.id 
                  ? 'bg-gradient-to-br from-slate-600/60 to-slate-700/60 ring-1 ring-slate-500/30 shadow-soft' 
                  : 'hover:bg-slate-700/40'
              }`}
            >
              <span 
                className="w-4 h-4 rounded-md shrink-0 shadow-soft" 
                style={{ backgroundColor: cat.color }}
              ></span>
              <span className="text-xs font-medium text-slate-200 flex-1">{cat.name}</span>
              <span className="text-[10px] text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-md">{index + 1}</span>
              <span className="text-[10px] font-semibold text-slate-400 min-w-[18px] text-center">
                {activeImage ? activeImage.zones.filter((z: any) => z.category === cat.id).length : 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Секция: Области */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Области ({activeImage ? activeImage.zones.length : 0})
        </h2>
        {!activeImage ? (
          <p className="text-slate-500 text-xs italic text-center py-4">Загрузите изображение</p>
        ) : activeImage.zones.length === 0 ? (
          <p className="text-slate-500 text-xs italic text-center py-4">Нет областей</p>
        ) : (
          <div className="space-y-1.5">
            {activeImage.zones.map((zone: any) => {
              const cat = CATEGORIES.find(c => c.id === zone.category);
              return (
                <div 
                  key={zone.id} 
                  onClick={() => { setSelectedZone(zone.id); setMode('select'); }} 
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group ${
                    selectedZone === zone.id 
                      ? 'bg-gradient-to-br from-slate-600/60 to-slate-700/60 ring-1 ring-slate-400/30 shadow-soft' 
                      : 'hover:bg-slate-700/40'
                  }`}
                >
                  <span 
                    className="w-3 h-3 rounded-md shrink-0" 
                    style={{ backgroundColor: cat?.color }}
                  ></span>
                  <span className="text-xs text-slate-200 flex-1 truncate">{zone.label}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteZone(zone.id); }} 
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 text-xs p-1 rounded-lg hover:bg-rose-500/10 transition-all duration-200"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Секция: Управление */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-800/40">
        <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Управление</h3>
        <div className="grid grid-cols-1 gap-1 text-[10px] text-slate-500">
          <div><kbd className="text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded-md">ЛКМ</kbd> — точка / выбрать</div>
          <div><kbd className="text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded-md">1-я точка</kbd> — замкнуть</div>
          <div><kbd className="text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded-md">ПКМ/Esc</kbd> — отмена</div>
          <div><kbd className="text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded-md">Колесо</kbd> — масштаб</div>
          <div><kbd className="text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded-md">Space+ЛКМ</kbd> — панорама</div>
          <div><kbd className="text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded-md">Ctrl+0</kbd> — вписать</div>
          <div><kbd className="text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded-md">D/V</kbd> — режим</div>
          <div><kbd className="text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded-md">1-5</kbd> — категория</div>
        </div>
      </div>
    </aside>
  );
};
