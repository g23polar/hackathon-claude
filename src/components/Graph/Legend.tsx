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

export default function Legend() {
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
        {LEGEND_ITEMS.map((item) => (
          <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '12px',
                height: '3px',
                borderRadius: '1px',
                background: CONNECTION_COLORS[item.type],
                borderStyle: item.type === 'ghost' ? 'dashed' : 'solid',
              }}
            />
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: '#a3a3a3',
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
