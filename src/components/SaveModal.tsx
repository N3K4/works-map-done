import React, { useCallback, useState, useRef } from 'react';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: string;
  projectName: string;
}

export const SaveModal: React.FC<SaveModalProps> = ({ isOpen, onClose, projectData, projectName }) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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
      // fallback
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-2">📦 Сохранение проекта</h2>
          <p className="text-gray-400 text-sm mb-4">Размер: {sizeKB} КБ</p>

          <div className="space-y-3 mb-6">
            <button onClick={handleDownload} className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <span className="text-xl">💾</span>
              <span>Скачать файл (.zoneproj)</span>
            </button>
            <button onClick={handleOpenTab} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
              <span className="text-xl">🔗</span>
              <span>Открыть в новой вкладке</span>
            </button>
            <button onClick={handleCopy} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
              <span className="text-xl">{copied ? '✅' : '📋'}</span>
              <span>{copied ? 'Скопировано!' : 'Копировать в буфер обмена'}</span>
            </button>
          </div>

          <div className="mb-4">
            <button onClick={() => setShowPreview(!showPreview)} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              <span>{showPreview ? '▼' : '▶'}</span>
              <span>Предпросмотр JSON</span>
            </button>
            {showPreview && (
              <pre className="mt-2 p-3 bg-gray-950 border border-gray-700 rounded-lg text-xs text-green-400 max-h-48 overflow-auto font-mono">
                {projectData.length > 5000 ? projectData.slice(0, 5000) + '\n... (обрезано)' : projectData}
              </pre>
            )}
          </div>

          <button onClick={onClose} className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
