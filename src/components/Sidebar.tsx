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
    <aside className="w-[300px] bg-gradient-to-b from-slate-700/60 to-slate-800/60 backdrop-blur-lg border-r border-slate-600/30 flex flex-col shrink-0 overflow-hidden z-10">
      
      {/* Секция: Изображения */}
      <div className="p-6 border-b border-slate-600/30">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🖼️</span>
            <div>
              <h2 className="text-sm font-bold text-slate-200">
                Изображения
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{images.length} файл{images.length === 1 ? '' : 'а'}</p>
            </div>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="px-4 py-2 text-sm text-sky-400 hover:text-sky-300 font-semibold transition-all duration-200 hover:scale-105 rounded-xl hover:bg-sky-500/10 border border-sky-500/20 hover:border-sky-400/40"
          >
            + Добавить
          </button>
        </div>
        
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {images.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3 opacity-50">📷</div>
              <p className="text-slate-400 text-sm font-medium">Нет изображений</p>
              <p className="text-slate-500 text-xs mt-2">Загрузите первое изображение</p>
            </div>
          ) : (
            images.map(img => (
              <div 
                key={img.id} 
                onClick={() => switchImage(img.id)} 
                className={`flex items-center gap-4 px-4 py-4 rounded-2xl cursor-pointer transition-all duration-300 group ${
                  activeImageId === img.id 
                    ? 'bg-gradient-to-br from-sky-500/25 via-blue-500/20 to-indigo-500/25 ring-2 ring-sky-400/50 shadow-lg shadow-sky-500/15 scale-[1.02]' 
                    : 'hover:bg-slate-600/40 hover:scale-[1.01]'
                }`}
              >
                <div className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 ring-2 transition-all duration-300 ${
                  activeImageId === img.id ? 'ring-sky-400/60 shadow-md' : 'ring-slate-500/30 group-hover:ring-slate-400/40'
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
                      className="w-full bg-slate-700/80 text-sm px-3 py-2 rounded-xl border-2 border-sky-400/50 text-slate-200 font-medium" 
                      onClick={(e) => e.stopPropagation()} 
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-slate-100 truncate">{img.name}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); startRename(img.id, img.name); }} 
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-sky-400 text-sm transition-all duration-200 hover:scale-125 p-1.5 rounded-lg hover:bg-sky-500/10"
                        title="Переименовать"
                      >
                        ✎
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400 font-medium">{img.zones.length}</span>
                    <span className="text-xs text-slate-500">областей</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }} 
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 text-base p-2.5 rounded-xl hover:bg-rose-500/10 transition-all duration-200 hover:scale-110"
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
      <div className="p-6 border-b border-slate-600/30">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">🎨</span>
          <div>
            <h2 className="text-sm font-bold text-slate-200">Категории</h2>
            <p className="text-xs text-slate-400 mt-0.5">Выберите тип области</p>
          </div>
        </div>
        <div className="space-y-3">
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
                className={`category-btn w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-left group ${
                  isActive 
                    ? 'bg-gradient-to-br from-slate-500/50 to-slate-600/50 ring-2 ring-slate-400/40 shadow-lg scale-[1.02]' 
                    : 'hover:bg-slate-600/40'
                }`}
              >
                <span 
                  className={`w-8 h-8 rounded-xl shrink-0 transition-all duration-300 ${isActive ? 'shadow-lg scale-110' : 'group-hover:scale-105'}`}
                  style={{ 
                    backgroundColor: cat.color,
                    boxShadow: isActive ? `0 4px 16px ${cat.color}50` : `0 2px 8px ${cat.color}30`
                  }}
                ></span>
                <div className="flex-1">
                  <span className={`text-base font-bold transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-200'}`}>
                    {cat.name}
                  </span>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {count} {count === 1 ? 'область' : count >= 2 && count <= 4 ? 'области' : 'областей'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500 bg-slate-700/50 px-3 py-1.5 rounded-xl font-mono font-bold">
                    {index + 1}
                  </span>
                  <span className={`text-sm font-bold min-w-[32px] text-center px-3 py-1.5 rounded-xl transition-all duration-200 ${
                    count > 0 
                      ? 'bg-slate-500/50 text-slate-100' 
                      : 'bg-slate-700/30 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Секция: Области */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">📐</span>
          <div>
            <h2 className="text-sm font-bold text-slate-200">
              Области
            </h2>
            {activeImage && (
              <p className="text-xs text-slate-400 mt-0.5">{activeImage.zones.length} элемент{activeImage.zones.length === 1 ? '' : 'а'}</p>
            )}
          </div>
        </div>
        {!activeImage ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-3 opacity-50">🖼️</div>
            <p className="text-slate-400 text-sm font-medium">Загрузите изображение</p>
          </div>
        ) : activeImage.zones.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-3 opacity-50">✏️</div>
            <p className="text-slate-400 text-sm font-medium">Нет областей</p>
            <p className="text-slate-500 text-xs mt-2">Начните рисовать!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeImage.zones.map((zone: any) => {
              const cat = CATEGORIES.find(c => c.id === zone.category);
              const isSelected = selectedZone === zone.id;
              return (
                <div 
                  key={zone.id} 
                  onClick={() => { setSelectedZone(zone.id); setMode('select'); }} 
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 group ${
                    isSelected 
                      ? 'bg-gradient-to-br from-slate-500/50 to-slate-600/50 ring-2 ring-slate-400/40 shadow-lg scale-[1.02]' 
                      : 'hover:bg-slate-600/40 hover:scale-[1.01]'
                  }`}
                >
                  <span 
                    className={`w-5 h-5 rounded-xl shrink-0 transition-all duration-300 ${isSelected ? 'scale-110 shadow-md' : ''}`}
                    style={{ 
                      backgroundColor: cat?.color,
                      boxShadow: isSelected ? `0 2px 10px ${cat?.color}50` : 'none'
                    }}
                  ></span>
                  <span className={`text-base flex-1 truncate transition-colors duration-200 ${isSelected ? 'text-white font-bold' : 'text-slate-200 font-semibold'}`}>
                    {zone.label}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteZone(zone.id); }} 
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 text-base p-2 rounded-xl hover:bg-rose-500/10 transition-all duration-200 hover:scale-110"
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
      <div className="p-6 border-t border-slate-600/30 bg-gradient-to-t from-slate-800/60 to-transparent">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">⌨️</span>
          <h3 className="text-sm font-bold text-slate-200">Горячие клавиши</h3>
        </div>
        <div className="grid grid-cols-1 gap-2.5 text-sm">
          <div className="flex items-center gap-3 text-slate-400">
            <kbd className="text-slate-200 bg-slate-700/50 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border border-slate-600/30 shadow-sm min-w-[60px] text-center">ЛКМ</kbd>
            <span>точка / выбрать</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <kbd className="text-slate-200 bg-slate-700/50 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border border-slate-600/30 shadow-sm min-w-[60px] text-center">1-я</kbd>
            <span>замкнуть</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <kbd className="text-slate-200 bg-slate-700/50 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border border-slate-600/30 shadow-sm min-w-[60px] text-center">Esc</kbd>
            <span>отмена</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <kbd className="text-slate-200 bg-slate-700/50 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border border-slate-600/30 shadow-sm min-w-[60px] text-center">🖱️</kbd>
            <span>масштаб</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <kbd className="text-slate-200 bg-slate-700/50 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border border-slate-600/30 shadow-sm min-w-[60px] text-center">Space</kbd>
            <span>панорама</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <kbd className="text-slate-200 bg-slate-700/50 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border border-slate-600/30 shadow-sm min-w-[60px] text-center">D/V</kbd>
            <span>режим</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <kbd className="text-slate-200 bg-slate-700/50 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border border-slate-600/30 shadow-sm min-w-[60px] text-center">1-5</kbd>
            <span>категория</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
