import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#f1faf2',
          borderLeft: '5px solid var(--forest-green)',
          color: '#1b4d22',
          icon: <CheckCircle size={20} color="var(--forest-green)" />
        };
      case 'warning':
        return {
          backgroundColor: '#fff9e6',
          borderLeft: '5px solid #d4a017',
          color: '#806000',
          icon: <AlertTriangle size={20} color="#d4a017" />
        };
      case 'error':
        return {
          backgroundColor: 'var(--red-crimson-light)',
          borderLeft: '5px solid var(--red-crimson)',
          color: 'var(--red-crimson)',
          icon: <AlertCircle size={20} color="var(--red-crimson)" />
        };
      case 'info':
      default:
        return {
          backgroundColor: '#eef6fc',
          borderLeft: '5px solid #1d72b8',
          color: '#11446e',
          icon: <Info size={20} color="#1d72b8" />
        };
    }
  };

  const currentStyle = getStyle();

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      padding: '16px 20px',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      backgroundColor: currentStyle.backgroundColor,
      color: currentStyle.color,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      maxWidth: '380px',
      zIndex: 1000,
      border: '1px solid rgba(0, 0, 0, 0.05)',
      animation: 'slideIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
    }}>
      {currentStyle.icon}
      <div style={{ flex: 1, fontSize: '0.95rem', fontWeight: 500 }}>
        {message}
      </div>
      <button 
        onClick={onClose} 
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          padding: '2px',
          color: 'inherit',
          opacity: 0.7,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <X size={16} />
      </button>

      {/* Slide in animation style */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(100%) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;
