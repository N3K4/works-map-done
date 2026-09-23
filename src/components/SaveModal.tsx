import React, { useCallback, useState, useRef } from 'react';
import { saveAs } from 'file-saver';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: string;
  projectName: string;
}

export const SaveModal: React.FC<SaveModalProps> = ({ isOpen, onClose, projectData, projectName }) => {
  const [copied, setCopied] = useState(false);
  const [lastMethod, setLastMethod] = useState<string>('');
  const sizeRef = useRef(new Blob([projectData]).size);

  // Метод 1: Blob URL + <a download>
  const handleBlobDownload = useCallback(() => {
    const fileName = `${projectName}.zoneproj`;
    
    try {
      const blob = new Blob([projectData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 5000);
      
      setLastMethod('Blob URL (стандартный метод)');
      console.log('✅ Метод 1: Blob URL + <a download> - успешно');
    } catch (err) {
      console.error('❌ Метод 1 не сработал:', err);
      alert('Метод 1 (Blob URL) не сработал. Попробуйте другой метод.');
    }
  }, [projectData, projectName]);

  // Метод 2: Data URL (base64)
  const handleDataUrlDownload = useCallback(() => {
    const fileName = `${projectName}.zoneproj`;
    
    try {
      const base64 = btoa(unescape(encodeURIComponent(projectData)));
      const dataUrl = `data:application/json;base64,${base64}`;
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
      }, 5000);
      
      setLastMethod('Data URL (base64)');
      console.log('✅ Метод 2: Data URL (base64) - успешно');
    } catch (err) {
      console.error('❌ Метод 2 не сработал:', err);
      alert('Метод 2 (Data URL) не сработал. Попробуйте другой метод.');
    }
  }, [projectData, projectName]);

  // Метод 3: FileSaver.js
  const handleFileSaverDownload = useCallback(() => {
    const fileName = `${projectName}.zoneproj`;
    
    try {
      const blob = new Blob([projectData], { type: 'application/json;charset=utf-8' });
      saveAs(blob, fileName);
      
      setLastMethod('FileSaver.js (библиотека)');
      console.log('✅ Метод 3: FileSaver.js - успешно');
    } catch (err) {
      console.error('❌ Метод 3 не сработал:', err);
      alert('Метод 3 (FileSaver.js) не сработал. Попробуйте другой метод.');
    }
  }, [projectData, projectName]);

  // Метод 4: Открытие в новой вкладке
  const handleOpenInNewTab = useCallback(() => {
    try {
      const blob = new Blob([projectData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 30000);
        
        setLastMethod('Открытие в новой вкладке');
        console.log('✅ Метод 4: Открытие в новой вкладке - успешно');
        
        setTimeout(() => {
          alert('Файл открыт в новой вкладке.\n\nДля сохранения:\n• Windows/Linux: Ctrl+S\n• Mac: Cmd+S\n\nИли используйте правый клик → "Сохранить как..."');
        }, 500);
      } else {
        throw new Error('Popup заблокирован браузером');
      }
    } catch (err) {
      console.error('❌ Метод 4 не сработал:', err);
      alert('Метод 4 (новая вкладка) не сработал. Возможно, popup заблокирован. Попробуйте другой метод.');
    }
  }, [projectData]);

  // Метод 5: Копирование в буфер обмена
  const handleCopyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(projectData);
      setCopied(true);
      setLastMethod('Копирование в буфер обмена');
      console.log('✅ Метод 5: Копирование в буфер - успешно');
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
      
      alert('✅ Содержимое проекта скопировано в буфер обмена!\n\nТеперь:\n1. Откройте текстовый редактор (Блокнот, VS Code и т.д.)\n2. Вставьте содержимое (Ctrl+V / Cmd+V)\n3. Сохраните файл с именем: ' + projectName + '.zoneproj');
    } catch (err) {
      console.error('❌ Метод 5 не сработал:', err);
      
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
        setLastMethod('Копирование в буфер (fallback)');
        
        setTimeout(() => {
          setCopied(false);
        }, 2000);
        
        alert('✅ Содержимое скопировано (fallback метод)!\n\nВставьте в текстовый редактор и сохраните как: ' + projectName + '.zoneproj');
      } catch (fallbackErr) {
        console.error('❌ Все методы копирования не сработали:', fallbackErr);
        alert('Не удалось скопировать в буфер. Пожалуйста, скопируйте содержимое вручную из предпросмотра JSON ниже.');
      }
    }
  }, [projectData, projectName]);

  // Метод 6: Download через window.open с data URL
  const handleWindowOpenDataUrl = useCallback(() => {
    const fileName = `${projectName}.zoneproj`;
    
    try {
      const base64 = btoa(unescape(encodeURIComponent(projectData)));
      const dataUrl = `data:application/json;base64,${base64}`;
      
      // Открываем data URL в новом окне
      const newWindow = window.open(dataUrl, '_blank');
      
      if (newWindow) {
        setLastMethod('window.open с data URL');
        console.log('✅ Метод 6: window.open с data URL - успешно');
        
        setTimeout(() => {
          alert('Файл открыт в новой вкладке.\n\nДля сохранения:\n• Windows/Linux: Ctrl+S\n• Mac: Cmd+S\n\nИли используйте правый клик → "Сохранить как..."');
        }, 500);
      } else {
        throw new Error('Popup заблокирован');
      }
    } catch (err) {
      console.error('❌ Метод 6 не сработал:', err);
      alert('Метод 6 (window.open с data URL) не сработал. Попробуйте другой метод.');
    }
  }, [projectData, projectName]);

  // Метод 7: Download через скрытый iframe
  const handleIframeDownload = useCallback(() => {
    const fileName = `${projectName}.zoneproj`;
    
    try {
      const blob = new Blob([projectData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Создаём скрытый iframe
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      
      document.body.appendChild(iframe);
      
      // Через секунду пытаемся скачать через ссылку внутри iframe
      setTimeout(() => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            const link = iframeDoc.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
          }
        } catch (e) {
          console.warn('Не удалось получить доступ к iframe:', e);
        }
        
        // Очищаем через 5 секунд
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 5000);
      }, 1000);
      
      setLastMethod('Скрытый iframe');
      console.log('✅ Метод 7: Скрытый iframe - запущен');
    } catch (err) {
      console.error('❌ Метод 7 не сработал:', err);
      alert('Метод 7 (iframe) не сработал. Попробуйте другой метод.');
    }
  }, [projectData, projectName]);

  // Метод 8: Download через form submission
  const handleFormDownload = useCallback(() => {
    const fileName = `${projectName}.zoneproj`;
    
    try {
      // Создаём форму
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `data:application/json;charset=utf-8,${encodeURIComponent(projectData)}`;
      form.target = '_blank';
      
      // Добавляем скрытое поле
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'download';
      input.value = fileName;
      form.appendChild(input);
      
      document.body.appendChild(form);
      form.submit();
      
      setTimeout(() => {
        document.body.removeChild(form);
      }, 1000);
      
      setLastMethod('Form submission');
      console.log('✅ Метод 8: Form submission - успешно');
    } catch (err) {
      console.error('❌ Метод 8 не сработал:', err);
      alert('Метод 8 (form submission) не сработал. Попробуйте другой метод.');
    }
  }, [projectData, projectName]);

  // Метод 9: Download через window.location
  const handleWindowLocationDownload = useCallback(() => {
    const fileName = `${projectName}.zoneproj`;
    
    try {
      const blob = new Blob([projectData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Сохраняем текущую позицию для возврата
      const currentUrl = window.location.href;
      
      // Меняем location
      window.location.href = url;
      
      // Через 2 секунды возвращаемся назад
      setTimeout(() => {
        window.location.href = currentUrl;
        URL.revokeObjectURL(url);
      }, 2000);
      
      setLastMethod('window.location.href');
      console.log('✅ Метод 9: window.location.href - запущен');
    } catch (err) {
      console.error('❌ Метод 9 не сработал:', err);
      alert('Метод 9 (window.location) не сработал. Попробуйте другой метод.');
    }
  }, [projectData, projectName]);

  // Метод 10: Download через msSaveBlob (для старых Edge/IE)
  const handleMsSaveBlob = useCallback(() => {
    const fileName = `${projectName}.zoneproj`;
    
    try {
      const blob = new Blob([projectData], { type: 'application/json' });
      
      // Проверяем поддержку msSaveBlob
      if ((navigator as any).msSaveBlob) {
        (navigator as any).msSaveBlob(blob, fileName);
        setLastMethod('msSaveBlob (IE/Edge)');
        console.log('✅ Метод 10: msSaveBlob - успешно');
      } else {
        throw new Error('msSaveBlob не поддерживается');
      }
    } catch (err) {
      console.error('❌ Метод 10 не сработал:', err);
      alert('Метод 10 (msSaveBlob) не поддерживается в этом браузере. Попробуйте другой метод.');
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
        className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <span className="text-lg font-bold text-white">📦 Сохранение проекта</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl transition-colors">✕</button>
        </div>

        {/* Контент */}
        <div className="px-6 py-4 flex-1 overflow-y-auto">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-400">Размер: {sizeKB} КБ</p>
            {lastMethod && (
              <p className="text-xs text-green-400">Последний метод: {lastMethod}</p>
            )}
          </div>

          {/* 10 кнопок разных методов */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
            {/* Метод 1: Blob URL */}
            <button 
              onClick={handleBlobDownload}
              className="flex flex-col items-center gap-2 px-4 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <span className="text-3xl">💾</span>
              <span className="text-sm font-medium text-white">Метод 1: Blob URL</span>
              <span className="text-[10px] opacity-80 text-white text-center">Стандартный метод<br/>через &lt;a download&gt;</span>
            </button>

            {/* Метод 2: Data URL */}
            <button 
              onClick={handleDataUrlDownload}
              className="flex flex-col items-center gap-2 px-4 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <span className="text-3xl">🔗</span>
              <span className="text-sm font-medium text-white">Метод 2: Data URL</span>
              <span className="text-[10px] opacity-80 text-white text-center">Base64 кодирование<br/>для sandboxed iframe</span>
            </button>

            {/* Метод 3: FileSaver.js */}
            <button 
              onClick={handleFileSaverDownload}
              className="flex flex-col items-center gap-2 px-4 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <span className="text-3xl">📥</span>
              <span className="text-sm font-medium text-white">Метод 3: FileSaver.js</span>
              <span className="text-[10px] opacity-80 text-white text-center">Библиотека<br/>для надёжного скачивания</span>
            </button>

            {/* Метод 4: Новая вкладка */}
            <button 
              onClick={handleOpenInNewTab}
              className="flex flex-col items-center gap-2 px-4 py-4 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
            >
              <span className="text-3xl">🌐</span>
              <span className="text-sm font-medium text-white">Метод 4: Новая вкладка</span>
              <span className="text-[10px] opacity-80 text-white text-center">Открыть файл<br/>и сохранить через Ctrl+S</span>
            </button>

            {/* Метод 5: Буфер обмена */}
            <button 
              onClick={handleCopyToClipboard}
              className={`flex flex-col items-center gap-2 px-4 py-4 rounded-lg transition-colors ${
                copied ? 'bg-green-600' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <span className="text-3xl">{copied ? '✓' : '📋'}</span>
              <span className="text-sm font-medium text-white">
                {copied ? 'Скопировано!' : 'Метод 5: Буфер обмена'}
              </span>
              <span className="text-[10px] opacity-80 text-white text-center">
                {copied ? 'В буфере обмена' : 'Копировать JSON<br/>и сохранить вручную'}
              </span>
            </button>

            {/* Метод 6: window.open с data URL */}
            <button 
              onClick={handleWindowOpenDataUrl}
              className="flex flex-col items-center gap-2 px-4 py-4 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
            >
              <span className="text-3xl">🪟</span>
              <span className="text-sm font-medium text-white">Метод 6: window.open</span>
              <span className="text-[10px] opacity-80 text-white text-center">Открыть data URL<br/>в новом окне</span>
            </button>

            {/* Метод 7: Скрытый iframe */}
            <button 
              onClick={handleIframeDownload}
              className="flex flex-col items-center gap-2 px-4 py-4 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
            >
              <span className="text-3xl">🖼️</span>
              <span className="text-sm font-medium text-white">Метод 7: Iframe</span>
              <span className="text-[10px] opacity-80 text-white text-center">Скрытый iframe<br/>для обхода ограничений</span>
            </button>

            {/* Метод 8: Form submission */}
            <button 
              onClick={handleFormDownload}
              className="flex flex-col items-center gap-2 px-4 py-4 bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors"
            >
              <span className="text-3xl">📝</span>
              <span className="text-sm font-medium text-white">Метод 8: Form</span>
              <span className="text-[10px] opacity-80 text-white text-center">Через форму<br/>POST запрос</span>
            </button>

            {/* Метод 9: window.location */}
            <button 
              onClick={handleWindowLocationDownload}
              className="flex flex-col items-center gap-2 px-4 py-4 bg-lime-600 hover:bg-lime-700 rounded-lg transition-colors"
            >
              <span className="text-3xl">📍</span>
              <span className="text-sm font-medium text-white">Метод 9: Location</span>
              <span className="text-[10px] opacity-80 text-white text-center">Через window.location<br/>с автовозвратом</span>
            </button>

            {/* Метод 10: msSaveBlob */}
            <button 
              onClick={handleMsSaveBlob}
              className="flex flex-col items-center gap-2 px-4 py-4 bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
            >
              <span className="text-3xl">🔷</span>
              <span className="text-sm font-medium text-white">Метод 10: msSaveBlob</span>
              <span className="text-[10px] opacity-80 text-white text-center">Для старых<br/>IE/Edge браузеров</span>
            </button>
          </div>

          {/* Инструкция */}
          <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-white mb-2">💡 Рекомендации:</h3>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• <strong>Метод 1-3</strong> — стандартные методы скачивания (пробуйте по порядку)</li>
              <li>• <strong>Метод 4-6</strong> — открытие в новой вкладке/окне (сохраните через Ctrl+S)</li>
              <li>• <strong>Метод 7</strong> — обход ограничений через скрытый iframe</li>
              <li>• <strong>Метод 8-9</strong> — альтернативные способы через form/location</li>
              <li>• <strong>Метод 10</strong> — только для старых IE/Edge браузеров</li>
              <li>• <strong>Метод 5</strong> — крайний случай (копирование вручную)</li>
              <li className="text-yellow-300 mt-2">⚠️ Если все методы не работают, используйте Метод 5 (копирование)</li>
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
