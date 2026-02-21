import { useState } from "react";

export default function AddNodeForm({ onAdd, onClose }) {
  const [label, setLabel] = useState("");
  const [content, setContent] = useState("");

  const handleAdd = () => {
    if (!label.trim()) return;
    onAdd({
      id: "node_" + Date.now(),
      label: label.trim(),
      content: content.trim() || label.trim(),
      source: "Added live",
    });
    setLabel("");
    setContent("");
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.metaKey) handleAdd();
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        right: 20,
        zIndex: 30,
        background: "rgba(20,20,25,0.95)",
        border: "1px solid rgba(78,205,196,0.3)",
        borderRadius: 10,
        padding: 18,
        width: 280,
        backdropFilter: "blur(20px)",
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 10,
          color: "#4ECDC4",
          marginBottom: 10,
          letterSpacing: "0.1em",
        }}
      >
        NEW FRAGMENT
      </div>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Title (e.g. 'The Club Sandwich')"
        autoFocus
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff",
          padding: "8px 10px",
          borderRadius: 4,
          fontFamily: "Georgia, serif",
          fontSize: 13,
          marginBottom: 8,
          boxSizing: "border-box",
          outline: "none",
        }}
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Content — what's the idea?"
        rows={3}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff",
          padding: "8px 10px",
          borderRadius: 4,
          fontSize: 12,
          marginBottom: 10,
          resize: "vertical",
          boxSizing: "border-box",
          outline: "none",
        }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleAdd}
          style={{
            flex: 1,
            background: "#4ECDC4",
            border: "none",
            color: "#0a0a0f",
            padding: "7px",
            borderRadius: 4,
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          ADD
        </button>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#888",
            padding: "7px",
            borderRadius: 4,
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: 11,
          }}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
