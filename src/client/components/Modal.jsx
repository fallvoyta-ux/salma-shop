import React from 'react';

export default function Modal({ isOpen, title, children, onClose, onConfirm, confirmText = 'Confirmer', cancelText = 'Annuler', isDanger = false }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--dark)' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {children}
        </div>

        <div style={{ padding: '1rem 1.5rem', background: 'var(--surface-alt)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn btn-outline btn-sm" onClick={onClose}>
            {cancelText}
          </button>
          {onConfirm && (
            <button
              className={`btn btn-sm ${isDanger ? 'btn-primary' : 'btn-primary'}`}
              style={isDanger ? { background: 'var(--danger)', borderColor: 'var(--danger)' } : {}}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
