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
    const fileName = `${projectName}.zoneproj`;
    
    // В sandboxed iframe скачивание через <a download> блокируется
    // Самый надёжный способ - открыть файл в новой вкладке
    try {
      const blob = new Blob([projectData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Открываем в новой вкладке
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        // Успешно открыли
        console.log('File opened in new tab:', fileName);
        
        // Очищаем URL через 30 секунд (даём время на сохранение)
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 30000);
        
        // Показываем инструкцию пользователю
        setTimeout(() => {
          alert(`Файл открыт в новой вкладке.\n\nДля сохранения:\n• Windows/Linux: Ctrl+S\n• Mac: Cmd+S\n\nИли используйте правый клик → "Сохранить как..."`);
        }, 500);
      } else {
        // Браузер заблокировал popup
        throw new Error('Popup blocked');
      }
    } catch (err) {
      console.error('Failed to open in new tab:', err);
      
      // Последний fallback - показываем содержимое в textarea
      try {
        const textarea = document.createElement('textarea');
        textarea.value = projectData;
        textarea.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:80%;height:80%;z-index:10000;background:#1f2937;color:#d1d5db;padding:20px;font-family:monospace;font-size:12px;border:2px solid #4b5563;border-radius:8px;';
        
        const instructions = document.createElement('div');
        instructions.innerHTML = `
          <div style="position:fixed;top:10%;left:50%;transform:translateX(-50%);z-index:10001;background:#1f2937;color:#d1d5db;padding:20px;border-radius:8px;border:2px solid #4b5563;max-width:600px;text-align:center;">
            <h3 style="margin:0 0 10px 0;">Скопируйте содержимое файла</h3>
            <p style="margin:0 0 15px 0;">Нажмите Ctrl+A (Cmd+A на Mac), затем Ctrl+C (Cmd+C) для копирования</p>
            <p style="margin:0 0 15px 0;">Затем вставьте в текстовый редактор и сохраните как <strong>${fileName}</strong></p>
            <button onclick="this.parentElement.remove();document.querySelector('textarea').remove();" style="background:#2563eb;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-size:14px;">Закрыть</button>
          </div>
        `;
        
        document.body.appendChild(textarea);
        document.body.appendChild(instructions);
        
        // Выделяем весь текст
        textarea.select();
      } catch (finalErr) {
        console.error('All download methods failed:', finalErr);
        alert('Не удалось открыть файл. Пожалуйста, используйте кнопку "Копировать в буфер обмена" и сохраните файл вручную.');
      }
    }
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: '#1f2937',
          borderRadius: 12,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          maxWidth: 672,
          width: '100%',
          margin: '0 16px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid #374151'
        }}>
          <span style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>📦 Сохранение проекта</span>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              fontSize: 20,
              cursor: 'pointer',
              padding: 0
            }}
          >
            ✕
          </button>
        </div>

        {/* Контент */}
        <div style={{ padding: '16px 24px', flex: 1, overflowY: 'auto' }}>
          <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 16 }}>Размер: {sizeKB} КБ</p>

          {/* 3 кнопки действий */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 16
          }}>
            <button 
              onClick={handleDownload}
              className="btn-primary"
              style={{
                flexDirection: 'column',
                padding: '12px 16px',
                gap: 8
              }}
            >
              <span style={{ fontSize: 24 }}>💾</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Скачать</span>
              <span style={{ fontSize: 10, opacity: 0.8 }}>.zoneproj файл</span>
            </button>
            <button 
              onClick={handleOpenTab}
              className="btn-indigo"
              style={{
                flexDirection: 'column',
                padding: '12px 16px',
                gap: 8
              }}
            >
              <span style={{ fontSize: 24 }}>🔗</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Новая вкладка</span>
              <span style={{ fontSize: 10, opacity: 0.8 }}>Просмотр JSON</span>
            </button>
            <button 
              onClick={handleCopy}
              className={copied ? 'btn-success' : 'btn-purple'}
              style={{
                flexDirection: 'column',
                padding: '12px 16px',
                gap: 8
              }}
            >
              <span style={{ fontSize: 24 }}>{copied ? '✓' : '📋'}</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{copied ? 'Скопировано!' : 'Копировать'}</span>
              <span style={{ fontSize: 10, opacity: 0.8 }}>{copied ? 'В буфере' : 'Ctrl+V'}</span>
            </button>
          </div>

          {/* Предпросмотр JSON */}
          <details style={{ marginBottom: 8 }}>
            <summary style={{
              cursor: 'pointer',
              fontSize: 14,
              color: '#9ca3af',
              marginBottom: 8,
              userSelect: 'none'
            }}>
              <span style={{ display: 'inline-block', transition: 'transform 0.2s', marginRight: 4 }}>▶</span>
              Предпросмотр JSON
            </summary>
            <textarea 
              readOnly 
              value={projectData.length > 5000 ? projectData.slice(0, 5000) + '\n... (обрезано)' : projectData}
              style={{
                width: '100%',
                height: 192,
                background: '#111827',
                color: '#d1d5db',
                fontSize: 12,
                fontFamily: 'monospace',
                padding: 12,
                borderRadius: 8,
                border: '1px solid #374151',
                resize: 'none',
                outline: 'none'
              }}
            />
          </details>
        </div>

        {/* Футер */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #374151',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button 
            onClick={onClose}
            className="btn-secondary"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
