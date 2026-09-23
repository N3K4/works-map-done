import { Category } from './types';

export const CATEGORIES: Category[] = [
  { id: 'floor', name: 'Пол', color: '#8B5CF6' },
  { id: 'ceiling', name: 'Потолок', color: '#06B6D4' },
  { id: 'walls', name: 'Стены', color: '#F59E0B' },
  { id: 'partitions', name: 'Перегородки', color: '#10B981' },
  { id: 'engineering', name: 'Инженерные системы', color: '#EF4444' },
];

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 10;
export const CLOSE_RADIUS = 15;
export const DRAG_THRESHOLD = 5;
