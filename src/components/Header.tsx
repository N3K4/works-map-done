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
  openExportModal: () => void;
  clearAllZones: () => void;
  images: any[];
  showLabels: boolean;
  setShowLabels: (v: boolean) => void;
  areaCoefficient: number;
  setAreaCoefficient: (v: number) => void;
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
  openExportModal,
  clearAllZones,
  images,
  showLabels,
  setShowLabels,
  areaCoefficient,
  setAreaCoefficient
}) => {
  return (
    <header>
      <div className="logo">
        <div className="logo-icon">🏗️</div>
        <div className="logo-text">Зонирование</div>
      </div>
      <div className="header-actions">
        <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
          <span>📁</span>
          <span>Загрузить</span>
        </button>

        {activeImage && (
          <>
            <div className="mode-switcher">
              <button 
                className={`mode-btn ${mode === 'draw' ? 'active' : ''}`}
                onClick={() => setMode('draw')}
              >
                ✏️ Рисование
              </button>
              <button 
                className={`mode-btn ${mode === 'select' ? 'active' : ''}`}
                onClick={() => { setMode('select'); setCurrentPoints([]); }}
              >
                👆 Выбор
              </button>
            </div>

            <div className="zoom-controls">
              <button className="zoom-btn" onClick={zoomOut}>−</button>
              <div className="zoom-display">{zoomPercent}%</div>
              <button className="zoom-btn" onClick={zoomIn}>+</button>
              <div className="zoom-divider"></div>
              <button className="zoom-btn" onClick={() => activeImage && fitToScreen(activeImage.img.width, activeImage.img.height)}>⊡</button>
            </div>

            <button
              className={`btn-label-toggle ${showLabels ? 'active' : ''}`}
              onClick={() => setShowLabels(!showLabels)}
              title="Показать/скрыть названия зон на плане (L)"
            >
              {showLabels ? '🏷️ Названия: вкл' : '🏷️ Названия: выкл'}
            </button>

            <label
              className="area-coefficient"
              title="Коэффициент пересчёта площади пикселей плана в м²: примерная площадь зоны = площадь в px² × коэффициент². Вводится вручную."
            >
              <span className="area-coefficient-label">Коэф. м²/px:</span>
              <input
                type="number"
                min="0"
                step="0.001"
                value={areaCoefficient}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setAreaCoefficient(Number.isFinite(v) && v >= 0 ? v : 0);
                }}
              />
            </label>

            <button className="btn-purple" onClick={openSaveModal} disabled={images.length === 0}>
              📦 Сохранить
            </button>
            <button className="btn-indigo" onClick={() => projectInputRef.current?.click()}>
              📂 Открыть
            </button>

            {activeImage.zones.length > 0 && (
              <>
                <button className="btn-success" onClick={openExportModal} title="Экспорт в PNG / JSON, настройка масштаба подписей">
                  💾 Экспорт
                </button>
                <button className="btn-danger" onClick={clearAllZones}>
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
