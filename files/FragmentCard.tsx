import { useState } from 'react';
import type { Fragment } from '../../types';

interface FragmentCardProps {
  fragment: Fragment;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function FragmentCard({ fragment, isSelected, onToggleSelect, onDelete }: FragmentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={() => onToggleSelect(fragment.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '1rem 1.25rem',
        background: isSelected ? 'rgba(59, 130, 246, 0.15)' : isHovered ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${isSelected ? '#3B82F6' : isHovered ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#3B82F6',
            boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)',
          }}
        />
      )}

      {/* Delete button — visible on hover */}
      {isHovered && !isSelected && (
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
            transition: 'all 0.15s ease',
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

      <p
        style={{
          fontFamily: "'Georgia', serif",
          fontSize: '0.95rem',
          lineHeight: 1.6,
          color: isSelected ? '#e5e5e5' : '#a3a3a3',
          transition: 'color 0.2s ease',
          margin: 0,
          paddingRight: '1rem',
        }}
      >
        {fragment.text}
      </p>
    </div>
  );
}
