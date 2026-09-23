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
