import { CONNECTION_COLORS } from '../../types';
import type { ConnectionType } from '../../types';

interface TooltipProps {
  info: {
    type: 'node' | 'link';
    data: any;
    position: { x: number; y: number };
  };
}

export default function Tooltip({ info }: TooltipProps) {
  const { type, data, position } = info;

  // Offset tooltip from cursor
  const left = position.x + 16;
  const top = position.y - 8;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        background: 'rgba(20, 20, 20, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        maxWidth: '320px',
        pointerEvents: 'none',
        zIndex: 200,
        backdropFilter: 'blur(8px)',
      }}
    >
      {type === 'node' && (
        <div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              color: data.isGhost ? '#6B7280' : '#3B82F6',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
            }}
          >
            {data.isGhost ? 'Ghost Node' : 'Fragment'}
          </div>
          <p
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: '0.85rem',
              color: '#e5e5e5',
              lineHeight: 1.5,
            }}
          >
            {data.label}
          </p>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              color: '#525252',
              marginTop: '0.25rem',
              display: 'block',
            }}
          >
            {data.connectionCount} connection{data.connectionCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      {type === 'link' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                background: CONNECTION_COLORS[data.type as ConnectionType] || '#6B7280',
              }}
            />
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: CONNECTION_COLORS[data.type as ConnectionType] || '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {data.type}
            </span>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                color: '#525252',
                marginLeft: 'auto',
              }}
            >
              {(data.strength * 100).toFixed(0)}%
            </span>
          </div>
          <p
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: '0.85rem',
              color: '#a3a3a3',
              lineHeight: 1.5,
            }}
          >
            {data.description}
          </p>
        </div>
      )}
    </div>
  );
}
