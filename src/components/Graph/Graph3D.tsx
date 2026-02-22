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
  thumbnail?: string;
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
  const textureCache = useRef<Map<string, THREE.Texture>>(new Map());
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

    // Strong repulsion creates volume between unrelated nodes
    fg.d3Force('charge')?.strength(-700).distanceMax(1000);

    // Weaken center force so clusters can occupy distinct volumes
    fg.d3Force('center')?.strength(0.03);

    // Vary link distance by connection type — tight bonds vs long bridges
    const linkDistanceByType: Record<string, number> = {
      resonance: 80,    // tight conceptual bond
      genealogy: 100,   // close lineage
      metaphor: 150,    // moderate — figurative leap
      tension: 220,     // further apart — opposing forces
      bridge: 280,      // longest — spanning distant clusters
      ghost: 160,       // ethereal middle-distance
    };
    fg.d3Force('link')
      ?.distance((link: any) => {
        const type = link.type || 'ghost';
        const base = linkDistanceByType[type] || 150;
        const strengthMod = 1 + (1 - (link.strength || 0.5)) * 0.6;
        return base * strengthMod;
      })
      .strength((link: any) => {
        return 0.2 + (link.strength || 0.5) * 0.5;
      });

    fg.cameraPosition({ x: 0, y: 0, z: 600 });
    setTimeout(() => {
      fg.cameraPosition({ x: 0, y: 0, z: 400 }, { x: 0, y: 0, z: 0 }, 2500);
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

    const truncate = (text: string, maxWords: number) => {
      const words = text.split(' ');
      return words.length <= maxWords ? text : words.slice(0, maxWords).join(' ') + '…';
    };

    const fragmentNodes: GraphNode[] = fragments.map((f) => ({
      id: f.id,
      label: truncate(summaryMap.get(f.id) || f.text, 8),
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

    // --- Topology-based orbital seeding ---
    // Detect connected subgraphs via union-find on actual edges
    const allNodes = [...fragmentNodes, ...ghostNodes];
    const allLinks = [...connectionLinks, ...ghostLinks];
    const nodeIdSet = new Set(allNodes.map((n) => n.id));
    const parent = new Map<string, string>();
    const find = (x: string): string => {
      if (!parent.has(x)) parent.set(x, x);
      if (parent.get(x) !== x) parent.set(x, find(parent.get(x)!));
      return parent.get(x)!;
    };
    const union = (a: string, b: string) => {
      parent.set(find(a), find(b));
    };
    for (const id of nodeIdSet) parent.set(id, id);
    for (const link of allLinks) {
      if (nodeIdSet.has(link.source) && nodeIdSet.has(link.target)) {
        union(link.source, link.target);
      }
    }

    // Group nodes by their connected component
    const components = new Map<string, GraphNode[]>();
    for (const node of allNodes) {
      const root = find(node.id);
      if (!components.has(root)) components.set(root, []);
      components.get(root)!.push(node);
    }
    const clusters = Array.from(components.values());

    // Generate cluster centers with full 3D volume (random directions, not on a surface)
    const n = allNodes.length;
    const interClusterDist = 100 + n * 18;
    const clusterCenters: Array<{ x: number; y: number; z: number }> = [];
    for (let i = 0; i < clusters.length; i++) {
      // Random direction in 3D using spherical coordinates with random radius
      const phi = Math.acos(2 * Math.random() - 1); // polar: 0 to PI
      const theta = Math.random() * 2 * Math.PI;     // azimuthal: 0 to 2PI
      const r = interClusterDist * (0.5 + Math.random() * 0.5);
      clusterCenters.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
      });
    }

    // Within each cluster, arrange nodes in orbital shells by valence
    clusters.forEach((cluster, ci) => {
      const center = clusterCenters[ci];
      // Sort by connection count descending — high valence nodes at center
      const sorted = [...cluster].sort((a, b) => b.connectionCount - a.connectionCount);
      const shellSpacing = 30 + cluster.length * 4;

      sorted.forEach((node, i) => {
        if (i === 0) {
          // Most-connected node at the cluster center
          node.x = center.x;
          node.y = center.y;
          node.z = center.z;
        } else {
          // Orbital shell: distance grows with index, position is random on sphere
          const shell = Math.ceil(i / 3); // ~3 nodes per shell
          const shellR = shell * shellSpacing;
          const phi = Math.acos(2 * Math.random() - 1);
          const theta = Math.random() * 2 * Math.PI;
          node.x = center.x + shellR * Math.sin(phi) * Math.cos(theta);
          node.y = center.y + shellR * Math.sin(phi) * Math.sin(theta);
          node.z = center.z + shellR * Math.cos(phi);
        }
      });
    });

    return {
      nodes: allNodes,
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

      const group = new THREE.Group();

      if (graphNode.thumbnail) {
        // Image node: render as a billboard sprite that always faces the camera
        const imgSize = size * 2.5;
        let texture = textureCache.current.get(graphNode.id);
        if (!texture) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = graphNode.thumbnail;
          texture = new THREE.Texture(img);
          img.onload = () => { texture!.needsUpdate = true; };
          textureCache.current.set(graphNode.id, texture);
        }
        const spriteMat = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          opacity: isDimmed ? 0.3 : 1.0,
        });
        const imgSprite = new THREE.Sprite(spriteMat);
        imgSprite.scale.set(imgSize, imgSize, 1);
        group.add(imgSprite);
      } else {
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
      }

      const glowRadius = graphNode.thumbnail ? size * 3 : size * 2;
      const glowGeom = new THREE.SphereGeometry(glowRadius, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: graphNode.themeColor,
        transparent: true,
        opacity: isDimmed ? 0.04 : isFocused ? 0.25 : 0.12,
      });
      group.add(new THREE.Mesh(glowGeom, glowMat));

      // Green selection halo
      if (isSelected) {
        const haloRadius = graphNode.thumbnail ? size * 3.5 : size * 2.5;
        const haloGeom = new THREE.SphereGeometry(haloRadius, 16, 16);
        const haloMat = new THREE.MeshBasicMaterial({
          color: '#22C55E',
          transparent: true,
          opacity: 0.09,
        });
        group.add(new THREE.Mesh(haloGeom, haloMat));
      }

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
      const labelY = graphNode.thumbnail ? size * 2.5 / 2 + 6 : size + 8;
      sprite.position.set(0, labelY, 0);
      group.add(sprite);

      return group;
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
          secondaryAnalysis={secondaryAnalysis}
          secondaryLoading={secondaryLoading}
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
        warmupTicks={60}
        cooldownTime={8000}
        d3VelocityDecay={0.25}
        d3AlphaDecay={0.015}
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
