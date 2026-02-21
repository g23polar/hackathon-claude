interface TitleBarProps {
  showBackButton: boolean;
  onBackToCanvas: () => void;
}

export default function TitleBar({ showBackButton, onBackToCanvas }: TitleBarProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.25rem',
        zIndex: 50,
        background: 'linear-gradient(to bottom, rgba(10,10,10,0.9) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', pointerEvents: 'auto' }}>
        {showBackButton && (
          <button
            onClick={onBackToCanvas}
            style={{
              padding: '0.4rem 0.75rem',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              color: '#a3a3a3',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              transition: 'all 0.2s ease',
            }}
          >
            &larr; Canvas
          </button>
        )}
        <h1
          style={{
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#737373',
          }}
        >
          Constellation
        </h1>
      </div>
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '0.65rem',
          color: '#404040',
          letterSpacing: '0.05em',
          pointerEvents: 'auto',
        }}
      >
        Semantic Fragment Graph
      </span>
    </div>
  );
}
