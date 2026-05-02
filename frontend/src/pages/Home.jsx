import React, { useEffect, useRef } from 'react';
import styles from './Home.module.css';
import { useNavigate } from 'react-router-dom';

export default function Home({ onStart }) {
  const orbRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;

    let frame;
    let t = 0;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const animate = () => {
      t += 0.008;

      const scale = 1 + Math.sin(t) * 0.03;
      const translateY = Math.sin(t * 0.7) * 4;

      orb.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={styles.page}>
      {/* Background mesh */}
      <div className={styles.meshBg} aria-hidden="true" />
      <div className={styles.meshBg2} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoDot} />
          <span>voiceai</span>
        </div>

        <nav className={styles.nav}>
          <button
            className={styles.navLink}
            onClick={() => navigate('/research')}
          >
            research
          </button>

          <button
            className={styles.navLink}
            onClick={() => navigate('/docs')}
          >
            docs
          </button>

          <button
            className={styles.navLink}
            onClick={() => navigate('/blog')}
          >
            blog
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        <div className={styles.badge}>preview · silk v1</div>

        <div className={styles.orbWrap} ref={orbRef}>
          <div className={styles.orb}>
            <div className={styles.orbInner} />
            <div className={styles.orbRing1} />
            <div className={styles.orbRing2} />
          </div>
        </div>

        <h1 className={styles.headline}>
          building the<br />
          <em>most human</em><br />
          ai.
        </h1>

        <p className={styles.sub}>
          she pauses. she laughs. she remembers.<br />
          not a chatbot — a companion.
        </p>

        <button
          className={styles.cta}
          onClick={onStart}
          aria-label="Start conversation with Ira"
        >
          <span className={styles.ctaDot} />
          talk to ira
        </button>

        <div className={styles.traits}>
          <div className={styles.trait}>
            <span className={styles.traitNum}>01</span>
            <span className={styles.traitLabel}>voice / silk /</span>
            <span className={styles.traitDesc}>
              pauses, whispers, laughs, cries
            </span>
          </div>

          <div className={styles.trait}>
            <span className={styles.traitNum}>02</span>
            <span className={styles.traitLabel}>memory / mesh /</span>
            <span className={styles.traitDesc}>
              remembers what matters
            </span>
          </div>

          <div className={styles.trait}>
            <span className={styles.traitNum}>03</span>
            <span className={styles.traitLabel}>context / peek /</span>
            <span className={styles.traitDesc}>
              understands "i'm fine" in every tone
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
