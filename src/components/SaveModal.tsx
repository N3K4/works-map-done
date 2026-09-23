import React, { useCallback, useState, useRef } from 'react';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: string;
  projectName: string;
}

export const SaveModal: React.FC<SaveModalProps> = ({ isOpen, onClose, projectData, projectName }) => {
  const [copied, setCopied] = useState(false);
  const sizeRef = useRef(new Blob([projectData]).size);

  const handleDownload = useCallback(() => {
    const blob = new Blob([projectData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}.zoneproj`;
    a.click();
    URL.revokeObjectURL(url);
  }, [projectData, projectName]);

  const handleOpenTab = useCallback(() => {
    const blob = new Blob([projectData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [projectData]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(projectData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = projectData;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [projectData]);

  if (!isOpen) return null;

  const sizeKB = (sizeRef.current / 1024).toFixed(1);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <span className="text-lg font-bold text-white">📦 Сохранение проекта</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl transition-colors">✕</button>
        </div>

        {/* Контент */}
        <div className="px-6 py-4 flex-1 overflow-y-auto">
          <p className="text-sm text-gray-400 mb-4">Размер: {sizeKB} КБ</p>

          {/* 3 кнопки действий */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <button 
              onClick={handleDownload} 
              className="flex flex-col items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <span className="text-2xl">💾</span>
              <span className="text-sm font-medium text-white">Скачать</span>
              <span className="text-[10px] opacity-80 text-white">.zoneproj файл</span>
            </button>
            <button 
              onClick={handleOpenTab} 
              className="flex flex-col items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <span className="text-2xl">🔗</span>
              <span className="text-sm font-medium text-white">Новая вкладка</span>
              <span className="text-[10px] opacity-80 text-white">Просмотр JSON</span>
            </button>
            <button 
              onClick={handleCopy} 
              className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                copied ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              <span className="text-2xl">{copied ? '✓' : '📋'}</span>
              <span className="text-sm font-medium text-white">{copied ? 'Скопировано!' : 'Копировать'}</span>
              <span className="text-[10px] opacity-80 text-white">{copied ? 'В буфере' : 'Ctrl+V'}</span>
            </button>
          </div>

          {/* Предпросмотр JSON */}
          <details className="mb-2">
            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 mb-2">
              <span className="inline-block transition-transform mr-1">▶</span>
              Предпросмотр JSON
            </summary>
            <textarea 
              readOnly 
              value={projectData.length > 5000 ? projectData.slice(0, 5000) + '\n... (обрезано)' : projectData}
              className="w-full h-48 bg-gray-900 text-gray-300 text-xs font-mono p-3 rounded-lg border border-gray-700 resize-none focus:outline-none focus:border-blue-500"
            />
          </details>
        </div>

        {/* Футер */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
