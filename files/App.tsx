import { useState, useCallback, useEffect } from 'react';
import type { Fragment, GraphData, AppMode } from '../types';
import { demoFragments } from '../data/demo-fragments';
import { analyzeFragments } from '../api/claude';
import Canvas from './Canvas/Canvas';
import LoadingState from './UI/LoadingState';
import TitleBar from './UI/TitleBar';
import Graph3D from './Graph/Graph3D';

export default function App() {
  const [fragments, setFragments] = useState<Fragment[]>(demoFragments);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<AppMode>('canvas');
  const [graphData, setGraphData] = useState<GraphData | null>(null);

  const handleAddFragment = useCallback((fragment: Fragment) => {
    setFragments((prev) => [...prev, fragment]);
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
    // Don't clear graphData — enables re-analyze comparison
  }, []);

  const handleAnalyze = useCallback(async () => {
    const selected = fragments.filter((f) => selectedIds.has(f.id));
    if (selected.length < 2) return;

    setMode('loading');
    try {
      const data = await analyzeFragments(selected);
      setGraphData(data);
      setMode('graph');
    } catch (err) {
      console.error('Analysis failed:', err);
      setMode('canvas');
    }
  }, [fragments, selectedIds]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      // Cmd/Ctrl+A — select all (canvas mode only)
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && mode === 'canvas') {
        e.preventDefault();
        handleSelectAll();
      }
      // Cmd/Ctrl+Enter — analyze
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && mode === 'canvas' && selectedIds.size >= 2) {
        e.preventDefault();
        handleAnalyze();
      }
      // Escape — back to canvas
      if (e.key === 'Escape' && mode === 'graph') {
        e.preventDefault();
        handleBackToCanvas();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, selectedIds, handleSelectAll, handleAnalyze, handleBackToCanvas]);

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
      {/* TitleBar overlay on graph mode */}
      {mode === 'graph' && graphData && (
        <TitleBar showBackButton={true} onBackToCanvas={handleBackToCanvas} />
      )}

      {/* Content — no opacity transition for graph mode (let dolly-in be the transition) */}
      <div style={{ width: '100%', height: '100%' }}>
        {mode === 'canvas' && (
          <Canvas
            fragments={fragments}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onUnselectAll={handleUnselectAll}
            onAddFragment={handleAddFragment}
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
          />
        )}
      </div>
    </div>
  );
}
