import React, { useState, useRef, useEffect } from 'react';
import { Category, Zone, LabelToggles } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { polygonArea } from '../utils/geometry';

interface SidebarProps {
  images: any[];
  activeImageId: string | null;
  activeImage: any;
  fileInputRef: React.RefObject<HTMLInputElement>;
  switchImage: (id: string) => void;
  editingName: string | null;
  tempName: string;
  setTempName: (v: string) => void;
  confirmRename: () => void;
  startRename: (id: string, name: string) => void;
  setEditingName: (v: string | null) => void;
  deleteImage: (id: string) => void;
  categories: Category[];
  activeCategory: string;
  setActiveCategory: (c: string) => void;
  addCategory: (name: string, color: string) => string;
  renameCategory: (id: string, name: string) => void;
  changeCategoryColor: (id: string, color: string) => void;
  deleteCategory: (id: string) => void;
  toggleCategoryHidden: (id: string) => void;
  moveCategory: (id: string, dir: -1 | 1) => void;
  setMode: (m: 'draw' | 'select') => void;
  currentPoints: any[];
  setCurrentPoints: (p: any[]) => void;
  selectedZone: string | null;
  setSelectedZone: (id: string | null) => void;
  deleteZone: (id: string) => void;
  updateZone: (id: string, updates: Partial<Zone>) => void;
  showLabels: boolean;
  setShowLabels: (v: boolean) => void;
  labelToggles: LabelToggles;
  setLabelToggles: (v: LabelToggles) => void;
  labelScale: number;
  setLabelScale: (v: number) => void;
  openExportModal: () => void;
  exportPng: (scale?: number) => Promise<void>;
  exportZones: () => void;
}

const formatArea = (px2: number): string => `${(px2 / 10000).toFixed(2)} м²`;

// Естественное сравнение номеров помещений: "5" < "10", "А-12" < "А-100"
const naturalCompare = (a: string, b: string): number => {
  const an = a.trim();
  const bn = b.trim();
  if (!an && !bn) return 0;
  if (!an) return 1; // без имени — в конец
  if (!bn) return -1;
  try {
    return an.localeCompare(bn, 'ru', { numeric: true, sensitivity: 'base' });
  } catch {
    return an < bn ? -1 : an > bn ? 1 : 0;
  }
};

export const Sidebar: React.FC<SidebarProps> = ({
  images,
  activeImageId,
  activeImage,
  fileInputRef,
  switchImage,
  editingName,
  tempName,
  setTempName,
  confirmRename,
  startRename,
  setEditingName,
  deleteImage,
  categories,
  activeCategory,
  setActiveCategory,
  addCategory,
  renameCategory,
  changeCategoryColor,
  deleteCategory,
  toggleCategoryHidden,
  moveCategory,
  setMode,
  currentPoints,
  setCurrentPoints,
  selectedZone,
  setSelectedZone,
  deleteZone,
  updateZone,
  showLabels,
  setShowLabels,
  labelToggles,
  setLabelToggles,
  labelScale,
  setLabelScale,
  openExportModal,
  exportPng,
  exportZones
}) => {
  // Выпадашка настроек подписей зон
  const [labelSettingsOpen, setLabelSettingsOpen] = useState(false);
  const labelSettingsRef = useRef<HTMLDivElement>(null);
  const allTogglesOn = labelToggles.name && labelToggles.area && labelToggles.category;
  const activeToggleCount = [labelToggles.name, labelToggles.area, labelToggles.category].filter(Boolean).length;

  useEffect(() => {
    if (!labelSettingsOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (labelSettingsRef.current && !labelSettingsRef.current.contains(e.target as Node)) {
        setLabelSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [labelSettingsOpen]);

  // Форма создания категории
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLORS[0]);
  const [showCatForm, setShowCatForm] = useState(false);
  // Категория, цвет которой редактируется inline
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  // Поиск и сортировка списка областей
  const [zoneSearch, setZoneSearch] = useState('');
  const [sortByName, setSortByName] = useState(false);

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return;
    addCategory(newCatName, newCatColor);
    setNewCatName('');
    setNewCatColor(CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length]);
    setShowCatForm(false);
  };

  const rawZones: Zone[] = activeImage?.zones ?? [];
  const query = zoneSearch.trim().toLowerCase();
  let visibleZones = query
    ? rawZones.filter((z) => (z.roomNumber ?? '').toLowerCase().includes(query))
    : rawZones.slice();
  if (sortByName) {
    visibleZones.sort((a, b) => naturalCompare(a.roomNumber ?? '', b.roomNumber ?? ''));
  }

  return (
    <aside>
      {/* Секция: Изображения */}
      <div className="sidebar-section section-images">
        <div className="sidebar-title">
          <span>Изображения ({images.length})</span>
          <button onClick={() => fileInputRef.current?.click()}>+ Добавить</button>
        </div>
        <div className="image-list">
          {images.length === 0 && <div className="empty-state">Нет загруженных изображений</div>}
          {images.map(img => (
            <div
              key={img.id}
              className={`image-item ${activeImageId === img.id ? 'active' : ''}`}
              onClick={() => switchImage(img.id)}
            >
              <div className="image-thumb">
                <img src={img.src} alt="" />
              </div>
              <div className="image-info">
                {editingName === img.id ? (
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={confirmRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmRename();
                      if (e.key === 'Escape') { setEditingName(null); setTempName(''); }
                      e.stopPropagation();
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="image-name">
                    <span>{img.name}</span>
                    <button
                      className="rename-btn"
                      onClick={(e) => { e.stopPropagation(); startRename(img.id, img.name); }}
                    >
                      ✎
                    </button>
                  </div>
                )}
                <div className="image-zones-count">{img.zones.length} обл.</div>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Секция: Категории (создаются пользователем) */}
      <div className="sidebar-section section-categories">
        <div className="sidebar-title">
          <span>Категории ({categories.length})</span>
          <button onClick={() => setShowCatForm(v => !v)}>
            {showCatForm ? 'Отмена' : '+ Создать'}
          </button>
        </div>

        {showCatForm && (
          <div className="category-form">
            <input
              type="text"
              placeholder="Название категории"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateCategory(); }}
              autoFocus
            />
            <div className="color-picker-row">
              {CATEGORY_COLORS.map(c => (
                <button
                  key={c}
                  className={`color-swatch ${newCatColor === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setNewCatColor(c)}
                  title={c}
                />
              ))}
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                title="Свой цвет"
              />
            </div>
            <button className="btn-create-category" onClick={handleCreateCategory} disabled={!newCatName.trim()}>
              Создать категорию
            </button>
          </div>
        )}

        <div className="category-list">
          {categories.map((cat, index) => (
            <div
              key={cat.id}
              className={`category-item ${activeCategory === cat.id ? 'active' : ''} ${cat.hidden ? 'hidden-cat' : ''}`}
              onClick={() => {
                if (cat.hidden) return; // скрытую категорию нельзя выбрать для рисования
                setActiveCategory(cat.id);
                setMode('draw');
                if (currentPoints.length > 0) setCurrentPoints([]);
              }}
            >
              {/* Перемещение по списку: порядок меняется только вручную стрелками */}
              <div className="category-reorder">
                <button
                  className="cat-arrow"
                  title="Выше в списке"
                  disabled={index === 0}
                  onClick={(e) => { e.stopPropagation(); moveCategory(cat.id, -1); }}
                >↑</button>
                <button
                  className="cat-arrow"
                  title="Ниже в списке"
                  disabled={index === categories.length - 1}
                  onClick={(e) => { e.stopPropagation(); moveCategory(cat.id, 1); }}
                >↓</button>
              </div>
              {editingColorId === cat.id ? (
                <input
                  type="color"
                  value={cat.color}
                  onChange={(e) => changeCategoryColor(cat.id, e.target.value)}
                  onBlur={() => setEditingColorId(null)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  className="category-color-input"
                />
              ) : (
                <div
                  className="category-color"
                  style={{ backgroundColor: cat.color }}
                  title="Нажмите, чтобы изменить цвет"
                  onClick={(e) => { e.stopPropagation(); setEditingColorId(cat.id); }}
                ></div>
              )}
              <input
                className="category-name-input"
                value={cat.name}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => renameCategory(cat.id, e.target.value)}
                title="Название категории"
              />
              <div className="category-shortcut">{index + 1 <= 9 ? index + 1 : ''}</div>
              <div className="category-count">
                {activeImage ? activeImage.zones.filter((z: any) => z.category === cat.id).length : 0}
              </div>
              <button
                className={`cat-visibility ${cat.hidden ? 'off' : ''}`}
                title={cat.hidden ? 'Показать категорию' : 'Скрыть категорию'}
                onClick={(e) => { e.stopPropagation(); toggleCategoryHidden(cat.id); }}
              >
                {cat.hidden ? '🚫' : '👁'}
              </button>
              <button
                className="category-delete"
                title="Удалить категорию"
                onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}
              >
                ✕
              </button>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="empty-state">Создайте категорию</div>
          )}
        </div>
      </div>

      {/* Секция: Области (заголовок и тулбар фиксированы, скроллится только список зон) */}
      <div className="sidebar-section section-zones">
        <div className="sidebar-title">
          <span>Области ({rawZones.length})</span>
          <div className="label-settings" ref={labelSettingsRef}>
            <button
              className={`label-settings-btn ${!showLabels || !allTogglesOn ? 'warn' : ''}`}
              onClick={() => setLabelSettingsOpen(v => !v)}
              title="Какие данные показывать в подписях зон на плане"
            >
              🏷️ Подписи {showLabels ? (allTogglesOn ? '' : `(${activeToggleCount})`) : ': выкл'} ▾
            </button>
            {labelSettingsOpen && (
              <div className="label-settings-dropdown">
                <label className="toggle-label" title="Показывать/скрывать все подписи зон на плане (L)">
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                  />
                  <span>Подписи на плане</span>
                </label>
                <div className="label-settings-divider" />
                <div className="label-settings-subtitle">Данные в подписях:</div>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={labelToggles.name}
                    onChange={(e) => setLabelToggles({ ...labelToggles, name: e.target.checked })}
                  />
                  <span>Название (№ помещения)</span>
                </label>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={labelToggles.area}
                    onChange={(e) => setLabelToggles({ ...labelToggles, area: e.target.checked })}
                  />
                  <span>Площадь, м²</span>
                </label>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={labelToggles.category}
                    onChange={(e) => setLabelToggles({ ...labelToggles, category: e.target.checked })}
                  />
                  <span>Категория</span>
                </label>
                <div className="label-settings-hint">Эти же настройки влияют на PNG-экспорт</div>
              </div>
            )}
          </div>
        </div>
        {!activeImage ? (
          <div className="empty-state">Загрузите изображение</div>
        ) : rawZones.length === 0 ? (
          <div className="empty-state">Нет выделенных областей</div>
        ) : (
          <>
            <div className="zone-toolbar">
              <input
                className="zone-search"
                type="text"
                placeholder="🔍 Поиск по имени…"
                value={zoneSearch}
                onChange={(e) => setZoneSearch(e.target.value)}
              />
              {zoneSearch && (
                <button
                  className="zone-search-clear"
                  onClick={() => setZoneSearch('')}
                  title="Очистить поиск"
                >
                  ✕
                </button>
              )}
              <button
                className={`zone-sort-btn ${sortByName ? 'active' : ''}`}
                onClick={() => setSortByName((v) => !v)}
                title={sortByName ? 'Сортировка по имени включена — выключить' : 'Сортировать по имени'}
              >
                {sortByName ? 'А↔1 ↓' : 'А↔1'}
              </button>
            </div>
            {visibleZones.length === 0 ? (
              <div className="empty-state">Ничего не найдено по запросу «{zoneSearch.trim()}»</div>
            ) : (
            <div className="zones-list">
              {visibleZones.map((zone: Zone) => {
            const cat = categories.find(c => c.id === zone.category);
            const pxArea = polygonArea(zone.points);
            return (
              <div
                key={zone.id}
                className={`zone-item ${selectedZone === zone.id ? 'selected' : ''}`}
                onClick={() => { setSelectedZone(zone.id); setMode('select'); }}
                title="Клик — выбрать зону и перенести вид к ней"
              >
                <div className="zone-color" style={{ backgroundColor: cat?.color }}></div>
                <select
                  className="zone-category-select"
                  value={zone.category}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateZone(zone.id, { category: e.target.value })}
                  title="Категория зоны"
                >
                  {cat === undefined && (
                    <option value={zone.category}>Без категории</option>
                  )}
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="zone-fields">
                  <input
                    className="zone-room-input"
                    type="text"
                    placeholder="№ помещения"
                    value={zone.roomNumber}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateZone(zone.id, { roomNumber: e.target.value })}
                    title="Номер помещения (название зоны)"
                  />
                  <div className="zone-area-row" onClick={(e) => e.stopPropagation()}>
                    <input
                      className="zone-area-input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Площадь"
                      value={zone.area ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        updateZone(zone.id, { area: v === '' ? null : Math.max(0, parseFloat(v)) });
                      }}
                      title="Площадь зоны, м²"
                    />
                    <span className="zone-area-unit">м²</span>
                    <span className="zone-auto-area" title="Площадь в пикселях плана (без масштаба)">
                      ≈{formatArea(pxArea)}
                    </span>
                  </div>
                </div>
                <button
                  className="zone-delete"
                  onClick={(e) => { e.stopPropagation(); deleteZone(zone.id); }}
                >
                  ✕
                </button>
              </div>
            );
              })}
            </div>
            )}
          </>
        )}
      </div>

      {/* Секция: Экспорт и подписи (фиксированная, внизу) */}
      <div className="sidebar-section section-export">
        <div className="sidebar-title">
          <span>Экспорт и подписи</span>
        </div>
        <div className="label-scale-row" title="Размер названий (номеров помещений) и площадей на плане и в PNG">
          <span className="label-scale-name">Масштаб подписей</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.05}
            value={labelScale}
            onChange={(e) => setLabelScale(parseFloat(e.target.value))}
          />
          <span className="label-scale-value">×{labelScale.toFixed(2)}</span>
        </div>
        <div className="export-btn-row">
          <button className="btn-success" onClick={openExportModal} disabled={!activeImage || activeImage.zones.length === 0}>
            📤 Экспорт…
          </button>
          <button className="btn-indigo" onClick={() => exportPng()} disabled={!activeImage || activeImage.zones.length === 0} title="PNG в нативном разрешении изображения">
            🖼️ PNG
          </button>
          <button className="btn-secondary" onClick={exportZones} disabled={!activeImage || activeImage.zones.length === 0} title="Экспорт зон в JSON">
            💾 JSON
          </button>
        </div>
      </div>

      {/* Секция: Управление */}
      <div className="instructions">
        <div className="instructions-title">Управление</div>
        <div className="instructions-list">
          <div><kbd>ЛКМ</kbd> — точка / выбрать</div>
          <div><kbd>1-я точка</kbd> — замкнуть</div>
          <div><kbd>ПКМ/Esc</kbd> — отмена</div>
          <div><kbd>Колесо</kbd> — масштаб</div>
          <div><kbd>Space+перетаскивание</kbd> — панорама</div>
          <div><kbd>D/V</kbd> — режим</div>
          <div><kbd>1-9</kbd> — категория</div>
          <div><kbd>L</kbd> — показ названий зон</div>
        </div>
      </div>
    </aside>
  );
};
