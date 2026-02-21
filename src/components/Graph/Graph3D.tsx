import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import type { GraphData, Fragment, Connection, Ghost, ConnectionType, Theme, SecondaryAnalysis } from '../../types';
import { CONNECTION_COLORS, THEME_PALETTE } from '../../types';
import * as THREE from 'three';
import Tooltip from './Tooltip';
import Legend from './Legend';
import SidePanel from './SidePanel';
import Graph2D from './Graph2D';

interface Graph3DProps {
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
  x?: number;
  y?: number;
  z?: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: ConnectionType;
  strength: number;
  description: string;
}

export default function Graph3D({ graphData, fragments, onBackToCanvas, onNodeSelectionChange, secondaryAnalysis, secondaryLoading }: Graph3DProps) {
  const fgRef = useRef<any>(null);
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
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('2d');

  useEffect(() => {
    onNodeSelectionChange(Array.from(openFragmentIds));
  }, [openFragmentIds, onNodeSelectionChange]);

  useEffect(() => {
    if (!fgRef.current) return;

    const fg = fgRef.current;
    const scene = fg.scene();
    const renderer = fg.renderer();
    renderer.setClearColor(0x000000, 0);
    scene.background = null;

    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x7C3AED, 1, 500);
    pointLight.position.set(100, 100, 100);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x3B82F6, 0.5, 400);
    pointLight2.position.set(-80, -60, 80);
    scene.add(pointLight2);

    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.0001);

    fg.d3Force('charge')?.strength(-350).distanceMax(400);
    fg.d3Force('link')?.distance(80);

    fg.cameraPosition({ x: 0, y: 0, z: 500 });
    setTimeout(() => {
      fg.cameraPosition({ x: 0, y: 0, z: 350 }, { x: 0, y: 0, z: 0 }, 2000);
    }, 100);

    return () => {
      scene.remove(ambientLight);
      scene.remove(pointLight);
      scene.remove(pointLight2);
      scene.fog = null;
    };
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

  const nodeThreeObject = useCallback(
    (node: any) => {
      const graphNode = node as GraphNode;
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

      const group = new THREE.Group();

      const geometry = graphNode.isGhost
        ? new THREE.OctahedronGeometry(size, 0)
        : new THREE.SphereGeometry(size, 24, 24);

      const material = new THREE.MeshPhongMaterial({
        color: graphNode.themeColor,
        transparent: false,
        opacity: 1.0,
        emissive: isFocused ? graphNode.themeColor : '#000000',
        emissiveIntensity: isFocused ? 0.4 : 0.1,
        wireframe: graphNode.isGhost,
      });
      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);

      const glowGeom = new THREE.SphereGeometry(size * 2, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: graphNode.themeColor,
        transparent: true,
        opacity: isDimmed ? 0.04 : isFocused ? 0.25 : 0.12,
      });
      group.add(new THREE.Mesh(glowGeom, glowMat));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const font = graphNode.isGhost ? 'italic 36px Georgia' : '38px monospace';
      ctx.font = font;
      const textWidth = ctx.measureText(graphNode.label).width;
      const padding = 40;
      canvas.width = Math.max(512, textWidth + padding * 2);
      canvas.height = 64;
      ctx.font = font;
      ctx.fillStyle = isDimmed ? 'rgba(255,255,255,0.15)' : graphNode.isGhost ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.9)';
      ctx.textAlign = 'center';
      ctx.fillText(graphNode.label, canvas.width / 2, 44);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.renderOrder = 999;
      const spriteWidth = (canvas.width / canvas.height) * 8;
      sprite.scale.set(spriteWidth, 8, 1);
      sprite.position.set(0, size + 8, 0);
      group.add(sprite);

      return group;
    },
    [focusedNodeId, links, activeThemeFragmentIds]
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

  const handleNodeClick = useCallback(
    (node: any) => {
      const graphNode = node as GraphNode;

      const newFocused = focusedNodeId === graphNode.id ? null : graphNode.id;
      setFocusedNodeId(newFocused);

      // Toggle fragment in/out of selection (only for non-ghost nodes)
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
    node.fz = node.z;
  }, []);

  const handleEngineStop = useCallback(() => {
    for (const node of nodes as any[]) {
      node.fx = node.x;
      node.fy = node.y;
      node.fz = node.z;
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

  const handleRecenter = useCallback(() => {
    if (!fgRef.current) return;
    fgRef.current.zoomToFit(600, 40);
    setFocusedNodeId(null);
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
      {/* 2D/3D Toggle */}
      <div
        style={{
          position: 'absolute',
          top: '4rem',
          right: '1.5rem',
          zIndex: 20,
          display: 'flex',
          background: 'rgba(15, 15, 15, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          overflow: 'hidden',
          backdropFilter: 'blur(8px)',
        }}
      >
        <button
          onClick={() => setViewMode('2d')}
          style={{
            padding: '0.5rem 1rem',
            background: viewMode === '2d' ? 'rgba(124, 58, 237, 0.3)' : 'transparent',
            border: 'none',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            color: viewMode === '2d' ? '#A855F7' : '#666',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            fontWeight: viewMode === '2d' ? 700 : 400,
            letterSpacing: '0.05em',
            transition: 'all 0.2s ease',
          }}
        >
          2D
        </button>
        <button
          onClick={() => setViewMode('3d')}
          style={{
            padding: '0.5rem 1rem',
            background: viewMode === '3d' ? 'rgba(124, 58, 237, 0.3)' : 'transparent',
            border: 'none',
            color: viewMode === '3d' ? '#A855F7' : '#666',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            fontWeight: viewMode === '3d' ? 700 : 400,
            letterSpacing: '0.05em',
            transition: 'all 0.2s ease',
          }}
        >
          3D
        </button>
      </div>

      {viewMode === '2d' ? (
        <Graph2D
          graphData={graphData}
          fragments={fragments}
          onBackToCanvas={onBackToCanvas}
          onNodeSelectionChange={onNodeSelectionChange}
        />
      ) : (
        <>
          <ForceGraph3D
        ref={fgRef}
        graphData={{ nodes: nodes as any, links: links as any }}
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={false}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={1}
        onNodeClick={handleNodeClick}
        onNodeDragEnd={handleNodeDragEnd}
        onEngineStop={handleEngineStop}
        onNodeHover={handleNodeHover}
        onLinkHover={handleLinkHover}
        backgroundColor="rgba(0,0,0,0)"
        showNavInfo={false}
        cooldownTime={4000}
        d3VelocityDecay={0.6}
      />


      {hoverInfo && <Tooltip info={{ ...hoverInfo, position: mousePos }} />}
      <Legend activeTypes={activeConnectionTypes} onToggleType={handleToggleConnectionType} />
      <button
        onClick={handleRecenter}
        style={{
          position: 'absolute',
          bottom: '13.5rem',
          left: '1.5rem',
          background: 'rgba(15, 15, 15, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '0.5rem 0.75rem',
          backdropFilter: 'blur(8px)',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          color: '#a3a3a3',
          letterSpacing: '0.05em',
          transition: 'color 0.2s, border-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#e5e5e5';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#a3a3a3';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        Recenter
      </button>
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
            marginTop: '3rem',
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
        </>
      )}
    </div>
  );
}
