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
    <header className="bg-gradient-to-b from-slate-800/90 to-slate-900/90 backdrop-blur-lg border-b border-slate-600/30 px-6 py-3 flex items-center justify-between shrink-0 z-20 shadow-soft">
      <div className="flex items-center gap-4">
        <div className="text-3xl drop-shadow-lg">🏗️</div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-sky-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Зонирование
          </h1>
          <p className="text-[10px] text-slate-400 font-medium -mt-0.5">Редактор областей</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="group px-5 py-2.5 bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center gap-2.5 shadow-lg hover:shadow-xl hover:shadow-sky-500/20 hover:scale-105 active:scale-95"
        >
          <span className="text-lg group-hover:scale-110 transition-transform">📁</span>
          <span>Загрузить</span>
        </button>

        {activeImage && (
          <>
            {/* Переключатель режимов */}
            <div className="flex bg-slate-700/40 backdrop-blur-md rounded-2xl p-1.5 mx-4 border border-slate-600/20 shadow-inner">
              <button 
                onClick={() => setMode('draw')} 
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  mode === 'draw' 
                    ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 scale-105' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-600/40'
                }`}
              >
                <span className="text-base">✏️</span>
                <span>Рисование</span>
              </button>
              <button 
                onClick={() => { setMode('select'); setCurrentPoints([]); }} 
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  mode === 'select' 
                    ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 scale-105' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-600/40'
                }`}
              >
                <span className="text-base">👆</span>
                <span>Выбор</span>
              </button>
            </div>

            {/* Контролы зума */}
            <div className="flex items-center bg-slate-700/30 backdrop-blur-md rounded-2xl p-1.5 gap-1.5 mr-4 border border-slate-600/20 shadow-inner">
              <button 
                onClick={zoomOut} 
                className="w-9 h-9 flex items-center justify-center text-sm text-slate-300 hover:text-white hover:bg-slate-600/50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
              >
                −
              </button>
              <button 
                onClick={resetZoom} 
                className="px-4 h-9 text-sm text-slate-200 hover:text-white hover:bg-slate-600/50 rounded-xl transition-all duration-200 min-w-[60px] text-center font-mono font-semibold"
              >
                {zoomPercent}%
              </button>
              <button 
                onClick={zoomIn} 
                className="w-9 h-9 flex items-center justify-center text-sm text-slate-300 hover:text-white hover:bg-slate-600/50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
              >
                +
              </button>
              <div className="w-px h-5 bg-slate-600/40 mx-1"></div>
              <button 
                onClick={() => activeImage && fitToScreen(activeImage.img.width, activeImage.img.height)} 
                className="w-9 h-9 flex items-center justify-center text-sm text-slate-300 hover:text-white hover:bg-slate-600/50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95" 
                title="Вписать в экран"
              >
                ⊡
              </button>
            </div>

            {/* Кнопки проекта */}
            <div className="flex items-center gap-2.5 mx-4">
              <button 
                onClick={openSaveModal} 
                disabled={images.length === 0} 
                className="group px-5 py-2.5 bg-gradient-to-br from-fuchsia-500 to-pink-600 hover:from-fuchsia-400 hover:to-pink-500 disabled:from-slate-600 disabled:to-slate-700 disabled:text-slate-500 rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-fuchsia-500/20 hover:scale-105 active:scale-95"
              >
                <span className="text-base group-hover:scale-110 transition-transform">📦</span>
                <span>Сохранить</span>
              </button>
              <button 
                onClick={() => projectInputRef.current?.click()} 
                className="group px-5 py-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/20 hover:scale-105 active:scale-95"
              >
                <span className="text-base group-hover:scale-110 transition-transform">📂</span>
                <span>Открыть</span>
              </button>
            </div>

            {/* Экспорт и очистка */}
            {activeImage.zones.length > 0 && (
              <>
                <button 
                  onClick={exportZones} 
                  className="group px-5 py-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-emerald-500/20 hover:scale-105 active:scale-95"
                >
                  <span className="text-base group-hover:scale-110 transition-transform">💾</span>
                  <span>Экспорт</span>
                </button>
                <button 
                  onClick={clearAllZones} 
                  className="group px-5 py-2.5 bg-gradient-to-br from-rose-500/90 to-red-600/90 hover:from-rose-400 hover:to-red-500 rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-rose-500/20 hover:scale-105 active:scale-95"
                >
                  <span className="text-base group-hover:scale-110 transition-transform">🗑️</span>
                  <span>Очистить</span>
                </button>
              </>
            )}
          </>
        )}
      </div>
    </header>
  );
};
