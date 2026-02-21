import { useEffect, useRef, useMemo } from 'react';
import { tsParticles } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';

const CONTAINER_ID = 'constellation-bg';

export default function ConstellationBg() {
  const containerRef = useRef<HTMLDivElement>(null);

  const options = useMemo(
    () => ({
      background: { color: '#0a0a0a' },
      fpsLimit: 60,
      particles: {
        number: { value: 80, density: { enable: true, value_area: 800 } },
        color: { value: '#ffffff' },
        shape: { type: 'circle' as const },
        opacity: {
          value: { min: 0.3, max: 0.6 },
          animation: { enable: true, speed: 0.5, minimumValue: 0.1, sync: false },
        },
        size: {
          value: { min: 2.5, max: 3 },
          animation: { enable: true, speed: 2, minimumValue: 1, sync: false },
        },
        links: {
          enable: true,
          distance: 180,
          color: '#00BFFF',
          opacity: 0.2,
          width: 1,
        },
        move: {
          enable: true,
          speed: 1,
          direction: 'none' as const,
          random: true,
          straight: false,
          outModes: { default: 'out' as const },
        },
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: ['bubble', 'grab'] },
          onClick: { enable: false },
          resize: { enable: true },
        },
        modes: {
          grab: { distance: 150, links: { opacity: 0.2, color: '#00BFFF' } },
          bubble: { distance: 100, size: 6, opacity: 0.8, duration: 2, color: '#00BFFF' },
        },
      },
      detectRetina: true,
    }),
    []
  );

  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;

    const init = async () => {
      await loadSlim(tsParticles);
      if (destroyed) return;
      await tsParticles.load({
        id: CONTAINER_ID,
        element: containerRef.current!,
        options,
      });
    };

    init().catch(console.error);

    return () => {
      destroyed = true;
      const c = tsParticles.dom().find((x) => String(x.id) === CONTAINER_ID);
      if (c) c.destroy();
    };
  }, [options]);

  return (
    <div
      id={CONTAINER_ID}
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'auto',
      }}
    />
  );
}
