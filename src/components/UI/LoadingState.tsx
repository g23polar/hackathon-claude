import { useState, useEffect } from 'react';
import type { Fragment } from '../../types';
import NetworkAnimation from './NetworkAnimation';

const LOADING_MESSAGES = [
  'Mapping semantic topology...',
  'Tracing resonance patterns...',
  'Detecting tensions...',
  'Following genealogies...',
  'Discovering metaphoric bridges...',
  'Summoning ghost nodes...',
  'Mapping the constellation...',
];

interface Props {
  fragments?: Fragment[];
}

export default function LoadingState({ fragments = [] }: Props) {
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
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Network formation animation */}
      {fragments.length >= 2 && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <NetworkAnimation fragments={fragments} />
        </div>
      )}

      {/* Status text overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: '8vh',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            background: 'radial-gradient(ellipse at center, rgba(10,10,10,0.85) 0%, transparent 70%)',
            padding: '1.5rem 3rem',
            borderRadius: '12px',
          }}
        >
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
      </div>
    </div>
  );
}
