import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import type { GraphData, Fragment, Connection, Ghost, ConnectionType, Theme } from '../../types';
import { CONNECTION_COLORS, THEME_PALETTE } from '../../types';
import * as THREE from 'three';
import Tooltip from './Tooltip';
import Legend from './Legend';

interface Graph3DProps {
  graphData: GraphData;
  fragments: Fragment[];
  onBackToCanvas: () => void;
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

export default function Graph3D({ graphData, fragments, onBackToCanvas }: Graph3DProps) {
  const fgRef = useRef<any>(null);
  const [hoverInfo, setHoverInfo] = useState<{
    type: 'node' | 'link';
    data: any;
    position: { x: number; y: number };
  } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [openFragmentIds, setOpenFragmentIds] = useState<Set<string>>(new Set());

  // Add ambient lighting and initial camera animation
  useEffect(() => {
    if (!fgRef.current) return;

    const fg = fgRef.current;
    const scene = fg.scene();
    const renderer = fg.renderer();

    // Add ambient light for softer node rendering
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    // Add a subtle point light
    const pointLight = new THREE.PointLight(0x7C3AED, 1, 500);
    pointLight.position.set(100, 100, 100);
    scene.add(pointLight);

    // Add fog for depth perception
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.003);

    // Configure force simulation to settle quickly
    fg.d3Force('charge')?.strength(-120);

    // Initial dolly-in: start far, animate to default
    fg.cameraPosition({ x: 0, y: 0, z: 500 });
    setTimeout(() => {
      fg.cameraPosition({ x: 0, y: 0, z: 250 }, { x: 0, y: 0, z: 0 }, 2000);
    }, 100);

    return () => {
      scene.remove(ambientLight);
      scene.remove(pointLight);
      scene.fog = null;
    };
  }, []);

  // Build graph data for react-force-graph-3d
  const { nodes, links } = useMemo(() => {
    // Count connections per node
    const connectionCounts: Record<string, number> = {};
    for (const conn of graphData.connections) {
      connectionCounts[conn.source] = (connectionCounts[conn.source] || 0) + 1;
      connectionCounts[conn.target] = (connectionCounts[conn.target] || 0) + 1;
    }

    // Also count ghost connections
    for (const ghost of graphData.ghosts) {
      connectionCounts[ghost.id] = (connectionCounts[ghost.id] || 0) + ghost.connected_to.length;
      for (const fragId of ghost.connected_to) {
        connectionCounts[fragId] = (connectionCounts[fragId] || 0) + 1;
      }
    }

    // Build summary lookup
    const summaryMap = new Map(
      (graphData.summaries || []).map((s) => [s.id, s.summary])
    );

    // Build theme color lookup
    const themeColorMap = new Map<string, string>();
    for (const theme of graphData.themes || []) {
      for (const fid of theme.fragment_ids) {
        themeColorMap.set(fid, theme.color);
      }
    }

    // Fragment nodes
    const fragmentNodes: GraphNode[] = fragments.map((f) => ({
      id: f.id,
      label: summaryMap.get(f.id) || f.text.split(' ').slice(0, 12).join(' ') + '…',
      isGhost: false,
      connectionCount: connectionCounts[f.id] || 0,
      themeColor: themeColorMap.get(f.id) || '#3B82F6',
    }));

    // Ghost nodes
    const ghostNodes: GraphNode[] = graphData.ghosts.map((g) => ({
      id: g.id,
      label: g.label,
      isGhost: true,
      connectionCount: connectionCounts[g.id] || 0,
      themeColor: '#6B7280',
    }));

    // Connection links
    const connectionLinks: GraphLink[] = graphData.connections.map((conn) => ({
      source: conn.source,
      target: conn.target,
      type: conn.type,
      strength: conn.strength,
      description: conn.description,
    }));

    // Ghost connection links
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

  // Custom node rendering
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
      const isDimmed = focusedNodeId && !isFocused && !isConnectedToFocused;

      const baseSize = 4 + graphNode.connectionCount * 1.5;
      const size = graphNode.isGhost ? baseSize * 0.7 : baseSize;

      const group = new THREE.Group();

      // Sphere
      const geometry = new THREE.SphereGeometry(size, 16, 16);
      const material = new THREE.MeshPhongMaterial({
        color: graphNode.themeColor,
        transparent: true,
        opacity: isDimmed ? 0.15 : graphNode.isGhost ? 0.4 : 0.85,
        emissive: isFocused ? graphNode.themeColor : '#000000',
        emissiveIntensity: isFocused ? 0.3 : 0,
      });
      const sphere = new THREE.Mesh(geometry, material);
      group.add(sphere);

      // Label sprite
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = 1024;
      canvas.height = 64;
      ctx.font = '24px monospace';
      ctx.fillStyle = isDimmed ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.9)';
      ctx.textAlign = 'center';
      ctx.fillText(graphNode.label, 512, 40);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(80, 5, 1);
      sprite.position.set(0, size + 6, 0);
      group.add(sprite);

      return group;
    },
    [focusedNodeId, links]
  );

  // Link color by type
  const linkColor = useCallback(
    (link: any) => {
      const graphLink = link as GraphLink;
      if (focusedNodeId) {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        if (sourceId !== focusedNodeId && targetId !== focusedNodeId) {
          return 'rgba(100,100,100,0.1)';
        }
      }
      return CONNECTION_COLORS[graphLink.type] || '#6B7280';
    },
    [focusedNodeId]
  );

  // Link width by strength
  const linkWidth = useCallback((link: any) => {
    return (link as GraphLink).strength * 3 + 0.5;
  }, []);

  // Link dash for ghost type
  const linkLineDash = useCallback((link: any) => {
    return (link as GraphLink).type === 'ghost' ? [2, 2] : undefined;
  }, []);

  // Node click -> focus + toggle open fragment
  const handleNodeClick = useCallback(
    (node: any) => {
      const graphNode = node as GraphNode;

      // Toggle focus
      const newFocused = focusedNodeId === graphNode.id ? null : graphNode.id;
      setFocusedNodeId(newFocused);

      // Toggle fragment panel (only for non-ghost nodes)
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

      // Camera zoom to node
      if (newFocused && fgRef.current && node.x !== undefined) {
        const distance = 120;
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
        fgRef.current.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
          { x: node.x, y: node.y, z: node.z },
          1000
        );
      }
    },
    [focusedNodeId]
  );

  // Pin node in place after dragging
  const handleNodeDragEnd = useCallback((node: any) => {
    node.fx = node.x;
    node.fy = node.y;
    node.fz = node.z;
  }, []);

  // When simulation stops, pin all nodes so nothing drifts
  const handleEngineStop = useCallback(() => {
    if (!fgRef.current) return;
    const gd = fgRef.current.graphData();
    if (gd?.nodes) {
      for (const node of gd.nodes as any[]) {
        node.fx = node.x;
        node.fy = node.y;
        node.fz = node.z;
      }
    }
  }, []);

  // Track mouse position for tooltip
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  // Hover handlers
  const handleNodeHover = useCallback((node: any, prevNode: any) => {
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

  const handleLinkHover = useCallback((link: any, prevLink: any) => {
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
        backgroundColor="#0a0a0a"
        showNavInfo={false}
        cooldownTime={4000}
        d3VelocityDecay={0.6}
      />
      {hoverInfo && <Tooltip info={{ ...hoverInfo, position: mousePos }} />}
      <Legend />
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
            {graphData.themes.map((theme) => (
              <div key={theme.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                  }}
                >
                  {theme.name}
                </span>
              </div>
            ))}
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
              // Find theme color for this fragment
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
