import { useEffect, useRef, useCallback } from 'react';
import type { Fragment } from '../../types';
import { CONNECTION_COLORS } from '../../types';
import type { ConnectionType } from '../../types';

interface Props {
  fragments: Fragment[];
}

interface AnimNode {
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  radius: number;
  label: string;
  opacity: number;
  targetOpacity: number;
  appearTime: number;
  pulsePhase: number;
  color: string;
}

interface AnimConnection {
  sourceIdx: number;
  targetIdx: number;
  type: ConnectionType;
  progress: number; // 0→1 draw progress
  opacity: number;
  appearTime: number;
  strength: number;
}

const CONNECTION_TYPES: ConnectionType[] = [
  'resonance', 'tension', 'genealogy', 'metaphor', 'bridge', 'ghost',
];

const NODE_COLORS = [
  '#3B82F6', '#A855F7', '#22C55E', '#EAB308', '#EF4444', '#06B6D4',
  '#F472B6', '#FB923C',
];

function truncateLabel(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '…';
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(t, 1);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function NetworkAnimation({ fragments }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef<{
    nodes: AnimNode[];
    connections: AnimConnection[];
    startTime: number;
    lastNodeTime: number;
    lastConnTime: number;
    phase: 'nodes' | 'connections' | 'settle';
    nodeIndex: number;
    connIndex: number;
    particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string }>;
  } | null>(null);

  const initState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const centerX = w / 2;
    const centerY = h / 2;
    const spreadX = w * 0.32;
    const spreadY = h * 0.32;

    // Create nodes from fragments, placed in a roughly circular layout with jitter
    const nodeCount = Math.min(fragments.length, 12);
    const nodes: AnimNode[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2 - Math.PI / 2;
      const radiusJitter = 0.7 + Math.random() * 0.6;
      const targetX = centerX + Math.cos(angle) * spreadX * radiusJitter;
      const targetY = centerY + Math.sin(angle) * spreadY * radiusJitter;
      const label = truncateLabel(fragments[i]?.text || `Node ${i + 1}`, 28);

      const startX = centerX + (Math.random() - 0.5) * 40;
      const startY = centerY + (Math.random() - 0.5) * 40;
      nodes.push({
        x: startX,
        y: startY,
        startX,
        startY,
        targetX,
        targetY,
        radius: 5 + Math.random() * 3,
        label,
        opacity: 0,
        targetOpacity: 1,
        appearTime: 0,
        pulsePhase: Math.random() * Math.PI * 2,
        color: NODE_COLORS[i % NODE_COLORS.length],
      });
    }

    // Pre-generate connections — pick pairs with different types
    const connections: AnimConnection[] = [];
    const maxConns = Math.min(nodeCount * 2, 20);
    const usedPairs = new Set<string>();

    for (let c = 0; c < maxConns; c++) {
      let srcIdx: number, tgtIdx: number;
      let attempts = 0;
      do {
        srcIdx = Math.floor(Math.random() * nodeCount);
        tgtIdx = Math.floor(Math.random() * nodeCount);
        attempts++;
      } while ((srcIdx === tgtIdx || usedPairs.has(`${srcIdx}-${tgtIdx}`)) && attempts < 50);

      if (srcIdx === tgtIdx) continue;
      usedPairs.add(`${srcIdx}-${tgtIdx}`);
      usedPairs.add(`${tgtIdx}-${srcIdx}`);

      connections.push({
        sourceIdx: srcIdx,
        targetIdx: tgtIdx,
        type: CONNECTION_TYPES[Math.floor(Math.random() * CONNECTION_TYPES.length)],
        progress: 0,
        opacity: 0,
        appearTime: 0,
        strength: 0.3 + Math.random() * 0.7,
      });
    }

    stateRef.current = {
      nodes,
      connections,
      startTime: performance.now(),
      lastNodeTime: 0,
      lastConnTime: 0,
      phase: 'nodes',
      nodeIndex: 0,
      connIndex: 0,
      particles: [],
    };
  }, [fragments]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      initState();
    };

    resize();
    window.addEventListener('resize', resize);

    const NODE_INTERVAL = 350;   // ms between each node appearing
    const CONN_INTERVAL = 200;   // ms between each connection appearing
    const CONN_DRAW_SPEED = 0.025; // progress per frame

    const animate = (now: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx || !stateRef.current) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }

      const state = stateRef.current;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const elapsed = now - state.startTime;

      // Clear
      ctx.clearRect(0, 0, w, h);

      // Phase: reveal nodes one by one
      if (state.phase === 'nodes') {
        if (state.nodeIndex < state.nodes.length) {
          if (elapsed - state.lastNodeTime > NODE_INTERVAL) {
            const node = state.nodes[state.nodeIndex];
            node.appearTime = elapsed;
            node.targetOpacity = 1;
            state.nodeIndex++;
            state.lastNodeTime = elapsed;

            // Spawn particles
            for (let p = 0; p < 6; p++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 0.3 + Math.random() * 0.8;
              state.particles.push({
                x: node.targetX,
                y: node.targetY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                maxLife: 40 + Math.random() * 30,
                color: node.color,
              });
            }
          }
        } else {
          state.phase = 'connections';
          state.lastConnTime = elapsed;
        }
      }

      // Phase: draw connections one by one
      if (state.phase === 'connections') {
        if (state.connIndex < state.connections.length) {
          if (elapsed - state.lastConnTime > CONN_INTERVAL) {
            const conn = state.connections[state.connIndex];
            conn.appearTime = elapsed;
            state.connIndex++;
            state.lastConnTime = elapsed;
          }
        } else {
          // All connections started — wait for them to finish, then settle
          const allDone = state.connections.every((c) => c.progress >= 1);
          if (allDone) {
            state.phase = 'settle';
          }
        }
      }

      // Update nodes
      for (const node of state.nodes) {
        if (node.appearTime === 0) continue;
        const nodeElapsed = elapsed - node.appearTime;
        const t = easeOutCubic(Math.min(nodeElapsed / 800, 1));
        node.x = lerp(node.startX, node.targetX, t);
        node.y = lerp(node.startY, node.targetY, t);
        node.opacity = lerp(0, node.targetOpacity, Math.min(nodeElapsed / 400, 1));
      }

      // Update connections
      for (const conn of state.connections) {
        if (conn.appearTime === 0) continue;
        if (conn.progress < 1) {
          conn.progress = Math.min(conn.progress + CONN_DRAW_SPEED, 1);
        }
        conn.opacity = Math.min((elapsed - conn.appearTime) / 300, 0.8);
      }

      // Update particles
      state.particles = state.particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.life -= 1 / p.maxLife;
        return p.life > 0;
      });

      // --- Draw ---

      // Draw connections
      for (const conn of state.connections) {
        if (conn.appearTime === 0 || conn.progress === 0) continue;
        const src = state.nodes[conn.sourceIdx];
        const tgt = state.nodes[conn.targetIdx];
        if (!src || !tgt || src.opacity === 0 || tgt.opacity === 0) continue;

        const color = CONNECTION_COLORS[conn.type];
        const endX = lerp(src.x, tgt.x, easeOutCubic(conn.progress));
        const endY = lerp(src.y, tgt.y, easeOutCubic(conn.progress));

        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = conn.opacity * conn.strength;
        ctx.lineWidth = 1.2 + conn.strength * 0.8;

        if (conn.type === 'ghost') {
          ctx.setLineDash([4, 6]);
        }

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Glow effect
        ctx.strokeStyle = color;
        ctx.globalAlpha = conn.opacity * 0.15;
        ctx.lineWidth = 4 + conn.strength * 2;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.restore();

        // Traveling dot along connection
        if (conn.progress > 0.1) {
          const dotT = ((elapsed / 2000) + conn.sourceIdx * 0.3) % 1;
          const dotX = lerp(src.x, tgt.x, dotT);
          const dotY = lerp(src.y, tgt.y, dotT);
          ctx.save();
          ctx.fillStyle = color;
          ctx.globalAlpha = conn.opacity * 0.6;
          ctx.beginPath();
          ctx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Draw particles
      for (const p of state.particles) {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life * 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5 * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw nodes
      for (const node of state.nodes) {
        if (node.opacity === 0) continue;

        const pulse = Math.sin(elapsed / 1200 + node.pulsePhase) * 0.15 + 1;
        const r = node.radius * pulse;

        // Outer glow
        ctx.save();
        ctx.fillStyle = node.color;
        ctx.globalAlpha = node.opacity * 0.12;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Inner glow
        ctx.save();
        ctx.fillStyle = node.color;
        ctx.globalAlpha = node.opacity * 0.3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Core
        ctx.save();
        ctx.fillStyle = node.color;
        ctx.globalAlpha = node.opacity * 0.9;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fill();

        // White center highlight
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = node.opacity * 0.4;
        ctx.beginPath();
        ctx.arc(node.x - r * 0.2, node.y - r * 0.2, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Label
        ctx.save();
        ctx.font = '10px "Inter", system-ui, sans-serif';
        ctx.fillStyle = '#a3a3a3';
        ctx.globalAlpha = node.opacity * 0.7;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(node.label, node.x, node.y + r + 6);
        ctx.restore();
      }

      // In settle phase, slowly drift nodes and loop back to restart after a pause
      if (state.phase === 'settle') {
        for (const node of state.nodes) {
          node.targetX += Math.sin(elapsed / 3000 + node.pulsePhase) * 0.15;
          node.targetY += Math.cos(elapsed / 3500 + node.pulsePhase) * 0.15;
          node.x = lerp(node.x, node.targetX, 0.02);
          node.y = lerp(node.y, node.targetY, 0.02);
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [initState]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
}
