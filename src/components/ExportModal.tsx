import React, { useEffect, useRef, useState } from 'react';
import { renderPngBlob, downloadBlob, drawZones } from '../utils/render';
import { ProjectImage, Category } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeImage: ProjectImage | null;
  categories: Category[];
  labelScale: number;
  setLabelScale: (v: number) => void;
  showLabels: boolean;
  exportZones: () => void;
}

const RES_OPTIONS = [1, 2, 3] as const;

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen, onClose, activeImage, categories, labelScale, setLabelScale, showLabels, exportZones,
}) => {
  const [resolution, setResolution] = useState<number>(2);
  const [busy, setBusy] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);

  // Живой предпросмотр: мини-копия плана с зонами и текущим масштабом подписей
  useEffect(() => {
    if (!isOpen || !activeImage || !previewRef.current) return;
    const canvas = previewRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cancelled = false;
    const draw = (img: HTMLImageElement) => {
      if (cancelled) return;
      const maxW = 560;
      const scale = Math.min(1, maxW / img.width);
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      canvas.width = w;
      canvas.height = h;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      const scaledZones = activeImage.zones.map(z => ({
        ...z,
        points: z.points.map(p => ({ x: p.x * scale, y: p.y * scale })),
      }));

      // В превью подписи должны выглядеть пропорционально так же, как в PNG:
      // fontInPreview = base * labelScale * previewScale  =>  передаём labelScale * previewScale^2,
      // т.к. drawZones внутри умножает базовый размер на labelScale и рисует в пикселях превью
      ctx.save();
      drawZones(ctx, scaledZones, categories, {
        labelScale: labelScale * scale,
        showLabels,
      });
      ctx.restore();
    };

    const image = new Image();
    image.onload = () => draw(image);
    image.src = activeImage.src;

    return () => { cancelled = true; };
  }, [isOpen, activeImage, categories, labelScale, showLabels, resolution]);

  if (!isOpen || !activeImage) return null;

  const outW = Math.round(activeImage.canvasSize.width * resolution);
  const outH = Math.round(activeImage.canvasSize.height * resolution);

  const handlePng = async () => {
    try {
      setBusy(true);
      const blob = await renderPngBlob({
        img: activeImage.img,
        width: activeImage.canvasSize.width,
        height: activeImage.canvasSize.height,
        zones: activeImage.zones,
        categories,
        labelScale,
        showLabels,
        scale: resolution,
      });
      const suffix = resolution > 1 ? `@${resolution}x` : '';
      downloadBlob(blob, `${activeImage.name}${suffix}.png`);
      onClose();
    } catch (err) {
      console.error('Ошибка экспорта PNG:', err);
      alert('Не удалось экспортировать PNG: ' + (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="export-overlay" onClick={onClose}>
      <div className="export-modal" onClick={e => e.stopPropagation()}>
        <div className="export-header">
          <span className="export-title">📤 Экспорт — {activeImage.name}</span>
          <button className="export-close" onClick={onClose}>✕</button>
        </div>

        <div className="export-body">
          <div className="export-preview-wrap">
            <canvas ref={previewRef} className="export-preview" />
            <div className="export-preview-hint">Предпросмотр: так зоны и подписи будут выглядеть в PNG</div>
          </div>

          {/* Масштаб названий и площадей */}
          <div className="export-setting">
            <div className="export-setting-label">
              <span>Масштаб названий и площадей</span>
              <span className="export-setting-value">×{labelScale.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.05}
              value={labelScale}
              onChange={(e) => setLabelScale(parseFloat(e.target.value))}
            />
            <div className="export-setting-range-hints">
              <span>×0.5</span><span>×4</span>
            </div>
          </div>

          {/* Разрешение PNG */}
          <div className="export-setting">
            <div className="export-setting-label">
              <span>Разрешение PNG</span>
              <span className="export-setting-value">{outW} × {outH} px</span>
            </div>
            <div className="export-res-row">
              {RES_OPTIONS.map(r => (
                <button
                  key={r}
                  className={`export-res-btn ${resolution === r ? 'active' : ''}`}
                  onClick={() => setResolution(r)}
                >
                  ×{r}{r === 1 ? ' (нативное)' : ''}
                </button>
              ))}
            </div>
            <div className="export-note">
              PNG рендерится напрямую из исходного изображения в выбранном разрешении — качество оригинала не теряется.
            </div>
          </div>
        </div>

        <div className="export-footer">
          <button className="btn-success" onClick={exportZones}>
            💾 JSON зон
          </button>
          <button className="btn-primary" onClick={handlePng} disabled={busy}>
            {busy ? '⏳ Рендер…' : '🖼️ Скачать PNG'}
          </button>
        </div>
      </div>
    </div>
  );
};
