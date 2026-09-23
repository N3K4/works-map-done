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
    <aside className="w-[280px] bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-lg border-r border-slate-600/30 flex flex-col shrink-0 overflow-hidden z-10">
      
      {/* Секция: Изображения */}
      <div className="p-5 border-b border-slate-700/40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🖼️</span>
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Изображения
            </h2>
            <span className="bg-slate-700/60 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {images.length}
            </span>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold transition-all duration-200 hover:scale-105 px-2 py-1 rounded-lg hover:bg-sky-500/10"
          >
            + Добавить
          </button>
        </div>
        
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {images.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-2 opacity-50">📷</div>
              <p className="text-slate-500 text-xs italic">Нет изображений</p>
              <p className="text-slate-600 text-[10px] mt-1">Загрузите первое изображение</p>
            </div>
          ) : (
            images.map(img => (
              <div 
                key={img.id} 
                onClick={() => switchImage(img.id)} 
                className={`flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all duration-300 group ${
                  activeImageId === img.id 
                    ? 'bg-gradient-to-br from-sky-500/20 via-blue-500/15 to-indigo-500/20 ring-2 ring-sky-400/40 shadow-lg shadow-sky-500/10 scale-[1.02]' 
                    : 'hover:bg-slate-700/40 hover:scale-[1.01]'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl overflow-hidden shrink-0 ring-2 transition-all duration-300 ${
                  activeImageId === img.id ? 'ring-sky-400/50 shadow-md' : 'ring-slate-600/30 group-hover:ring-slate-500/40'
                }`}>
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
                      className="w-full bg-slate-700/80 text-xs px-3 py-1.5 rounded-xl border-2 border-sky-400/50 text-slate-200 font-medium" 
                      onClick={(e) => e.stopPropagation()} 
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-200 truncate">{img.name}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); startRename(img.id, img.name); }} 
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-sky-400 text-xs transition-all duration-200 hover:scale-125 p-1 rounded-lg hover:bg-sky-500/10"
                        title="Переименовать"
                      >
                        ✎
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-slate-400 font-medium">{img.zones.length}</span>
                    <span className="text-[10px] text-slate-500">областей</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }} 
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 text-sm p-2 rounded-xl hover:bg-rose-500/10 transition-all duration-200 hover:scale-110"
                  title="Удалить"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Секция: Категории */}
      <div className="p-5 border-b border-slate-700/40">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🎨</span>
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Категории</h2>
        </div>
        <div className="space-y-2">
          {CATEGORIES.map((cat, index) => {
            const count = activeImage ? activeImage.zones.filter((z: any) => z.category === cat.id).length : 0;
            const isActive = activeCategory === cat.id;
            return (
              <button 
                key={cat.id} 
                onClick={() => { 
                  setActiveCategory(cat.id); 
                  setMode('draw'); 
                  if (currentPoints.length > 0) setCurrentPoints([]); 
                }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 text-left group ${
                  isActive 
                    ? 'bg-gradient-to-br from-slate-600/60 to-slate-700/60 ring-2 ring-slate-400/30 shadow-lg scale-[1.02]' 
                    : 'hover:bg-slate-700/40 hover:scale-[1.01]'
                }`}
              >
                <span 
                  className={`w-5 h-5 rounded-lg shrink-0 transition-all duration-300 ${isActive ? 'shadow-lg scale-110' : 'group-hover:scale-105'}`}
                  style={{ 
                    backgroundColor: cat.color,
                    boxShadow: isActive ? `0 4px 12px ${cat.color}40` : 'none'
                  }}
                ></span>
                <span className={`text-sm font-semibold flex-1 transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-200'}`}>
                  {cat.name}
                </span>
                <span className="text-[10px] text-slate-500 bg-slate-700/50 px-2.5 py-1 rounded-lg font-mono font-bold">
                  {index + 1}
                </span>
                <span className={`text-xs font-bold min-w-[24px] text-center px-2 py-1 rounded-lg transition-all duration-200 ${
                  count > 0 
                    ? 'bg-slate-600/60 text-slate-200' 
                    : 'bg-slate-700/30 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Секция: Области */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📐</span>
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Области
          </h2>
          {activeImage && (
            <span className="bg-slate-700/60 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {activeImage.zones.length}
            </span>
          )}
        </div>
        {!activeImage ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2 opacity-50">🖼️</div>
            <p className="text-slate-500 text-xs italic">Загрузите изображение</p>
          </div>
        ) : activeImage.zones.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2 opacity-50">✏️</div>
            <p className="text-slate-500 text-xs italic">Нет областей</p>
            <p className="text-slate-600 text-[10px] mt-1">Начните рисовать!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeImage.zones.map((zone: any) => {
              const cat = CATEGORIES.find(c => c.id === zone.category);
              const isSelected = selectedZone === zone.id;
              return (
                <div 
                  key={zone.id} 
                  onClick={() => { setSelectedZone(zone.id); setMode('select'); }} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group ${
                    isSelected 
                      ? 'bg-gradient-to-br from-slate-600/60 to-slate-700/60 ring-2 ring-slate-400/30 shadow-lg scale-[1.02]' 
                      : 'hover:bg-slate-700/40 hover:scale-[1.01]'
                  }`}
                >
                  <span 
                    className={`w-3.5 h-3.5 rounded-lg shrink-0 transition-all duration-300 ${isSelected ? 'scale-110 shadow-md' : ''}`}
                    style={{ 
                      backgroundColor: cat?.color,
                      boxShadow: isSelected ? `0 2px 8px ${cat?.color}50` : 'none'
                    }}
                  ></span>
                  <span className={`text-sm flex-1 truncate transition-colors duration-200 ${isSelected ? 'text-white font-semibold' : 'text-slate-200 font-medium'}`}>
                    {zone.label}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteZone(zone.id); }} 
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 text-sm p-1.5 rounded-xl hover:bg-rose-500/10 transition-all duration-200 hover:scale-110"
                    title="Удалить область"
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
      <div className="p-5 border-t border-slate-700/40 bg-gradient-to-t from-slate-900/60 to-transparent">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">⌨️</span>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Горячие клавиши</h3>
        </div>
        <div className="grid grid-cols-1 gap-1.5 text-[11px]">
          <div className="flex items-center gap-2 text-slate-400">
            <kbd className="text-slate-300 bg-slate-700/50 px-2 py-1 rounded-lg font-mono text-[10px] border border-slate-600/30 shadow-sm">ЛКМ</kbd>
            <span>точка / выбрать</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <kbd className="text-slate-300 bg-slate-700/50 px-2 py-1 rounded-lg font-mono text-[10px] border border-slate-600/30 shadow-sm">1-я</kbd>
            <span>замкнуть</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <kbd className="text-slate-300 bg-slate-700/50 px-2 py-1 rounded-lg font-mono text-[10px] border border-slate-600/30 shadow-sm">Esc</kbd>
            <span>отмена</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <kbd className="text-slate-300 bg-slate-700/50 px-2 py-1 rounded-lg font-mono text-[10px] border border-slate-600/30 shadow-sm">🖱️</kbd>
            <span>масштаб</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <kbd className="text-slate-300 bg-slate-700/50 px-2 py-1 rounded-lg font-mono text-[10px] border border-slate-600/30 shadow-sm">Space</kbd>
            <span>панорама</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <kbd className="text-slate-300 bg-slate-700/50 px-2 py-1 rounded-lg font-mono text-[10px] border border-slate-600/30 shadow-sm">D/V</kbd>
            <span>режим</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <kbd className="text-slate-300 bg-slate-700/50 px-2 py-1 rounded-lg font-mono text-[10px] border border-slate-600/30 shadow-sm">1-5</kbd>
            <span>категория</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
