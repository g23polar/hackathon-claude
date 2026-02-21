export default function AnalyzingScreen({ progress, phase, error }) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0a0a0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: "Georgia, serif",
          fontSize: 26,
          color: "#fff",
          marginBottom: 28,
          fontWeight: 300,
        }}
      >
        Finding meaning between things
      </div>

      <div
        style={{
          width: 280,
          height: 2,
          background: "rgba(255,255,255,0.06)",
          borderRadius: 1,
          overflow: "hidden",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            height: "100%",
            background: "linear-gradient(90deg, #4ECDC4, #C4B5FD)",
            width: `${progress}%`,
            transition: "width 0.4s ease-out",
          }}
        />
      </div>

      <div
        style={{
          fontFamily: "monospace",
          fontSize: 11,
          color: "#4ECDC4",
          opacity: 0.7,
        }}
      >
        {phase}
      </div>

      {error && (
        <div
          style={{
            marginTop: 16,
            fontFamily: "monospace",
            fontSize: 11,
            color: "#FF6B6B",
            maxWidth: 400,
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
