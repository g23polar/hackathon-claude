import { useState, useCallback, useEffect, useRef } from 'react';
import type { Fragment, GraphData, AppMode, SecondaryAnalysis } from '../types';
import { demoFragments } from '../data/demo-fragments';
import { analyzeFragments, analyzeSecondary } from '../api/claude';
import Canvas from './Canvas/Canvas';
import LoadingState from './UI/LoadingState';
import TitleBar from './UI/TitleBar';
import Graph3D from './Graph/Graph3D';

export default function App() {
  const [fragments, setFragments] = useState<Fragment[]>(demoFragments);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
    setFragments((prev) => [...prev, fragment]);
  }, []);

  const handleAddMultiple = useCallback((newFragments: Fragment[]) => {
    setFragments((prev) => [...prev, ...newFragments]);
  }, []);

  const handleDeleteFragment = useCallback((id: string) => {
    setFragments((prev) => prev.filter((f) => f.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(fragments.map((f) => f.id)));
  }, [fragments]);

  const handleUnselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBackToCanvas = useCallback(() => {
    setMode('canvas');
    setGraphData(null);
    setSecondaryAnalysis(null);
    setSecondaryLoading(false);
  }, []);

  const handleAnalyze = useCallback(async () => {
    const selected = fragments.filter((f) => selectedIds.has(f.id));
    if (selected.length < 2) return;

    setMode('loading');
    setSecondaryAnalysis(null);
    setSecondaryLoading(false);
    try {
      const data = await analyzeFragments(selected);
      setGraphData(data);
      setMode('graph');
    } catch (err) {
      console.error('Analysis failed:', err);
      setMode('canvas');
    }
  }, [fragments, selectedIds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && mode === 'canvas') {
        e.preventDefault();
        handleSelectAll();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && mode === 'canvas' && selectedIds.size >= 2) {
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
  }, [mode, selectedIds, handleSelectAll, handleAnalyze, handleBackToCanvas]);


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
      {mode === 'graph' && graphData && (
        <TitleBar showBackButton={true} onBackToCanvas={handleBackToCanvas} />
      )}

      <div style={{ width: '100%', height: '100%' }}>
        {mode === 'canvas' && (
          <Canvas
            fragments={fragments}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onUnselectAll={handleUnselectAll}
            onAddFragment={handleAddFragment}
            onAddMultiple={handleAddMultiple}
            onDeleteFragment={handleDeleteFragment}
            onAnalyze={handleAnalyze}
          />
        )}
        {mode === 'loading' && <LoadingState />}
        {mode === 'graph' && graphData && (
          <Graph3D
            graphData={graphData}
            fragments={fragments.filter((f) => selectedIds.has(f.id))}
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
