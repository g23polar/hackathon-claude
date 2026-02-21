import { useState, useCallback } from "react";
import { STARTER_NODES } from "./lib/constants";
import { analyzeWithClaude } from "./lib/claude";
import Canvas2D from "./components/Canvas2D";
import ThreeGraph from "./components/ThreeGraph";
import AnalyzingScreen from "./components/AnalyzingScreen";

export default function App() {
  const [nodes, setNodes] = useState(STARTER_NODES);
  const [selected, setSelected] = useState(new Set());
  const [mode, setMode] = useState("canvas"); // canvas | analyzing | graph
  const [analysis, setAnalysis] = useState(null);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzePhase, setAnalyzePhase] = useState("");
  const [error, setError] = useState(null);

  const toggleSelect = useCallback((id, forceDeselect = false) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (forceDeselect || next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleAnalyze = async () => {
    setMode("analyzing");
    setAnalyzeProgress(0);
    setError(null);

    const selectedNodes = nodes.filter((n) => selected.has(n.id));

    try {
      const result = await analyzeWithClaude(selectedNodes, ({ phase, progress }) => {
        setAnalyzePhase(phase);
        setAnalyzeProgress(progress);
      });

      // Brief pause for the "Building space..." phase to register visually
      await new Promise((r) => setTimeout(r, 400));

      setAnalysis(result);
      setMode("graph");
    } catch (err) {
      console.error("Claude API error:", err);
      setError(err.message || "API call failed — check console.");
      // Wait then return to canvas
      await new Promise((r) => setTimeout(r, 2000));
      setMode("canvas");
    }
  };

  const handleBack = () => {
    setMode("canvas");
    setAnalysis(null);
  };

  // ─── GRAPH MODE ───
  if (mode === "graph" && analysis) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#0a0a0f",
          overflow: "hidden",
        }}
      >
        <ThreeGraph
          nodes={nodes.filter((n) => selected.has(n.id))}
          connections={analysis.connections || []}
          bridgeNodes={analysis.bridge_nodes || []}
          clusters={analysis.clusters || []}
          axisLabels={analysis.spatial_hints?.axis_suggestions}
          fieldReading={analysis.analysis?.field_reading}
          emergentTheme={analysis.analysis?.emergent_theme}
          onBack={handleBack}
        />
      </div>
    );
  }

  // ─── ANALYZING MODE ───
  if (mode === "analyzing") {
    return (
      <AnalyzingScreen
        progress={analyzeProgress}
        phase={analyzePhase}
        error={error}
      />
    );
  }

  // ─── CANVAS MODE ───
  return (
    <Canvas2D
      nodes={nodes}
      setNodes={setNodes}
      selected={selected}
      toggleSelect={toggleSelect}
      onAnalyze={handleAnalyze}
    />
  );
}
