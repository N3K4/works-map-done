import { Category } from './types';

// Палитра цветов для новых категорий
export const CATEGORY_COLORS: string[] = [
  '#8B5CF6', '#06B6D4', '#F59E0B', '#10B981',
  '#EF4444', '#3B82F6', '#EC4899', '#84CC16',
];

// Категории по умолчанию (пользователь может создавать свои)
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'default-1', name: 'Категория 1', color: CATEGORY_COLORS[0] },
];

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 10;
export const CLOSE_RADIUS = 15;
export const DRAG_THRESHOLD = 5;
