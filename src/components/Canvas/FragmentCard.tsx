import { useState } from 'react';
import type { Fragment } from '../../types';

interface FragmentCardProps {
  fragment: Fragment;
  onDelete: (id: string) => void;
}

export default function FragmentCard({ fragment, onDelete }: FragmentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '1rem 1.25rem',
        background: isHovered ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${isHovered ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
        borderRadius: '8px',
        transition: 'all 0.2s ease',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      {isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(fragment.id);
          }}
          style={{
            position: 'absolute',
            top: '0.4rem',
            right: '0.4rem',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            color: '#666',
            cursor: 'pointer',
            fontSize: '12px',
            lineHeight: 1,
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            e.currentTarget.style.color = '#EF4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = '#666';
          }}
        >
          ×
        </button>
      )}

      {fragment.image ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <img
            src={fragment.image.thumbnail}
            alt={fragment.text}
            style={{
              width: '100%',
              maxHeight: '160px',
              objectFit: 'cover',
              borderRadius: '4px',
              transition: 'opacity 0.2s ease',
            }}
          />
          <p
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: '0.85rem',
              color: fragment.text.startsWith('\u2726') ? '#666' : '#d4d4d4',
              fontStyle: fragment.text.startsWith('\u2726') ? 'italic' : 'normal',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {fragment.text}
          </p>
          {fragment.image.reading && isHovered && (
            <div
              style={{
                padding: '0.4rem 0.6rem',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '4px',
                borderLeft: '2px solid rgba(124, 58, 237, 0.4)',
              }}
            >
              <p style={{
                fontFamily: 'monospace',
                fontSize: '0.65rem',
                color: '#737373',
                margin: 0,
                lineHeight: 1.5,
              }}>
                {fragment.image.reading.metaphor}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: '0.95rem',
            lineHeight: 1.6,
            color: '#a3a3a3',
            margin: 0,
            paddingRight: '1rem',
          }}
        >
          {fragment.text}
        </p>
      )}
    </div>
  );
}
