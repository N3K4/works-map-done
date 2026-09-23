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

  // Скачивание файла
  const handleDownload = useCallback(() => {
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
      
      console.log('✅ Файл скачан:', fileName);
    } catch (err) {
      console.error('❌ Не удалось скачать файл:', err);
      alert('Не удалось скачать файл. Используйте метод "Копировать в буфер обмена".');
    }
  }, [projectData, projectName]);

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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)'
      }} 
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#1f2937',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          maxWidth: '672px',
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
          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>📦 Сохранение проекта</span>
          <button 
            onClick={onClose} 
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Контент */}
        <div style={{ padding: '16px 24px', flex: 1, overflowY: 'auto' }}>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '16px' }}>Размер: {sizeKB} КБ</p>

          {/* 2 кнопки действий */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <button 
              onClick={handleDownload}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px',
                backgroundColor: '#4f46e5',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
            >
              <span style={{ fontSize: '30px' }}>💾</span>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#fff' }}>Скачать файл</span>
              <span style={{ fontSize: '10px', opacity: 0.8, color: '#fff' }}>.zoneproj</span>
            </button>
            <button 
              onClick={handleCopyToClipboard}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px',
                backgroundColor: copied ? '#16a34a' : '#9333ea',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {
                if (!copied) e.currentTarget.style.backgroundColor = '#7e22ce'
              }}
              onMouseOut={(e) => {
                if (!copied) e.currentTarget.style.backgroundColor = '#9333ea'
              }}
            >
              <span style={{ fontSize: '30px' }}>{copied ? '✓' : '📋'}</span>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#fff' }}>{copied ? 'Скопировано!' : 'Копировать'}</span>
              <span style={{ fontSize: '10px', opacity: 0.8, color: '#fff' }}>{copied ? 'В буфере' : 'Ctrl+V'}</span>
            </button>
          </div>

          {/* Инструкция */}
          <div style={{
            backgroundColor: 'rgba(55, 65, 81, 0.5)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>💡 Как сохранить:</h3>
            <ul style={{ fontSize: '12px', color: '#d1d5db', listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '4px' }}>• <strong>Скачать файл</strong> — сохранит .zoneproj файл на ваш компьютер</li>
              <li>• <strong>Копировать</strong> — скопируйте JSON, вставьте в текстовый редактор и сохраните как .zoneproj</li>
            </ul>
          </div>

          {/* Предпросмотр JSON */}
          <details style={{ marginBottom: '8px' }}>
            <summary style={{
              cursor: 'pointer',
              fontSize: '14px',
              color: '#9ca3af',
              marginBottom: '8px',
              userSelect: 'none'
            }}>
              <span style={{ display: 'inline-block', transition: 'transform 0.2s', marginRight: '4px' }}>▶</span>
              Предпросмотр JSON
            </summary>
            <textarea 
              readOnly 
              value={projectData.length > 5000 ? projectData.slice(0, 5000) + '\n... (обрезано)' : projectData}
              style={{
                width: '100%',
                height: '192px',
                backgroundColor: '#111827',
                color: '#d1d5db',
                fontSize: '12px',
                fontFamily: 'monospace',
                padding: '12px',
                borderRadius: '8px',
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
            style={{
              padding: '8px 16px',
              backgroundColor: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#fff',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#374151'}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
