import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import type { GraphData, Fragment, Connection, Ghost, ConnectionType } from '../../types';
import { CONNECTION_COLORS } from '../../types';
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
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

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

    // Fragment nodes
    const fragmentNodes: GraphNode[] = fragments.map((f) => ({
      id: f.id,
      label: f.text.length > 60 ? f.text.slice(0, 60) + '...' : f.text,
      isGhost: false,
      connectionCount: connectionCounts[f.id] || 0,
    }));

    // Ghost nodes
    const ghostNodes: GraphNode[] = graphData.ghosts.map((g) => ({
      id: g.id,
      label: g.label,
      isGhost: true,
      connectionCount: connectionCounts[g.id] || 0,
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
        color: graphNode.isGhost ? '#6B7280' : '#3B82F6',
        transparent: true,
        opacity: isDimmed ? 0.15 : graphNode.isGhost ? 0.4 : 0.85,
        emissive: isFocused ? '#3B82F6' : '#000000',
        emissiveIntensity: isFocused ? 0.3 : 0,
      });
      const sphere = new THREE.Mesh(geometry, material);
      group.add(sphere);

      // Label sprite
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = 512;
      canvas.height = 64;
      ctx.font = '24px monospace';
      ctx.fillStyle = isDimmed ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.9)';
      ctx.textAlign = 'center';

      const labelText = graphNode.label;
      ctx.fillText(labelText, 256, 40);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(60, 8, 1);
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

  // Node click -> focus
  const handleNodeClick = useCallback(
    (node: any) => {
      const graphNode = node as GraphNode;
      if (focusedNodeId === graphNode.id) {
        setFocusedNodeId(null);
        return;
      }
      setFocusedNodeId(graphNode.id);

      // Camera zoom to node
      if (fgRef.current && node.x !== undefined) {
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

  // Hover handlers
  const handleNodeHover = useCallback((node: any, prevNode: any) => {
    if (node) {
      setHoverInfo({
        type: 'node',
        data: node,
        position: { x: (node as any).__screenX ?? 0, y: (node as any).__screenY ?? 0 },
      });
    } else {
      setHoverInfo(null);
    }
  }, []);

  const handleLinkHover = useCallback((link: any, prevLink: any) => {
    if (link) {
      setHoverInfo({
        type: 'link',
        data: link,
        position: { x: 0, y: 0 },
      });
    } else {
      setHoverInfo(null);
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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
        onNodeHover={handleNodeHover}
        onLinkHover={handleLinkHover}
        backgroundColor="#0a0a0a"
        showNavInfo={false}
      />
      {hoverInfo && <Tooltip info={hoverInfo} />}
      <Legend />
    </div>
  );
}
