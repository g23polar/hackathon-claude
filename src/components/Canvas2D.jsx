import { useState, useRef, useCallback, useEffect } from "react";
import AddNodeForm from "./AddNodeForm";

export default function Canvas2D({ nodes, setNodes, selected, toggleSelect, onAnalyze }) {
  const canvasRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [dragMoved, setDragMoved] = useState(false);
  const [nodePositions, setNodePositions] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);

  // Initialize positions
  useEffect(() => {
    setNodePositions((prev) => {
      const next = { ...prev };
      nodes.forEach((n, i) => {
        if (!next[n.id]) {
          next[n.id] = {
            x: 60 + (i % 4) * 220,
            y: 80 + Math.floor(i / 4) * 240,
          };
        }
      });
      return next;
    });
  }, [nodes]);

  const handleMouseDown = (e, id) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    setDragging({
      id,
      offsetX: e.clientX - rect.left - (nodePositions[id]?.x || 0),
      offsetY: e.clientY - rect.top - (nodePositions[id]?.y || 0),
    });
    setDragMoved(false);
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!dragging || !canvasRef.current) return;
      setDragMoved(true);
      const rect = canvasRef.current.getBoundingClientRect();
      setNodePositions((prev) => ({
        ...prev,
        [dragging.id]: {
          x: e.clientX - rect.left - dragging.offsetX,
          y: e.clientY - rect.top - dragging.offsetY,
        },
      }));
    },
    [dragging]
  );

  const handleMouseUp = useCallback(() => setDragging(null), []);

  const addNode = (newNode) => {
    setNodes((prev) => [...prev, newNode]);
    setNodePositions((prev) => ({
      ...prev,
      [newNode.id]: {
        x: 100 + Math.random() * 500,
        y: 100 + Math.random() * 300,
      },
    }));
  };

  const removeNode = (id) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    toggleSelect(id, true); // force deselect
    setNodePositions((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0a0a0f",
        overflow: "hidden",
        position: "relative",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 24,
              fontWeight: 300,
              color: "#fff",
            }}
          >
            Rhizome
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              color: "#555",
              letterSpacing: "0.15em",
              marginTop: 2,
            }}
          >
            SPATIAL MEANING-MAKING ENGINE
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#4ECDC4",
              padding: "8px 14px",
              borderRadius: 6,
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: 11,
            }}
          >
            + ADD NODE
          </button>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              color: selected.size >= 2 ? "#4ECDC4" : "#444",
            }}
          >
            {selected.size} selected
          </span>
          <button
            onClick={onAnalyze}
            disabled={selected.size < 2}
            style={{
              background:
                selected.size >= 2
                  ? "linear-gradient(135deg, #4ECDC4, #34D399)"
                  : "rgba(255,255,255,0.04)",
              border: "none",
              color: selected.size >= 2 ? "#0a0a0f" : "#333",
              padding: "8px 20px",
              borderRadius: 6,
              cursor: selected.size >= 2 ? "pointer" : "not-allowed",
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.1em",
            }}
          >
            {selected.size < 2 ? "SELECT 2+" : "FIND MEANING →"}
          </button>
        </div>
      </div>

      {/* Add Node Form */}
      {showAddForm && (
        <AddNodeForm onAdd={addNode} onClose={() => setShowAddForm(false)} />
      )}

      {/* Help text */}
      {selected.size === 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "Georgia, serif",
            fontSize: 14,
            color: "#444",
            fontStyle: "italic",
            zIndex: 10,
            textAlign: "center",
          }}
        >
          Click fragments to select. Drag to arrange. Add your own. The
          selection is the prompt.
        </div>
      )}

      {/* Canvas nodes */}
      <div ref={canvasRef} style={{ position: "absolute", inset: 0 }}>
        {nodes.map((node) => {
          const isSel = selected.has(node.id);
          const pos = nodePositions[node.id] || { x: 100, y: 100 };
          return (
            <div
              key={node.id}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              onClick={() => {
                if (!dragMoved) toggleSelect(node.id);
              }}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                width: 220,
                padding: "14px 16px",
                background: isSel
                  ? "rgba(78,205,196,0.06)"
                  : "rgba(255,255,255,0.02)",
                border: `1px solid ${
                  isSel
                    ? "rgba(78,205,196,0.4)"
                    : "rgba(255,255,255,0.06)"
                }`,
                borderRadius: 8,
                cursor: dragging ? "grabbing" : "pointer",
                transition:
                  dragging?.id === node.id
                    ? "none"
                    : "border-color 0.3s, background 0.3s",
                boxShadow: isSel
                  ? "0 0 20px rgba(78,205,196,0.08)"
                  : "none",
                userSelect: "none",
                zIndex: dragging?.id === node.id ? 100 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSel)
                  e.currentTarget.style.borderColor =
                    "rgba(255,255,255,0.15)";
              }}
              onMouseLeave={(e) => {
                if (!isSel)
                  e.currentTarget.style.borderColor =
                    "rgba(255,255,255,0.06)";
              }}
            >
              {isSel && (
                <div
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#4ECDC4",
                    boxShadow: "0 0 8px rgba(78,205,196,0.6)",
                  }}
                />
              )}
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeNode(node.id);
                }}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 8,
                  background: "none",
                  border: "none",
                  color: "#333",
                  cursor: "pointer",
                  fontSize: 14,
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => (e.target.style.color = "#FF6B6B")}
                onMouseLeave={(e) => (e.target.style.color = "#333")}
              >
                x
              </button>
              <div
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: isSel ? "#4ECDC4" : "#ddd",
                  marginBottom: 4,
                  paddingRight: 16,
                }}
              >
                {node.label}
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 8,
                  color: isSel ? "rgba(78,205,196,0.4)" : "#444",
                  letterSpacing: "0.1em",
                  marginBottom: 6,
                }}
              >
                {node.source}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "#888",
                  lineHeight: 1.5,
                }}
              >
                {node.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
