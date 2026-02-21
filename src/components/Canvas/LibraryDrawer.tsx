import { useState } from 'react';
import type { Fragment } from '../../types';
import {
  FRAGMENT_LIBRARY,
  getRandomFragments,
  getRandomDiverse,
  getRandomFromCategory,
} from '../../data/fragment-library';

interface LibraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFragment: (fragment: Fragment) => void;
  onAddMultiple: (fragments: Fragment[]) => void;
}

export default function LibraryDrawer({
  isOpen,
  onClose,
  onAddFragment,
  onAddMultiple,
}: LibraryDrawerProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const flashAdded = (text: string) => {
    setJustAdded((prev) => new Set(prev).add(text));
    setTimeout(() => {
      setJustAdded((prev) => {
        const next = new Set(prev);
        next.delete(text);
        return next;
      });
    }, 800);
  };

  const handleAddOne = (text: string) => {
    onAddFragment({ id: `frag-${Date.now()}`, text });
    flashAdded(text);
  };

  const handleSurpriseMe = () => {
    const picks = getRandomDiverse(5);
    onAddMultiple(picks);
    picks.forEach((p) => flashAdded(p.text));
  };

  const handleRandomFromCategory = (catName: string) => {
    const picks = getRandomFromCategory(catName, 3);
    onAddMultiple(picks);
    picks.forEach((p) => flashAdded(p.text));
  };

  const handleRandomMix = () => {
    const picks = getRandomFragments(8);
    onAddMultiple(picks);
    picks.forEach((p) => flashAdded(p.text));
  };

  const activeCat = FRAGMENT_LIBRARY.find((c) => c.name === activeCategory);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 100,
        }}
      />

      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '420px',
          background: '#111',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.2s ease',
        }}
      >
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#e5e5e5',
                margin: 0,
              }}
            >
              Fragment Library
            </h2>
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                color: '#525252',
                margin: '0.25rem 0 0 0',
              }}
            >
              {FRAGMENT_LIBRARY.reduce((n, c) => n + c.fragments.length, 0)} fragments across{' '}
              {FRAGMENT_LIBRARY.length} categories
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: '0.25rem',
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            gap: '0.5rem',
          }}
        >
          <button
            onClick={handleSurpriseMe}
            style={{
              flex: 1,
              padding: '0.6rem',
              background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            🎲 Surprise Me (5)
          </button>
          <button
            onClick={handleRandomMix}
            style={{
              flex: 1,
              padding: '0.6rem',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              color: '#a3a3a3',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
            }}
          >
            🌀 Random Mix (8)
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {!activeCat ? (
            <div
              style={{
                padding: '1rem 1.25rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
              }}
            >
              {FRAGMENT_LIBRARY.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                >
                  <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>
                    {cat.emoji}
                  </div>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      color: '#e5e5e5',
                      fontWeight: 600,
                    }}
                  >
                    {cat.name}
                  </div>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.65rem',
                      color: '#525252',
                      marginTop: '0.15rem',
                    }}
                  >
                    {cat.fragments.length} fragments
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <div
                style={{
                  padding: '0.75rem 1.25rem',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <button
                  onClick={() => setActiveCategory(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#737373',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    padding: 0,
                  }}
                >
                  ← Back
                </button>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    color: '#e5e5e5',
                  }}
                >
                  {activeCat.emoji} {activeCat.name}
                </span>
                <button
                  onClick={() => handleRandomFromCategory(activeCat.name)}
                  style={{
                    padding: '0.3rem 0.6rem',
                    background: 'rgba(124, 58, 237, 0.2)',
                    border: '1px solid rgba(124, 58, 237, 0.3)',
                    borderRadius: '4px',
                    color: '#A855F7',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                  }}
                >
                  + Random 3
                </button>
              </div>

              <div style={{ padding: '0.5rem 1.25rem' }}>
                {activeCat.fragments.map((text) => {
                  const wasAdded = justAdded.has(text);
                  return (
                    <div
                      key={text}
                      onClick={() => handleAddOne(text)}
                      style={{
                        padding: '0.6rem 0.75rem',
                        marginBottom: '0.35rem',
                        background: wasAdded
                          ? 'rgba(74, 222, 128, 0.1)'
                          : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${
                          wasAdded
                            ? 'rgba(74, 222, 128, 0.3)'
                            : 'rgba(255,255,255,0.06)'
                        }`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!wasAdded) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!wasAdded) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                        }
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: '0.85rem',
                          color: wasAdded ? '#4ADE80' : '#a3a3a3',
                          lineHeight: 1.5,
                          margin: 0,
                        }}
                      >
                        {wasAdded ? '✓ ' : ''}
                        {text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
