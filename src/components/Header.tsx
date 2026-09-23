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
    <header className="bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 px-4 py-2 flex items-center justify-between shrink-0 z-20">
      {/* Левая часть — Логотип */}
      <div className="flex items-center gap-2">
        <div className="text-xl">🏗️</div>
        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Зонирование
        </h1>
      </div>

      {/* Правая часть — кнопки */}
      <div className="flex items-center gap-2">
        {/* Кнопка Загрузить */}
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span>📁</span>
          <span>Загрузить</span>
        </button>

        {activeImage && (
          <>
            {/* Переключатель режимов */}
            <div className="flex bg-gray-700 rounded-lg p-0.5 mx-2">
              <button 
                onClick={() => setMode('draw')} 
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mode === 'draw' 
                    ? 'bg-blue-600 text-white shadow' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                ✏️ Рисование
              </button>
              <button 
                onClick={() => { setMode('select'); setCurrentPoints([]); }} 
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mode === 'select' 
                    ? 'bg-blue-600 text-white shadow' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                👆 Выбор
              </button>
            </div>

            {/* Контролы зума */}
            <div className="flex items-center bg-gray-700/50 rounded-lg p-0.5 gap-0.5 mr-2">
              <button onClick={zoomOut} className="px-2 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors">−</button>
              <button onClick={resetZoom} className="px-2 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors min-w-[48px] text-center font-mono">{zoomPercent}%</button>
              <button onClick={zoomIn} className="px-2 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors">+</button>
              <div className="w-px h-4 bg-gray-600 mx-0.5"></div>
              <button onClick={() => activeImage && fitToScreen(activeImage.img.width, activeImage.img.height)} className="px-2 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors" title="Вписать">⊡</button>
            </div>

            {/* Кнопки проекта */}
            <div className="flex items-center gap-1 mx-2">
              <button onClick={openSaveModal} disabled={images.length === 0} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-xs font-medium transition-colors">
                📦 Сохранить
              </button>
              <button onClick={() => projectInputRef.current?.click()} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-medium transition-colors">
                📂 Открыть
              </button>
            </div>

            {/* Кнопки зон */}
            {activeImage.zones.length > 0 && (
              <>
                <button onClick={exportZones} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-medium transition-colors">💾 Экспорт</button>
                <button onClick={clearAllZones} className="px-3 py-1.5 bg-red-600/80 hover:bg-red-700 rounded-lg text-xs font-medium transition-colors">🗑️ Очистить</button>
              </>
            )}
          </>
        )}
      </div>
    </header>
  );
};
