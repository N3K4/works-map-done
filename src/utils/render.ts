import { Point, Zone, Category } from '../types';
import { hexToRgba } from './geometry';

/** Базовый размер шрифта подписей (px в координатах плана), умножается на labelScale */
export const BASE_LABEL_FONT = 14;

export interface RenderZonesOptions {
  /** Множитель размера названий и площадей (настраивается в меню импорта/экспорта) */
  labelScale: number;
  showLabels: boolean;
  selectedZone?: string | null;
}

export function drawZones(
  ctx: CanvasRenderingContext2D,
  zones: Zone[],
  categories: Category[],
  opts: RenderZonesOptions
) {
  const { labelScale, showLabels, selectedZone } = opts;

  zones.forEach(zone => {
    if (!zone.points || zone.points.length < 3) return;
    const cat = categories.find(c => c.id === zone.category);
    const color = cat?.color || '#666';
    const isSelected = zone.id === selectedZone;

    ctx.beginPath();
    zone.points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();

    ctx.setLineDash([]);
    ctx.fillStyle = hexToRgba(color, isSelected ? 0.55 : 0.3);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? 3 : 1.5;
    ctx.stroke();

    if (showLabels) {
      const cx = zone.points.reduce((s, p) => s + p.x, 0) / zone.points.length;
      const cy = zone.points.reduce((s, p) => s + p.y, 0) / zone.points.length;
      // Название зоны = номер помещения; при наличии — площадь второй строкой
      const lines: string[] = [];
      if (zone.roomNumber) lines.push(zone.roomNumber);
      if (zone.area != null) lines.push(`${zone.area} м²`);
      if (lines.length > 0) {
        const fontSize = BASE_LABEL_FONT * labelScale;
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = Math.max(2, fontSize / 5);
        const lineHeight = fontSize * 1.3;
        const startY = cy - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach((line, li) => {
          ctx.strokeText(line, cx, startY + li * lineHeight);
          ctx.fillStyle = 'white';
          ctx.fillText(line, cx, startY + li * lineHeight);
        });
      }
    }
  });
}

/** Скачивание Blob'а через временную ссылку */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 5000);
}

/**
 * Экспорт плана с зонами в PNG без потери качества:
 * растеризация идёт в нативном разрешении изображения (умноженном на scale),
 * линии и подписи пересчитываются под этот масштаб, imageSmoothing — high.
 */
export async function renderPngBlob(params: {
  img: HTMLImageElement;
  width: number;
  height: number;
  zones: Zone[];
  categories: Category[];
  labelScale: number;
  showLabels: boolean;
  scale?: number;
}): Promise<Blob> {
  const { img, width, height, zones, categories, showLabels } = params;
  const scale = Math.max(1, params.scale ?? 1);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context недоступен');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  // Переводим координаты зон в пиксели экспорта
  const scaledZones: Zone[] = zones.map(z => ({
    ...z,
    points: z.points.map((p: Point) => ({ x: p.x * scale, y: p.y * scale })),
  }));

  ctx.save();
  drawZones(ctx, scaledZones, categories, {
    labelScale: params.labelScale * scale,
    showLabels,
  });
  ctx.restore();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Не удалось создать PNG'));
    }, 'image/png');
  });
}
