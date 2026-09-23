import React from 'react';

interface HeaderProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
  activeImage: any;
  mode: 'draw' | 'select';
  setMode: (m: 'draw' | 'select') => void;
  setCurrentPoints: (p: any[]) => void;
  zoomPercent: number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToScreen: (w: number, h: number) => void;
  openSaveModal: () => void;
  projectInputRef: React.RefObject<HTMLInputElement>;
  exportZones: () => void;
  clearAllZones: () => void;
  images: any[];
}

export const Header: React.FC<HeaderProps> = ({
  fileInputRef,
  activeImage,
  mode,
  setMode,
  setCurrentPoints,
  zoomPercent,
  zoomIn,
  zoomOut,
  resetZoom,
  fitToScreen,
  openSaveModal,
  projectInputRef,
  exportZones,
  clearAllZones,
  images
}) => {
  return (
    <header className="bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-md border-b border-slate-700/50 px-5 py-2.5 flex items-center justify-between shrink-0 z-20 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="text-2xl opacity-90">🏗️</div>
        <h1 className="text-lg font-semibold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
          Зонирование
        </h1>
      </div>
      <div className="flex items-center gap-2.5">
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="px-4 py-2 bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-soft hover:shadow-soft-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>📁</span>
          <span>Загрузить</span>
        </button>

        {activeImage && (
          <>
            {/* Переключатель режимов */}
            <div className="flex bg-slate-700/50 backdrop-blur-sm rounded-xl p-1 mx-3 border border-slate-600/30">
              <button 
                onClick={() => setMode('draw')} 
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  mode === 'draw' 
                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-soft' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                }`}
              >
                ✏️ Рисование
              </button>
              <button 
                onClick={() => { setMode('select'); setCurrentPoints([]); }} 
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  mode === 'select' 
                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-soft' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                }`}
              >
                👆 Выбор
              </button>
            </div>

            {/* Контролы зума */}
            <div className="flex items-center bg-slate-700/40 backdrop-blur-sm rounded-xl p-1 gap-1 mr-3 border border-slate-600/30">
              <button 
                onClick={zoomOut} 
                className="px-2.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-600/50 rounded-lg transition-all duration-200"
              >
                −
              </button>
              <button 
                onClick={resetZoom} 
                className="px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-600/50 rounded-lg transition-all duration-200 min-w-[52px] text-center font-mono"
              >
                {zoomPercent}%
              </button>
              <button 
                onClick={zoomIn} 
                className="px-2.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-600/50 rounded-lg transition-all duration-200"
              >
                +
              </button>
              <div className="w-px h-4 bg-slate-600/50 mx-0.5"></div>
              <button 
                onClick={() => activeImage && fitToScreen(activeImage.img.width, activeImage.img.height)} 
                className="px-2.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-600/50 rounded-lg transition-all duration-200" 
                title="Вписать"
              >
                ⊡
              </button>
            </div>

            {/* Кнопки проекта */}
            <div className="flex items-center gap-2 mx-3">
              <button 
                onClick={openSaveModal} 
                disabled={images.length === 0} 
                className="px-4 py-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-700 disabled:text-slate-500 rounded-xl text-xs font-medium transition-all duration-200 shadow-soft hover:shadow-soft-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                📦 Сохранить
              </button>
              <button 
                onClick={() => projectInputRef.current?.click()} 
                className="px-4 py-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 rounded-xl text-xs font-medium transition-all duration-200 shadow-soft hover:shadow-soft-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                📂 Открыть
              </button>
            </div>

            {/* Экспорт и очистка */}
            {activeImage.zones.length > 0 && (
              <>
                <button 
                  onClick={exportZones} 
                  className="px-4 py-2 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-xl text-xs font-medium transition-all duration-200 shadow-soft hover:shadow-soft-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  💾 Экспорт
                </button>
                <button 
                  onClick={clearAllZones} 
                  className="px-4 py-2 bg-gradient-to-br from-rose-500/80 to-rose-600/80 hover:from-rose-400/90 hover:to-rose-500/90 rounded-xl text-xs font-medium transition-all duration-200 shadow-soft hover:shadow-soft-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  🗑️ Очистить
                </button>
              </>
            )}
          </>
        )}
      </div>
    </header>
  );
};
