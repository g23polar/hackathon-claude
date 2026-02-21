import { useState, useRef, useEffect } from 'react';
import type { Fragment } from '../../types';
import FragmentCard from './FragmentCard';
import CreateFragmentModal from './CreateFragmentModal';
import AnalyzeButton from './AnalyzeButton';
import LibraryDrawer from './LibraryDrawer';
import ConstellationBg from './ConstellationBg';

interface CanvasProps {
  fragments: Fragment[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onUnselectAll: () => void;
  onAddFragment: (fragment: Fragment) => void;
  onAddMultiple: (fragments: Fragment[]) => void;
  onDeleteFragment: (id: string) => void;
  onAnalyze: () => void;
}

export default function Canvas({
  fragments,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onUnselectAll,
  onAddFragment,
  onAddMultiple,
  onDeleteFragment,
  onAnalyze,
}: CanvasProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [quickText, setQuickText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const quickInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    quickInputRef.current?.focus();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // Extract base64 portion (remove "data:image/jpeg;base64," prefix)
        const base64 = dataUrl.split(',')[1];
        
        onAddFragment({
          id: `frag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          text: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          image: {
            base64,
            mimeType: file.type,
            thumbnail: dataUrl,
          },
        });
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files.length) return;
    
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        
        onAddFragment({
          id: `frag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          text: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          image: {
            base64,
            mimeType: file.type,
            thumbnail: dataUrl,
          },
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickText.trim();
    if (!trimmed) return;
    onAddFragment({
      id: `frag-${Date.now()}`,
      text: trimmed,
    });
    setQuickText('');
    quickInputRef.current?.focus();
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: '#0a0a0a',
      }}
    >
      <ConstellationBg />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
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
              margin: 0,
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
            {fragments.length} fragments · {selectedIds.size} selected
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
            }}
          >
            + Long Fragment
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              color: '#a3a3a3',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
            }}
          >
            📷 Image
          </button>
          <button
            onClick={() => setIsLibraryOpen(true)}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(124, 58, 237, 0.15)',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              borderRadius: '6px',
              color: '#A855F7',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
            }}
          >
            📚 Library
          </button>
          <AnalyzeButton selectedCount={selectedIds.size} onAnalyze={onAnalyze} />
        </div>
      </div>

      <form
        onSubmit={handleQuickAdd}
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          gap: '0.5rem',
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        }}
      >
        <input
          ref={quickInputRef}
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          placeholder="Type a fragment and press Enter — the faster the better..."
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#e5e5e5',
            padding: '0.65rem 1rem',
            borderRadius: '6px',
            fontFamily: "'Georgia', serif",
            fontSize: '0.95rem',
            outline: 'none',
          }}
        />
        {quickText.trim() && (
          <button
            type="submit"
            style={{
              padding: '0.5rem 1.25rem',
              background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Add ↵
          </button>
        )}
      </form>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem',
          position: 'relative',
          zIndex: 1,
          border: isDragging ? '2px dashed rgba(124, 58, 237, 0.5)' : '2px dashed transparent',
          transition: 'border-color 0.2s ease',
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
              onDelete={onDeleteFragment}
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
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No fragments yet.</p>
            <p style={{ fontSize: '0.85rem', color: '#404040' }}>
              Type above and press Enter, or ask the audience for ideas.
            </p>
          </div>
        )}
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '0.5rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          display: 'flex',
          gap: '1.5rem',
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          color: '#333',
        }}
      >
        <span>⌘A select all</span>
        <span>⌘↵ analyze</span>
        <span>ESC back</span>
      </div>

      <CreateFragmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={onAddFragment}
      />

      <LibraryDrawer
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onAddFragment={onAddFragment}
        onAddMultiple={onAddMultiple}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
}
