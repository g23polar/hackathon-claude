import { useState } from 'react';
import type { Fragment } from '../../types';

interface CreateFragmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (fragment: Fragment) => void;
}

export default function CreateFragmentModal({ isOpen, onClose, onAdd }: CreateFragmentModalProps) {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    onAdd({
      id: `frag-${Date.now()}`,
      text: trimmed,
    });
    setText('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a1a1a',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '1.5rem',
          width: '90%',
          maxWidth: '500px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            color: '#a3a3a3',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          New Fragment
        </h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a fragment..."
          autoFocus
          style={{
            width: '100%',
            minHeight: '120px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '0.75rem',
            color: '#e5e5e5',
            fontFamily: "'Georgia', serif",
            fontSize: '0.95rem',
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: '#a3a3a3',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            style={{
              padding: '0.5rem 1rem',
              background: text.trim() ? '#3B82F6' : 'rgba(59, 130, 246, 0.3)',
              border: 'none',
              borderRadius: '6px',
              color: text.trim() ? '#fff' : 'rgba(255, 255, 255, 0.5)',
              cursor: text.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
            }}
          >
            Add Fragment
          </button>
        </div>
      </div>
    </div>
  );
}
