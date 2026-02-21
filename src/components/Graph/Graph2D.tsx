import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { GraphData, Fragment, ConnectionType, SecondaryAnalysis } from '../../types';
import { CONNECTION_COLORS } from '../../types';
import Tooltip from './Tooltip';
import Legend from './Legend';
import SidePanel from './SidePanel';

interface Graph2DProps {
  graphData: GraphData;
  fragments: Fragment[];
  onBackToCanvas: () => void;
  onNodeSelectionChange: (selectedNodeIds: string[]) => void;
  secondaryAnalysis: SecondaryAnalysis | null;
  secondaryLoading: boolean;
}

interface GraphNode {
  id: string;
  label: string;
  isGhost: boolean;
  connectionCount: number;
  themeColor: string;
  thumbnail?: string;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: ConnectionType;
  strength: number;
  description: string;
}

export default function Graph2D({ graphData, fragments, onBackToCanvas, onNodeSelectionChange, secondaryAnalysis, secondaryLoading }: Graph2DProps) {
  const fgRef = useRef<any>(null);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const [hoverInfo, setHoverInfo] = useState<{
    type: 'node' | 'link';
    data: any;
    position: { x: number; y: number };
  } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [openFragmentIds, setOpenFragmentIds] = useState<Set<string>>(new Set());
  const [activeThemes, setActiveThemes] = useState<Set<string>>(new Set());
  const [activeConnectionTypes, setActiveConnectionTypes] = useState<Set<ConnectionType>>(new Set());

  useEffect(() => {
    onNodeSelectionChange(Array.from(openFragmentIds));
  }, [openFragmentIds, onNodeSelectionChange]);

  useEffect(() => {
    if (!fgRef.current) return;
    fgRef.current.d3Force('charge')?.strength(-300).distanceMax(250);
    fgRef.current.d3Force('link')?.distance(160);
    fgRef.current.d3Force('center')?.strength(0.1);
    setTimeout(() => {
      fgRef.current?.zoomToFit(400, 80);
    }, 800);
  }, []);

  const { nodes, links } = useMemo(() => {
    const connectionCounts: Record<string, number> = {};
    for (const conn of graphData.connections) {
      connectionCounts[conn.source] = (connectionCounts[conn.source] || 0) + 1;
      connectionCounts[conn.target] = (connectionCounts[conn.target] || 0) + 1;
    }

    for (const ghost of graphData.ghosts) {
      connectionCounts[ghost.id] = (connectionCounts[ghost.id] || 0) + ghost.connected_to.length;
      for (const fragId of ghost.connected_to) {
        connectionCounts[fragId] = (connectionCounts[fragId] || 0) + 1;
      }
    }

    const summaryMap = new Map(
      (graphData.summaries || []).map((s) => [s.id, s.summary])
    );

    const themeColorMap = new Map<string, string>();
    for (const theme of graphData.themes || []) {
      for (const fid of theme.fragment_ids) {
        themeColorMap.set(fid, theme.color);
      }
    }

    const fragmentNodes: GraphNode[] = fragments.map((f) => ({
      id: f.id,
      label: summaryMap.get(f.id) || f.text.split(' ').slice(0, 12).join(' ') + '…',
      isGhost: false,
      connectionCount: connectionCounts[f.id] || 0,
      themeColor: themeColorMap.get(f.id) || '#3B82F6',
      thumbnail: f.image?.thumbnail,
    }));

    const ghostNodes: GraphNode[] = graphData.ghosts.map((g) => ({
      id: g.id,
      label: g.label,
      isGhost: true,
      connectionCount: connectionCounts[g.id] || 0,
      themeColor: '#6B7280',
    }));

    const connectionLinks: GraphLink[] = graphData.connections.map((conn) => ({
      source: conn.source,
      target: conn.target,
      type: conn.type,
      strength: conn.strength,
      description: conn.description,
    }));

    const ghostLinks: GraphLink[] = graphData.ghosts.flatMap((ghost) =>
      ghost.connected_to.map((fragId) => ({
        source: ghost.id,
        target: fragId,
        type: 'ghost' as ConnectionType,
        strength: 0.5,
        description: ghost.description,
      }))
    );

    return {
      nodes: [...fragmentNodes, ...ghostNodes],
      links: [...connectionLinks, ...ghostLinks],
    };
  }, [graphData, fragments]);

  const forceGraphData = useMemo(() => ({ nodes: nodes as any, links: links as any }), [nodes, links]);

  // Build a set of fragment IDs belonging to active themes for fast lookup
  const activeThemeFragmentIds = useMemo(() => {
    if (activeThemes.size === 0) return null;
    const ids = new Set<string>();
    for (const theme of graphData.themes || []) {
      if (activeThemes.has(theme.name)) {
        for (const fid of theme.fragment_ids) ids.add(fid);
      }
    }
    return ids;
  }, [activeThemes, graphData.themes]);

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const graphNode = node as GraphNode;
      const isSelected = openFragmentIds.has(graphNode.id);
      const isFocused = focusedNodeId === graphNode.id;
      const isConnectedToFocused =
        focusedNodeId &&
        links.some(
          (l) =>
            (l.source === focusedNodeId && l.target === graphNode.id) ||
            (l.target === focusedNodeId && l.source === graphNode.id)
        );
      const isDimmedByFocus = focusedNodeId && !isFocused && !isConnectedToFocused;
      const isDimmedByTheme = activeThemeFragmentIds && !activeThemeFragmentIds.has(graphNode.id);
      const isDimmed = isDimmedByFocus || isDimmedByTheme;

      const baseSize = 4 + graphNode.connectionCount * 1.5;
      const size = graphNode.isGhost ? baseSize * 0.7 : baseSize;

      // Green selection halo
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, size * 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(34, 197, 94, 0.09)';
        ctx.fill();
      }

      // Glow
      if (!isDimmed) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, size * 2, 0, 2 * Math.PI);
        ctx.fillStyle = graphNode.themeColor + (isFocused ? '30' : '12');
        ctx.fill();
      }

      // Node shape
      if (graphNode.thumbnail) {
        // Image node
        const imgSize = size * 3;
        let img = imageCache.current.get(graphNode.id);
        if (!img) {
          img = new Image();
          img.src = graphNode.thumbnail;
          imageCache.current.set(graphNode.id, img);
        }
        if (img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.globalAlpha = isDimmed ? 0.3 : 1.0;
          // Clip to circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, imgSize / 2, 0, 2 * Math.PI);
          ctx.clip();
          ctx.drawImage(img, node.x - imgSize / 2, node.y - imgSize / 2, imgSize, imgSize);
          ctx.restore();
          // Border
          ctx.beginPath();
          ctx.arc(node.x, node.y, imgSize / 2, 0, 2 * Math.PI);
          ctx.strokeStyle = graphNode.themeColor + (isDimmed ? '30' : isFocused ? 'FF' : '88');
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          // Fallback while loading
          ctx.beginPath();
          ctx.arc(node.x, node.y, imgSize / 2, 0, 2 * Math.PI);
          ctx.fillStyle = graphNode.themeColor + '25';
          ctx.fill();
        }
      } else {
        ctx.beginPath();
        if (graphNode.isGhost) {
          ctx.moveTo(node.x, node.y - size);
          ctx.lineTo(node.x + size, node.y);
          ctx.lineTo(node.x, node.y + size);
          ctx.lineTo(node.x - size, node.y);
          ctx.closePath();
          ctx.strokeStyle = graphNode.themeColor + (isDimmed ? '30' : '99');
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = graphNode.themeColor + (isDimmed ? '08' : '20');
          ctx.fill();
        } else {
          ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
          ctx.fillStyle = graphNode.themeColor + (isDimmed ? '25' : 'DD');
          ctx.fill();

          if (isFocused) {
            ctx.strokeStyle = graphNode.themeColor;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }

      // Label
      const label = graphNode.label;
      const fontSize = Math.max(11 / globalScale, 3);
      ctx.font = graphNode.isGhost
        ? `italic ${fontSize}px Georgia`
        : `${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isDimmed
        ? 'rgba(255,255,255,0.15)'
        : graphNode.isGhost
        ? 'rgba(255,255,255,0.5)'
        : 'rgba(255,255,255,0.9)';
      const labelOffset = graphNode.thumbnail ? size * 1.5 + fontSize + 2 : size + fontSize + 2;
      ctx.fillText(label, node.x, node.y + labelOffset);
    },
    [focusedNodeId, links, activeThemeFragmentIds, openFragmentIds]
  );

  const linkColor = useCallback(
    (link: any) => {
      const graphLink = link as GraphLink;
      if (focusedNodeId) {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        if (sourceId !== focusedNodeId && targetId !== focusedNodeId) {
          return 'rgba(100,100,100,0.08)';
        }
      }
      if (activeConnectionTypes.size > 0 && !activeConnectionTypes.has(graphLink.type)) {
        return 'rgba(100,100,100,0.08)';
      }
      return CONNECTION_COLORS[graphLink.type] || '#6B7280';
    },
    [focusedNodeId, activeConnectionTypes]
  );

  const linkWidth = useCallback((link: any) => {
    return (link as GraphLink).strength * 3 + 0.5;
  }, []);

  const nodePointerAreaPaint = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D) => {
    const graphNode = node as GraphNode;
    const baseSize = 4 + (graphNode.connectionCount || 0) * 1.5;
    const size = graphNode.thumbnail ? baseSize * 1.5 : baseSize;
    ctx.beginPath();
    ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }, []);

  const handleNodeClick = useCallback(
    (node: any) => {
      const graphNode = node as GraphNode;

      const newFocused = focusedNodeId === graphNode.id ? null : graphNode.id;
      setFocusedNodeId(newFocused);

      if (!graphNode.isGhost) {
        setOpenFragmentIds((prev) => {
          const next = new Set(prev);
          if (next.has(graphNode.id)) {
            next.delete(graphNode.id);
          } else {
            next.add(graphNode.id);
          }
          return next;
        });
      }
    },
    [focusedNodeId]
  );

  const handleNodeDragEnd = useCallback((node: any) => {
    node.fx = node.x;
    node.fy = node.y;
  }, []);

  const handleEngineStop = useCallback(() => {
    for (const node of nodes as any[]) {
      node.fx = node.x;
      node.fy = node.y;
    }
  }, [nodes]);

  const handleToggleConnectionType = useCallback((type: ConnectionType) => {
    setActiveConnectionTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const handleToggleTheme = useCallback((themeName: string) => {
    setActiveThemes((prev) => {
      const next = new Set(prev);
      if (next.has(themeName)) next.delete(themeName);
      else next.add(themeName);
      return next;
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleNodeHover = useCallback((node: any) => {
    if (node) {
      setHoverInfo((prev) => ({
        type: 'node',
        data: node,
        position: prev?.position ?? { x: 0, y: 0 },
      }));
    } else {
      setHoverInfo(null);
    }
  }, []);

  const handleLinkHover = useCallback((link: any) => {
    if (link) {
      setHoverInfo((prev) => ({
        type: 'link',
        data: link,
        position: prev?.position ?? { x: 0, y: 0 },
      }));
    } else {
      setHoverInfo(null);
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} onMouseMove={handleMouseMove}>
      <ForceGraph2D
        ref={fgRef}
        graphData={forceGraphData}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={nodePointerAreaPaint}
        linkColor={linkColor}
        linkWidth={linkWidth}
        onNodeClick={handleNodeClick}
        onNodeDragEnd={handleNodeDragEnd}
        onEngineStop={handleEngineStop}
        onNodeHover={handleNodeHover}
        onLinkHover={handleLinkHover}
        backgroundColor="rgba(0,0,0,0)"
        cooldownTicks={100}
        warmupTicks={100}
      />

      {hoverInfo && <Tooltip info={{ ...hoverInfo, position: mousePos }} />}
      <Legend activeTypes={activeConnectionTypes} onToggleType={handleToggleConnectionType} />

      {openFragmentIds.size > 0 && (
        <SidePanel
          secondaryAnalysis={secondaryAnalysis}
          loading={secondaryLoading}
          fragments={fragments}
        />
      )}

      {/* Theme legend */}
      {graphData.themes && graphData.themes.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '1.5rem',
            right: '1.5rem',
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
            Themes
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {graphData.themes.map((theme) => {
              const isActive = activeThemes.has(theme.name);
              const isDimmed = activeThemes.size > 0 && !isActive;

              return (
                <div
                  key={theme.name}
                  onClick={() => handleToggleTheme(theme.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    background: isActive ? `${theme.color}18` : 'transparent',
                    opacity: isDimmed ? 0.35 : 1,
                    transition: 'opacity 0.2s, background 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: theme.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      color: theme.color,
                      userSelect: 'none',
                    }}
                  >
                    {theme.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Open fragment cards */}
      {openFragmentIds.size > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '4rem',
            right: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            maxHeight: 'calc(100vh - 10rem)',
            overflowY: 'auto',
            width: '320px',
          }}
        >
          {fragments
            .filter((f) => openFragmentIds.has(f.id))
            .map((f) => {
              const theme = (graphData.themes || []).find((t) =>
                t.fragment_ids.includes(f.id)
              );
              const color = theme?.color || '#3B82F6';
              const summary = (graphData.summaries || []).find((s) => s.id === f.id);

              return (
                <div
                  key={f.id}
                  style={{
                    background: 'rgba(15, 15, 15, 0.95)',
                    border: `1px solid ${color}40`,
                    borderLeft: `3px solid ${color}`,
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                        color: color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {summary?.summary || 'Fragment'}
                    </span>
                    <button
                      onClick={() =>
                        setOpenFragmentIds((prev) => {
                          const next = new Set(prev);
                          next.delete(f.id);
                          return next;
                        })
                      }
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#525252',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        lineHeight: 1,
                        padding: '0 0 0 0.5rem',
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <p
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: '0.85rem',
                      color: '#d4d4d4',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {f.text}
                  </p>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
