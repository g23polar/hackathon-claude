import { useState, useCallback, useEffect, useRef } from 'react';
import type { Fragment, GraphData, AppMode, SecondaryAnalysis } from '../types';
import { demoFragments } from '../data/demo-fragments';
import { analyzeFragments, analyzeSecondary } from '../api/claude';
import Canvas from './Canvas/Canvas';
import LoadingState from './UI/LoadingState';
import TitleBar from './UI/TitleBar';
import Graph3D from './Graph/Graph3D';
import ConstellationBg from './Canvas/ConstellationBg';

export default function App() {
  const [fragments, setFragments] = useState<Fragment[]>(demoFragments);
  const [mode, setMode] = useState<AppMode>('canvas');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [secondaryAnalysis, setSecondaryAnalysis] = useState<SecondaryAnalysis | null>(null);
  const [secondaryLoading, setSecondaryLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const prevModeRef = useRef<AppMode>('canvas');

  // Animate opacity on mode transitions
  useEffect(() => {
    if (mode !== prevModeRef.current) {
      // Fade out
      setOpacity(0);
      setTransitioning(true);

      const timer = setTimeout(() => {
        // Fade in
        setOpacity(1);
        setTransitioning(false);
      }, 300);

      prevModeRef.current = mode;
      return () => clearTimeout(timer);
    }
  }, [mode]);

  const handleAddFragment = useCallback((fragment: Fragment) => {
    setFragments((prev) => {
      const normalized = fragment.text.trim().toLowerCase();
      if (prev.some((f) => f.text.trim().toLowerCase() === normalized)) return prev;
      return [...prev, fragment];
    });
  }, []);

  const handleAddMultiple = useCallback((newFragments: Fragment[]) => {
    setFragments((prev) => {
      const existing = new Set(prev.map((f) => f.text.trim().toLowerCase()));
      const unique = newFragments.filter((f) => {
        const n = f.text.trim().toLowerCase();
        if (existing.has(n)) return false;
        existing.add(n);
        return true;
      });
      return [...prev, ...unique];
    });
  }, []);

  const handleUpdateFragment = useCallback((id: string, updates: Partial<Fragment>) => {
    setFragments((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  }, []);

  const handleDeleteFragment = useCallback((id: string) => {
    setFragments((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleBackToCanvas = useCallback(() => {
    setMode('canvas');
    setGraphData(null);
    setSecondaryAnalysis(null);
    setSecondaryLoading(false);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (fragments.length < 2) return;

    setMode('loading');
    setSecondaryAnalysis(null);
    setSecondaryLoading(false);
    try {
      const data = await analyzeFragments(fragments);
      setGraphData(data);
      setMode('graph');
    } catch (err) {
      console.error('Analysis failed:', err);
      setMode('canvas');
    }
  }, [fragments]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && mode === 'canvas' && fragments.length >= 2) {
        e.preventDefault();
        handleAnalyze();
      }
      if (e.key === 'Escape' && mode === 'graph') {
        e.preventDefault();
        handleBackToCanvas();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, fragments.length, handleAnalyze, handleBackToCanvas]);


  // Re-run Professor Alan whenever the graph node selection changes
  const handleNodeSelectionChange = useCallback(
    (selectedNodeIds: string[]) => {
      if (selectedNodeIds.length === 0 || !graphData) {
        setSecondaryAnalysis(null);
        setSecondaryLoading(false);
        return;
      }

      const selectedFragments = fragments.filter((f) => selectedNodeIds.includes(f.id));
      if (selectedFragments.length === 0) return;

      setSecondaryAnalysis(null);
      setSecondaryLoading(true);
      analyzeSecondary(selectedFragments, {
        connections: graphData.connections,
        ghosts: graphData.ghosts,
      })
        .then((secondary) => {
          setSecondaryAnalysis(secondary);
        })
        .catch((err) => {
          console.error('Secondary analysis failed (non-fatal):', err);
        })
        .finally(() => {
          setSecondaryLoading(false);
        });
    },
    [fragments, graphData]
  );

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#0a0a0a',
        color: '#e5e5e5',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, opacity: mode === 'graph' ? 0.5 : 1, transition: 'opacity 0.5s ease', zIndex: 0 }}>
        <ConstellationBg />
      </div>

      {mode === 'graph' && graphData && (
        <TitleBar showBackButton={true} onBackToCanvas={handleBackToCanvas} />
      )}

      <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
        {mode === 'canvas' && (
          <Canvas
            fragments={fragments}
            onAddFragment={handleAddFragment}
            onAddMultiple={handleAddMultiple}
            onUpdateFragment={handleUpdateFragment}
            onDeleteFragment={handleDeleteFragment}
            onAnalyze={handleAnalyze}
          />
        )}
        {mode === 'loading' && <LoadingState />}
        {mode === 'graph' && graphData && (
          <Graph3D
            graphData={graphData}
            fragments={fragments}
            onBackToCanvas={handleBackToCanvas}
            secondaryAnalysis={secondaryAnalysis}
            secondaryLoading={secondaryLoading}
            onNodeSelectionChange={handleNodeSelectionChange}
          />
        )}
      </div>
    </div>
  );
}
