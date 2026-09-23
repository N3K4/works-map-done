export interface Point {
  x: number;
  y: number;
}

export interface Zone {
  id: string;
  points: Point[];
  category: string;
  label: string;
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
