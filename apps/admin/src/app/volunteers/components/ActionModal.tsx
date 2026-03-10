'use client';

import { useState } from 'react';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  description: string;
  confirmText: string;
  type: 'SAFE' | 'CRITICAL' | 'WARNING';
  placeholder?: string;
  required?: boolean;
}

export function ActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  type,
  placeholder = 'Provide a reason...',
  required = true,
}: ActionModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (required && !reason.trim()) {
      alert('A reason is required.');
      return;
    }
    onConfirm(reason);
    setReason('');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content card shadow-lg">
        <header className="modal-header">
          <h2 className="card-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </header>
        <div className="modal-body">
          <p className="muted mb-4">{description}</p>
          <textarea
            className="field"
            style={{ minHeight: '120px', resize: 'vertical' }}
            placeholder={placeholder}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <footer className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn btn-neutral" onClick={onClose}>Cancel</button>
          <button 
            className={`btn ${type === 'CRITICAL' ? 'btn-critical' : type === 'WARNING' ? 'btn-warning' : 'btn-safe'}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </footer>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(13, 79, 79, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .modal-content {
          width: 100%;
          max-width: 500px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .modal-close {
          background: transparent;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--wira-earth);
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        .modal-close:hover {
          opacity: 1;
        }
        .mb-4 {
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}
