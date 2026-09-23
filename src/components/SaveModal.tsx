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

  // Открытие в новой вкладке
  const handleOpenInNewTab = useCallback(() => {
    try {
      const blob = new Blob([projectData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 30000);
        
        console.log('✅ Файл открыт в новой вкладке');
        
        setTimeout(() => {
          alert('Файл открыт в новой вкладке.\n\nДля сохранения:\n• Windows/Linux: Ctrl+S\n• Mac: Cmd+S\n\nИли используйте правый клик → "Сохранить как..."');
        }, 500);
      } else {
        throw new Error('Popup заблокирован браузером');
      }
    } catch (err) {
      console.error('❌ Не удалось открыть в новой вкладке:', err);
      alert('Не удалось открыть файл в новой вкладке. Возможно, popup заблокирован браузером.\n\nПопробуйте разрешить всплывающие окна для этого сайта или используйте метод "Копировать в буфер обмена".');
    }
  }, [projectData]);

  // Копирование в буфер обмена
  const handleCopyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(projectData);
      setCopied(true);
      console.log('✅ Содержимое скопировано в буфер обмена');
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
      
      alert('✅ Содержимое проекта скопировано в буфер обмена!\n\nТеперь:\n1. Откройте текстовый редактор (Блокнот, VS Code и т.д.)\n2. Вставьте содержимое (Ctrl+V / Cmd+V)\n3. Сохраните файл с именем: ' + projectName + '.zoneproj');
    } catch (err) {
      console.error('❌ Не удалось скопировать в буфер:', err);
      
      // Fallback для старых браузеров
      try {
        const textarea = document.createElement('textarea');
        textarea.value = projectData;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        setCopied(true);
        
        setTimeout(() => {
          setCopied(false);
        }, 2000);
        
        alert('✅ Содержимое скопировано!\n\nВставьте в текстовый редактор и сохраните как: ' + projectName + '.zoneproj');
      } catch (fallbackErr) {
        console.error('❌ Все методы копирования не сработали:', fallbackErr);
        alert('Не удалось скопировать в буфер. Пожалуйста, скопируйте содержимое вручную из предпросмотра JSON ниже.');
      }
    }
  }, [projectData, projectName]);

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
              onClick={handleOpenInNewTab}
              className="flex flex-col items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <span className="text-2xl">🔗</span>
              <span className="text-sm font-medium text-white">Новая вкладка</span>
              <span className="text-[10px] opacity-80 text-white">Открыть файл</span>
            </button>
            <button 
              onClick={handleCopyToClipboard}
              className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                copied ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              <span className="text-2xl">{copied ? '✓' : '📋'}</span>
              <span className="text-sm font-medium text-white">{copied ? 'Скопировано!' : 'Копировать'}</span>
              <span className="text-[10px] opacity-80 text-white">{copied ? 'В буфере' : 'Ctrl+V'}</span>
            </button>
          </div>

          {/* Инструкция */}
          <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-white mb-2">💡 Как сохранить:</h3>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• <strong>Новая вкладка</strong> — откроется файл, сохраните через Ctrl+S (Cmd+S на Mac)</li>
              <li>• <strong>Копировать</strong> — скопируйте JSON, вставьте в текстовый редактор и сохраните как .zoneproj</li>
            </ul>
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
