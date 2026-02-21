import { useState } from 'react';
import type { SecondaryAnalysis, Fragment } from '../../types';

interface SidePanelProps {
  secondaryAnalysis: SecondaryAnalysis | null;
  loading: boolean;
  fragments: Fragment[];
}

function SkeletonBlock({ width, height }: { width: string; height: string }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: '4px',
        background: 'rgba(255, 255, 255, 0.05)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  );
}

function FragmentPill({ fragment }: { fragment: Fragment }) {
  const preview = fragment.text.split(' ').slice(0, 5).join(' ') + '...';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '10px',
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        fontFamily: 'monospace',
        fontSize: '0.65rem',
        color: '#a3a3a3',
        maxWidth: '180px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      title={fragment.text}
    >
      {preview}
    </span>
  );
}

export default function SidePanel({ secondaryAnalysis, loading, fragments }: SidePanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const fragmentMap = new Map(fragments.map((f) => [f.id, f]));

  if (!loading && !secondaryAnalysis) return null;

  return (
    <>
      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          top: '3.5rem',
          left: '1.5rem',
          bottom: '14rem',
          width: collapsed ? '28px' : '320px',
          transition: 'width 0.3s ease',
          zIndex: 10,
          display: 'flex',
        }}
      >
        {/* Main panel content */}
        {!collapsed && (
          <div
            style={{
              flex: 1,
              background: 'rgba(15, 15, 15, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              backdropFilter: 'blur(12px)',
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '1rem',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            {/* Header */}
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                color: '#737373',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginBottom: '0.75rem',
                fontVariant: 'small-caps',
              }}
            >
              Professor Alan's Reading
            </div>

            {loading && !secondaryAnalysis && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <SkeletonBlock width="100%" height="48px" />
                <SkeletonBlock width="80%" height="12px" />
                <SkeletonBlock width="100%" height="1px" />
                <SkeletonBlock width="60%" height="14px" />
                <SkeletonBlock width="100%" height="36px" />
                <SkeletonBlock width="50%" height="14px" />
                <SkeletonBlock width="100%" height="36px" />
                <SkeletonBlock width="100%" height="1px" />
                <SkeletonBlock width="70%" height="14px" />
                <SkeletonBlock width="100%" height="36px" />
              </div>
            )}

            {secondaryAnalysis && (
              <div style={{ animation: 'fadeIn 0.5s ease' }}>
                {/* Synthesis */}
                <p
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: '0.82rem',
                    fontStyle: 'italic',
                    color: '#d4d4d4',
                    lineHeight: 1.7,
                    margin: '0 0 0.75rem 0',
                  }}
                >
                  {secondaryAnalysis.synthesis}
                </p>

                {/* Divider */}
                <div
                  style={{
                    height: '1px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    margin: '0.75rem 0',
                  }}
                />

                {/* Thematic Clusters */}
                {secondaryAnalysis.clusters.length > 0 && (
                  <>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.65rem',
                        color: '#525252',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Thematic Clusters
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {secondaryAnalysis.clusters.map((cluster) => (
                        <div key={cluster.id}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              marginBottom: '0.25rem',
                            }}
                          >
                            <div
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: cluster.color,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '0.75rem',
                                color: cluster.color,
                                fontWeight: 600,
                              }}
                            >
                              {cluster.name}
                            </span>
                          </div>
                          <p
                            style={{
                              fontFamily: "'Georgia', serif",
                              fontSize: '0.75rem',
                              color: '#a3a3a3',
                              lineHeight: 1.6,
                              margin: '0 0 0.35rem 0',
                              paddingLeft: '12px',
                            }}
                          >
                            {cluster.description}
                          </p>
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '4px',
                              paddingLeft: '12px',
                            }}
                          >
                            {cluster.fragment_ids.map((fid) => {
                              const frag = fragmentMap.get(fid);
                              return frag ? <FragmentPill key={fid} fragment={frag} /> : null;
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Divider */}
                    <div
                      style={{
                        height: '1px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        margin: '0.75rem 0',
                      }}
                    />
                  </>
                )}

                {/* Narrative Threads */}
                {secondaryAnalysis.threads.length > 0 && (
                  <>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.65rem',
                        color: '#525252',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Narrative Threads
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {secondaryAnalysis.threads.map((thread) => (
                        <div key={thread.id}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              marginBottom: '0.25rem',
                            }}
                          >
                            <span style={{ color: '#737373', fontSize: '0.75rem' }}>→</span>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '0.75rem',
                                color: '#e5e5e5',
                                fontWeight: 600,
                              }}
                            >
                              {thread.name}
                            </span>
                          </div>
                          <p
                            style={{
                              fontFamily: "'Georgia', serif",
                              fontSize: '0.75rem',
                              color: '#a3a3a3',
                              lineHeight: 1.6,
                              margin: '0 0 0.35rem 0',
                              paddingLeft: '16px',
                            }}
                          >
                            {thread.description}
                          </p>
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '4px',
                              alignItems: 'center',
                              paddingLeft: '16px',
                            }}
                          >
                            {thread.sequence.map((fid, i) => {
                              const frag = fragmentMap.get(fid);
                              return (
                                <span key={`${fid}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  {frag ? <FragmentPill fragment={frag} /> : null}
                                  {i < thread.sequence.length - 1 && (
                                    <span style={{ color: '#525252', fontSize: '0.6rem' }}>→</span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Collapse/expand toggle tab */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          style={{
            width: '28px',
            background: 'rgba(15, 15, 15, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderLeft: collapsed ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
            borderRadius: collapsed ? '8px' : '0 8px 8px 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            flexShrink: 0,
            backdropFilter: 'blur(12px)',
          }}
        >
          <span
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              fontFamily: 'monospace',
              fontSize: '0.6rem',
              color: '#737373',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              userSelect: 'none',
            }}
          >
            {collapsed ? 'Prof. Alan' : '‹'}
          </span>
        </button>
      </div>
    </>
  );
}
