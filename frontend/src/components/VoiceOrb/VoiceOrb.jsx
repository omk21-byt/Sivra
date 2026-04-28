import React, { useEffect, useRef } from 'react';
import styles from './VoiceOrb.module.css';

// mode: 'idle' | 'listening' | 'thinking' | 'speaking'
export default function VoiceOrb({ mode = 'idle', onClick }) {
  const orbRef = useRef(null);

  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;

    let frame;
    let t = 0;

    const speeds = { idle: 0.006, listening: 0.025, thinking: 0.015, speaking: 0.02 };

    const animate = () => {
      t += speeds[mode] || 0.006;
      const scale = 1 + Math.sin(t) * (mode === 'listening' ? 0.08 : 0.03);
      const y = Math.sin(t * 0.7) * (mode === 'idle' ? 5 : 2);
      orb.style.transform = `scale(${scale}) translateY(${y}px)`;
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [mode]);

  return (
    <div
      className={`${styles.wrap} ${styles[mode]}`}
      onClick={onClick}
      role="button"
      aria-label={mode === 'idle' ? 'Start talking' : 'Stop'}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {/* Outer rings */}
      <div className={styles.ring1} />
      <div className={styles.ring2} />
      <div className={styles.ring3} />

      {/* Orb */}
      <div className={styles.orb} ref={orbRef}>
        <div className={styles.orbInner} />
        {mode === 'listening' && <WaveBars />}
        {mode === 'speaking' && <WaveBars speaking />}
      </div>

      {/* Label */}
      <div className={styles.label}>
        {mode === 'idle' && 'tap to talk'}
        {mode === 'listening' && 'listening...'}
        {mode === 'thinking' && 'thinking...'}
        {mode === 'speaking' && 'ira is speaking'}
      </div>
    </div>
  );
}

function WaveBars({ speaking }) {
  const delays = [0, 0.1, 0.2, 0.1, 0];
  return (
    <div className={styles.waveBars}>
      {delays.map((d, i) => (
        <div
          key={i}
          className={styles.waveBar}
          style={{
            animationDelay: `${d}s`,
            animationDuration: speaking ? '0.6s' : '0.8s',
          }}
        />
      ))}
    </div>
  );
}
