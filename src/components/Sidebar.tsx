import React, { useState, useRef, useEffect } from 'react';
import { ProjectImage, Zone, Mode } from '../types';
import { CATEGORIES } from '../constants';

interface SidebarProps {
  images: ProjectImage[];
  activeImageId: string | null;
  onSelectImage: (id: string) => void;
  onRenameImage: (id: string, name: string) => void;
  onDeleteImage: (id: string) => void;
  selectedZoneId: string | null;
  onSelectZone: (id: string | null) => void;
  onDeleteZone: () => void;
  mode: Mode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  images, activeImageId, onSelectImage, onRenameImage, onDeleteImage,
  selectedZoneId, onSelectZone, onDeleteZone, mode
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const activeImage = images.find(img => img.id === activeImageId);
  const zones = activeImage?.zones || [];

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startRename = (img: ProjectImage) => {
    setEditingId(img.id);
    setEditValue(img.name);
  };

  const confirmRename = () => {
    if (editingId && editValue.trim()) {
      onRenameImage(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const cancelRename = () => {
    setEditingId(null);
  };

  const categoryCounts = CATEGORIES.map(cat => ({
    ...cat,
    count: zones.filter(z => z.category === cat.id).length
  }));

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden shrink-0">
      {/* Images list */}
      <div className="p-2 border-b border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2 px-1">Изображения</h3>
        <div className="max-h-52 overflow-y-auto space-y-1">
          {images.length === 0 && (
            <p className="text-gray-500 text-xs px-1">Нет изображений</p>
          )}
          {images.map(img => (
            <div
              key={img.id}
              className={`flex items-center gap-2 p-1.5 rounded cursor-pointer group transition-colors ${img.id === activeImageId ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
              onClick={() => onSelectImage(img.id)}
            >
              <div className="w-10 h-10 bg-gray-800 rounded overflow-hidden shrink-0">
                <img src={img.src} alt={img.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                {editingId === img.id ? (
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') confirmRename();
                      if (e.key === 'Escape') cancelRename();
                    }}
                    onBlur={confirmRename}
                    className="w-full bg-gray-800 text-white text-xs px-1 py-0.5 rounded border border-blue-500 outline-none"
                  />
                ) : (
                  <span className="text-xs text-white truncate block">{img.name}</span>
                )}
                <span className="text-xs text-gray-500">{img.zones.length} зон</span>
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={e => { e.stopPropagation(); startRename(img); }} className="p-1 text-gray-400 hover:text-white text-xs">✎</button>
                <button onClick={e => { e.stopPropagation(); onDeleteImage(img.id); }} className="p-1 text-gray-400 hover:text-red-400 text-xs">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="p-2 border-b border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2 px-1">Категории</h3>
        <div className="space-y-1">
          {categoryCounts.map(cat => (
            <div key={cat.id} className="flex items-center gap-2 px-1 py-1">
              <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-xs text-gray-300 flex-1">{cat.name}</span>
              <span className="text-xs text-gray-500">{cat.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Zones list */}
      <div className="p-2 border-b border-gray-700 flex-1 overflow-y-auto">
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2 px-1">
          Области {mode === 'select' && selectedZoneId && (
            <button onClick={onDeleteZone} className="ml-2 text-red-400 hover:text-red-300 normal-case">🗑️ Удалить</button>
          )}
        </h3>
        <div className="space-y-1">
          {zones.length === 0 && (
            <p className="text-gray-500 text-xs px-1">Нет областей</p>
          )}
          {zones.map(zone => {
            const cat = CATEGORIES.find(c => c.id === zone.category);
            return (
              <div
                key={zone.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${zone.id === selectedZoneId ? 'bg-gray-700 ring-1 ring-blue-500' : 'hover:bg-gray-800'}`}
                onClick={() => mode === 'select' && onSelectZone(zone.id)}
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat?.color || '#666' }} />
                <span className="text-xs text-gray-300 truncate flex-1">{zone.label}</span>
                <span className="text-xs text-gray-500">{zone.points.length}т</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="p-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2 px-1">Управление</h3>
        <div className="space-y-0.5 text-xs text-gray-500">
          <div><kbd className="bg-gray-800 px-1 rounded text-gray-400">1-5</kbd> — категория</div>
          <div><kbd className="bg-gray-800 px-1 rounded text-gray-400">D</kbd> — рисование</div>
          <div><kbd className="bg-gray-800 px-1 rounded text-gray-400">V</kbd> — выбор</div>
          <div><kbd className="bg-gray-800 px-1 rounded text-gray-400">Esc</kbd> — отмена</div>
          <div><kbd className="bg-gray-800 px-1 rounded text-gray-400">Del</kbd> — удалить</div>
          <div><kbd className="bg-gray-800 px-1 rounded text-gray-400">Space</kbd> — панорама</div>
        </div>
      </div>
    </aside>
  );
};
