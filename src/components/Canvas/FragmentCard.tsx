import type { Fragment } from '../../types';

interface FragmentCardProps {
  fragment: Fragment;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

export default function FragmentCard({ fragment, isSelected, onToggleSelect }: FragmentCardProps) {
  return (
    <div
      onClick={() => onToggleSelect(fragment.id)}
      style={{
        padding: '1rem 1.25rem',
        background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${isSelected ? '#3B82F6' : 'rgba(255, 255, 255, 0.1)'}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        userSelect: 'none',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        }
      }}
    >
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
          }}
        />
      )}
      <p
        style={{
          fontFamily: "'Georgia', serif",
          fontSize: '0.95rem',
          lineHeight: 1.6,
          color: isSelected ? '#e5e5e5' : '#a3a3a3',
          transition: 'color 0.2s ease',
        }}
      >
        {fragment.text}
      </p>
    </div>
  );
}
