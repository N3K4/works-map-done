export interface Point {
  x: number;
  y: number;
}

export interface Zone {
  id: string;
  points: Point[];
  category: string;
  /** Номер помещения (отображается как название зоны) */
  roomNumber: string;
  /** Площадь в квадратных метрах */
  area: number | null;
}

export interface ProjectImage {
  id: string;
  name: string;
  src: string;
  img: HTMLImageElement;
  canvasSize: { width: number; height: number };
  zones: Zone[];
}

export interface ProjectFile {
  version: string;
  exportedAt: string;
  activeImageId: string;
  categories?: Category[];
  /** Множитель размера подписей (номер помещения / площадь) на плане и в PNG */
  labelScale?: number;
  images: {
    id: string;
    name: string;
    src: string;
    width: number;
    height: number;
    zones: Zone[];
  }[];
}

export type Mode = 'draw' | 'select';

export interface Category {
  id: string;
  name: string;
  color: string;
}
