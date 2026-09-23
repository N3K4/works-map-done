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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl shadow-soft-lg w-full max-w-lg mx-4 max-h-[80vh] overflow-auto" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-2">📦 Сохранение проекта</h2>
          <p className="text-slate-400 text-sm mb-5">Размер: {sizeKB} КБ</p>

          <div className="space-y-2.5 mb-6">
            <button 
              onClick={handleDownload} 
              className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white rounded-xl transition-all duration-200 shadow-soft hover:shadow-soft-lg hover:scale-[1.01] active:scale-[0.99]"
            >
              <span className="text-xl">💾</span>
              <span className="font-medium">Скачать файл (.zoneproj)</span>
            </button>
            <button 
              onClick={handleOpenTab} 
              className="w-full flex items-center gap-3 px-4 py-3 bg-slate-700/60 hover:bg-slate-600/60 text-slate-200 rounded-xl transition-all duration-200 border border-slate-600/30 hover:scale-[1.01] active:scale-[0.99]"
            >
              <span className="text-xl">🔗</span>
              <span className="font-medium">Открыть в новой вкладке</span>
            </button>
            <button 
              onClick={handleCopy} 
              className="w-full flex items-center gap-3 px-4 py-3 bg-slate-700/60 hover:bg-slate-600/60 text-slate-200 rounded-xl transition-all duration-200 border border-slate-600/30 hover:scale-[1.01] active:scale-[0.99]"
            >
              <span className="text-xl">{copied ? '✅' : '📋'}</span>
              <span className="font-medium">{copied ? 'Скопировано!' : 'Копировать в буфер обмена'}</span>
            </button>
          </div>

          <div className="mb-5">
            <button 
              onClick={() => setShowPreview(!showPreview)} 
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors duration-200 flex items-center gap-2"
            >
              <span className="text-xs">{showPreview ? '▼' : '▶'}</span>
              <span>Предпросмотр JSON</span>
            </button>
            {showPreview && (
              <pre className="mt-3 p-4 bg-slate-950/80 border border-slate-700/50 rounded-xl text-xs text-emerald-300/80 max-h-48 overflow-auto font-mono leading-relaxed">
                {projectData.length > 5000 ? projectData.slice(0, 5000) + '\n... (обрезано)' : projectData}
              </pre>
            )}
          </div>

          <button 
            onClick={onClose} 
            className="w-full px-4 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-all duration-200 border border-slate-600/30 hover:scale-[1.01] active:scale-[0.99]"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
