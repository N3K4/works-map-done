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
    <header className="bg-gradient-to-b from-slate-700/70 to-slate-800/70 backdrop-blur-lg border-b border-slate-600/30 px-8 py-4 flex items-center justify-between shrink-0 z-20 shadow-soft">
      <div className="flex items-center gap-5">
        <div className="text-4xl drop-shadow-lg">🏗️</div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Зонирование
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Редактор областей</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="group px-6 py-3 bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 rounded-2xl text-base font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl hover:shadow-sky-500/25 hover:scale-105 active:scale-95"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">📁</span>
          <span>Загрузить</span>
        </button>

        {activeImage && (
          <>
            {/* Переключатель режимов */}
            <div className="flex bg-slate-600/40 backdrop-blur-md rounded-2xl p-2 mx-5 border border-slate-500/30 shadow-inner">
              <button 
                onClick={() => setMode('draw')} 
                className={`px-6 py-3 rounded-xl text-base font-semibold transition-all duration-300 flex items-center gap-2.5 ${
                  mode === 'draw' 
                    ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/35 scale-105' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-500/40'
                }`}
              >
                <span className="text-lg">✏️</span>
                <span>Рисование</span>
              </button>
              <button 
                onClick={() => { setMode('select'); setCurrentPoints([]); }} 
                className={`px-6 py-3 rounded-xl text-base font-semibold transition-all duration-300 flex items-center gap-2.5 ${
                  mode === 'select' 
                    ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/35 scale-105' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-500/40'
                }`}
              >
                <span className="text-lg">👆</span>
                <span>Выбор</span>
              </button>
            </div>

            {/* Контролы зума */}
            <div className="flex items-center bg-slate-600/30 backdrop-blur-md rounded-2xl p-2 gap-2 mx-5 border border-slate-500/30 shadow-inner">
              <button 
                onClick={zoomOut} 
                className="w-11 h-11 flex items-center justify-center text-base text-slate-300 hover:text-white hover:bg-slate-500/50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 font-bold"
              >
                −
              </button>
              <button 
                onClick={resetZoom} 
                className="px-5 h-11 text-base text-slate-200 hover:text-white hover:bg-slate-500/50 rounded-xl transition-all duration-200 min-w-[70px] text-center font-mono font-bold"
              >
                {zoomPercent}%
              </button>
              <button 
                onClick={zoomIn} 
                className="w-11 h-11 flex items-center justify-center text-base text-slate-300 hover:text-white hover:bg-slate-500/50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 font-bold"
              >
                +
              </button>
              <div className="w-px h-6 bg-slate-500/40 mx-1"></div>
              <button 
                onClick={() => activeImage && fitToScreen(activeImage.img.width, activeImage.img.height)} 
                className="w-11 h-11 flex items-center justify-center text-base text-slate-300 hover:text-white hover:bg-slate-500/50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 font-bold" 
                title="Вписать в экран"
              >
                ⊡
              </button>
            </div>

            {/* Кнопки проекта */}
            <div className="flex items-center gap-3 mx-5">
              <button 
                onClick={openSaveModal} 
                disabled={images.length === 0} 
                className="group px-6 py-3 bg-gradient-to-br from-fuchsia-500 to-pink-600 hover:from-fuchsia-400 hover:to-pink-500 disabled:from-slate-600 disabled:to-slate-700 disabled:text-slate-500 rounded-2xl text-base font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl hover:shadow-fuchsia-500/25 hover:scale-105 active:scale-95"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">📦</span>
                <span>Сохранить</span>
              </button>
              <button 
                onClick={() => projectInputRef.current?.click()} 
                className="group px-6 py-3 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-2xl text-base font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl hover:shadow-cyan-500/25 hover:scale-105 active:scale-95"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">📂</span>
                <span>Открыть</span>
              </button>
            </div>

            {/* Экспорт и очистка */}
            {activeImage.zones.length > 0 && (
              <>
                <button 
                  onClick={exportZones} 
                  className="group px-6 py-3 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-2xl text-base font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl hover:shadow-emerald-500/25 hover:scale-105 active:scale-95"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">💾</span>
                  <span>Экспорт</span>
                </button>
                <button 
                  onClick={clearAllZones} 
                  className="group px-6 py-3 bg-gradient-to-br from-rose-500/90 to-red-600/90 hover:from-rose-400 hover:to-red-500 rounded-2xl text-base font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl hover:shadow-rose-500/25 hover:scale-105 active:scale-95"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">🗑️</span>
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
