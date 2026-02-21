import { CONNECTION_COLORS } from '../../types';
import type { ConnectionType } from '../../types';

const LEGEND_ITEMS: { type: ConnectionType; label: string }[] = [
  { type: 'resonance', label: 'Resonance' },
  { type: 'tension', label: 'Tension' },
  { type: 'genealogy', label: 'Genealogy' },
  { type: 'metaphor', label: 'Metaphor' },
  { type: 'bridge', label: 'Bridge' },
  { type: 'ghost', label: 'Ghost' },
];

interface LegendProps {
  activeTypes: Set<ConnectionType>;
  onToggleType: (type: ConnectionType) => void;
}

export default function Legend({ activeTypes, onToggleType }: LegendProps) {
  const hasFilter = activeTypes.size > 0;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '1.5rem',
        left: '1.5rem',
        background: 'rgba(15, 15, 15, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          color: '#525252',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '0.5rem',
        }}
      >
        Connection Types
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {LEGEND_ITEMS.map((item) => {
          const isActive = activeTypes.has(item.type);
          const isDimmed = hasFilter && !isActive;

          return (
            <div
              key={item.type}
              onClick={() => onToggleType(item.type)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '4px',
                background: isActive ? `${CONNECTION_COLORS[item.type]}18` : 'transparent',
                opacity: isDimmed ? 0.35 : 1,
                transition: 'opacity 0.2s, background 0.2s',
              }}
            >
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: item.type === 'ghost' ? '50%' : '3px',
                  backgroundColor: CONNECTION_COLORS[item.type],
                  opacity: item.type === 'ghost' ? 0.5 : 1,
                  border: item.type === 'ghost' ? `2px dashed ${CONNECTION_COLORS[item.type]}` : 'none',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: CONNECTION_COLORS[item.type],
                  userSelect: 'none',
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
