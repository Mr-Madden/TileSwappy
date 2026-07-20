import { useEffect, useRef } from 'react';

export type ParticleBehavior = 'stars' | 'bubbles' | 'sand';

interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
}

interface Bubble {
  x: number;
  y: number;
  r: number;
  speed: number;
  wobble: number;
  wobbleAmt: number;
}

interface SandGrain {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
  driftAmt: number;
}

/**
 * Drives a small canvas particle field (twinkling stars, rising bubbles,
 * or drifting sand) for the animated theme backgrounds. The stars/bubbles
 * behaviors were ported from the theme-directions mockup artifact's draw
 * loops; sand follows the same pattern for Desert's blowing-dust effect.
 */
export function useCanvasParticles(behavior: ParticleBehavior) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const size = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
    };
    size();
    window.addEventListener('resize', size);

    let rafId = 0;

    if (behavior === 'stars') {
      const stars: Star[] = Array.from({ length: 110 }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.4 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.6 + 0.3,
      }));

      const draw = (t: number) => {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        stars.forEach((s) => {
          const tw = reduce ? 1 : 0.55 + 0.45 * Math.sin(t * 0.001 * s.speed + s.phase);
          ctx.globalAlpha = tw;
          ctx.fillStyle = '#eef2f7';
          ctx.beginPath();
          ctx.arc(s.x * w, s.y * h, s.r * devicePixelRatio, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        if (!reduce) rafId = requestAnimationFrame(draw);
      };
      rafId = requestAnimationFrame(draw);
    } else if (behavior === 'bubbles') {
      const bubbles: Bubble[] = Array.from({ length: 36 }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 2 + 0.6,
        speed: Math.random() * 0.00025 + 0.00008,
        wobble: Math.random() * Math.PI * 2,
        wobbleAmt: Math.random() * 0.015,
      }));

      const draw = (t: number) => {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(234,250,246,0.5)';
        bubbles.forEach((b) => {
          if (!reduce) {
            b.y -= b.speed * 16;
            if (b.y < -0.05) b.y = 1.05;
          }
          const x = b.x + (reduce ? 0 : Math.sin(t * 0.0006 + b.wobble) * b.wobbleAmt);
          ctx.beginPath();
          ctx.arc(x * w, b.y * h, b.r * devicePixelRatio, 0, Math.PI * 2);
          ctx.fill();
        });
        if (!reduce) rafId = requestAnimationFrame(draw);
      };
      rafId = requestAnimationFrame(draw);
    } else {
      const grains: SandGrain[] = Array.from({ length: 60 }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.5 + 0.4,
        speed: Math.random() * 0.00035 + 0.00015,
        drift: Math.random() * Math.PI * 2,
        driftAmt: Math.random() * 0.01 + 0.004,
      }));

      const draw = (t: number) => {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(122, 90, 55, 0.35)';
        grains.forEach((g) => {
          if (!reduce) {
            g.x += g.speed * 16;
            if (g.x > 1.05) g.x = -0.05;
          }
          const y = g.y + (reduce ? 0 : Math.sin(t * 0.0005 + g.drift) * g.driftAmt);
          ctx.beginPath();
          ctx.arc(g.x * w, y * h, g.r * devicePixelRatio, 0, Math.PI * 2);
          ctx.fill();
        });
        if (!reduce) rafId = requestAnimationFrame(draw);
      };
      rafId = requestAnimationFrame(draw);
    }

    return () => {
      window.removeEventListener('resize', size);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [behavior]);

  return canvasRef;
}
