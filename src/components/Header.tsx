import React from 'react';
import { Mode } from '../types';
import { MIN_ZOOM, MAX_ZOOM } from '../constants';

interface HeaderProps {
  onUpload: () => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitScreen: () => void;
  onSave: () => void;
  onOpen: () => void;
  onExport: () => void;
  onClear: () => void;
  hasZones: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onUpload, mode, setMode, zoom, onZoomIn, onZoomOut, onFitScreen,
  onSave, onOpen, onExport, onClear, hasZones
}) => {
  return (
    <header className="h-12 bg-gray-900 border-b border-gray-700 flex items-center px-3 gap-2 shrink-0">
      <div className="text-lg font-bold text-white mr-2 whitespace-nowrap">🏗️ Зонирование</div>

      <button onClick={onUpload} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors whitespace-nowrap">
        📁 Загрузить
      </button>

      <div className="flex bg-gray-800 rounded overflow-hidden ml-2">
        <button onClick={() => setMode('draw')} className={`px-3 py-1.5 text-sm transition-colors ${mode === 'draw' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          ✏️ Рисование
        </button>
        <button onClick={() => setMode('select')} className={`px-3 py-1.5 text-sm transition-colors ${mode === 'select' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          👆 Выбор
        </button>
      </div>

      <div className="flex items-center gap-1 ml-auto bg-gray-800 rounded px-1">
        <button onClick={onZoomOut} disabled={zoom <= MIN_ZOOM} className="px-2 py-1 text-gray-300 hover:text-white disabled:opacity-30 text-sm">−</button>
        <span className="text-xs text-gray-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={onZoomIn} disabled={zoom >= MAX_ZOOM} className="px-2 py-1 text-gray-300 hover:text-white disabled:opacity-30 text-sm">+</button>
        <button onClick={onFitScreen} className="px-2 py-1 text-gray-300 hover:text-white text-sm" title="Вписать в экран">⊡</button>
      </div>

      <button onClick={onSave} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors whitespace-nowrap">
        📦 Сохранить
      </button>
      <button onClick={onOpen} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors whitespace-nowrap">
        📂 Открыть
      </button>

      {hasZones && (
        <>
          <button onClick={onExport} className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-sm rounded transition-colors whitespace-nowrap">
            💾 Экспорт
          </button>
          <button onClick={onClear} className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-sm rounded transition-colors whitespace-nowrap">
            🗑️ Очистить
          </button>
        </>
      )}
    </header>
  );
};
