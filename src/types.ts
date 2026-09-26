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
  /** Показывать ли подписи зон */
  showLabels?: boolean;
  /** Какие данные показывать в подписях зон */
  labelToggles?: LabelToggles;
  /** Коэффициент пересчёта площади пикселей плана в м² (вводится вручную в шапке) */
  areaCoefficient?: number;
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

/** Что показывать в подписях зон на плане (и в PNG-экспорте) */
export interface LabelToggles {
  /** Номер помещения (название зоны) */
  name: boolean;
  /** Площадь в м² */
  area: boolean;
  /** Название категории */
  category: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  /** Скрыта ли категория (её зоны не заливаются на плане) */
  hidden?: boolean;
}
