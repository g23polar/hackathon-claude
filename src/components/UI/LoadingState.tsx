import { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
  'Mapping semantic topology...',
  'Tracing resonance patterns...',
  'Detecting tensions...',
  'Following genealogies...',
  'Discovering metaphoric bridges...',
  'Summoning ghost nodes...',
  'Weaving the rhizome...',
];

export default function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(messageInterval);
  }, []);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 400);
    return () => clearInterval(dotInterval);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: '2rem',
      }}
    >
      {/* Pulsing ring */}
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          border: '2px solid rgba(139, 92, 246, 0.3)',
          borderTopColor: '#7C3AED',
          animation: 'spin 1.2s linear infinite',
        }}
      />

      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontFamily: 'monospace',
            fontSize: '1rem',
            color: '#a3a3a3',
            minWidth: '300px',
          }}
        >
          {LOADING_MESSAGES[messageIndex]}
        </p>
        <p
          style={{
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            color: '#525252',
            marginTop: '0.5rem',
          }}
        >
          {'.'.repeat(dotCount)}
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
