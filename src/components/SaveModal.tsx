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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/30 rounded-3xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-auto" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-7">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📦</span>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Сохранение проекта</h2>
              <p className="text-slate-400 text-xs mt-0.5">Выберите способ сохранения</p>
            </div>
          </div>
          
          <div className="bg-slate-700/30 rounded-2xl px-4 py-2.5 mb-6 flex items-center gap-2 border border-slate-600/20">
            <span className="text-sm">📊</span>
            <span className="text-sm text-slate-300">Размер проекта:</span>
            <span className="text-sm font-bold text-sky-400">{sizeKB} КБ</span>
          </div>

          <div className="space-y-3 mb-7">
            <button 
              onClick={handleDownload} 
              className="group w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">💾</span>
              <div className="text-left">
                <div className="font-semibold">Скачать файл</div>
                <div className="text-xs text-sky-200/70">.zoneproj формат</div>
              </div>
            </button>
            <button 
              onClick={handleOpenTab} 
              className="group w-full flex items-center gap-4 px-5 py-4 bg-slate-700/40 hover:bg-slate-600/40 text-slate-200 rounded-2xl transition-all duration-300 border border-slate-600/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">🔗</span>
              <div className="text-left">
                <div className="font-semibold">Открыть в новой вкладке</div>
                <div className="text-xs text-slate-400">Просмотр JSON</div>
              </div>
            </button>
            <button 
              onClick={handleCopy} 
              className="group w-full flex items-center gap-4 px-5 py-4 bg-slate-700/40 hover:bg-slate-600/40 text-slate-200 rounded-2xl transition-all duration-300 border border-slate-600/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{copied ? '✅' : '📋'}</span>
              <div className="text-left">
                <div className="font-semibold">{copied ? 'Скопировано!' : 'Копировать в буфер'}</div>
                <div className="text-xs text-slate-400">{copied ? 'Данные в буфере обмена' : 'Ctrl+V для вставки'}</div>
              </div>
            </button>
          </div>

          <div className="mb-6">
            <button 
              onClick={() => setShowPreview(!showPreview)} 
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors duration-200 flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-700/30"
            >
              <span className="text-xs transition-transform duration-200" style={{ transform: showPreview ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
              <span className="font-medium">Предпросмотр JSON</span>
            </button>
            {showPreview && (
              <pre className="mt-3 p-4 bg-slate-950/80 border border-slate-700/40 rounded-2xl text-xs text-emerald-300/80 max-h-52 overflow-auto font-mono leading-relaxed shadow-inner">
                {projectData.length > 5000 ? projectData.slice(0, 5000) + '\n... (обрезано)' : projectData}
              </pre>
            )}
          </div>

          <button 
            onClick={onClose} 
            className="w-full px-5 py-3 bg-slate-700/40 hover:bg-slate-600/40 text-slate-300 rounded-2xl transition-all duration-300 border border-slate-600/30 font-semibold hover:scale-[1.01] active:scale-[0.99]"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
