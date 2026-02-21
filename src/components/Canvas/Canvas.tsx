import { useState } from 'react';
import type { Fragment } from '../../types';
import FragmentCard from './FragmentCard';
import CreateFragmentModal from './CreateFragmentModal';
import AnalyzeButton from './AnalyzeButton';

interface CanvasProps {
  fragments: Fragment[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onUnselectAll: () => void;
  onAddFragment: (fragment: Fragment) => void;
  onAnalyze: () => void;
}

export default function Canvas({
  fragments,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onUnselectAll,
  onAddFragment,
  onAnalyze,
}: CanvasProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `
          #0a0a0a
          radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)
        `,
        backgroundSize: '40px 40px',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1
            style={{
              fontFamily: 'monospace',
              fontSize: '1.1rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#e5e5e5',
            }}
          >
            Rhizome
          </h1>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: '#525252',
            }}
          >
            {fragments.length} fragments / {selectedIds.size} selected
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {selectedIds.size < fragments.length ? (
            <button
              onClick={onSelectAll}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#a3a3a3',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
              }}
            >
              Select All
            </button>
          ) : (
            <button
              onClick={onUnselectAll}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#a3a3a3',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
              }}
            >
              Unselect All
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              color: '#a3a3a3',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              transition: 'all 0.2s ease',
            }}
          >
            + Add Fragment
          </button>
          <AnalyzeButton selectedCount={selectedIds.size} onAnalyze={onAnalyze} />
        </div>
      </div>

      {/* Fragment grid */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {fragments.map((fragment) => (
            <FragmentCard
              key={fragment.id}
              fragment={fragment}
              isSelected={selectedIds.has(fragment.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>

        {fragments.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              color: '#525252',
              fontFamily: 'monospace',
            }}
          >
            <p>No fragments yet. Click "+ Add Fragment" to begin.</p>
          </div>
        )}
      </div>

      <CreateFragmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={onAddFragment}
      />
    </div>
  );
}
