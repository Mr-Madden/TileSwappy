import { useEffect, useRef } from 'react';

export type ParticleBehavior = 'stars' | 'bubbles' | 'sand' | 'snow' | 'rain';

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

interface Snowflake {
  x: number;
  y: number;
  r: number;
  speed: number;
  wobble: number;
  wobbleAmt: number;
  twinklePhase: number;
}

interface RainDrop {
  x: number;
  y: number;
  len: number;
  speed: number;
}

/**
 * Drives a small canvas particle field (twinkling stars, rising bubbles,
 * drifting sand, or falling snow) for the animated theme backgrounds. The
 * stars/bubbles behaviors were ported from the theme-directions mockup
 * artifact's draw loops; sand and snow follow the same pattern for
 * Desert's blowing-dust and Ice's snowfall effects.
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
    } else if (behavior === 'sand') {
      const grains: SandGrain[] = Array.from({ length: 150 }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.6 + 0.4,
        speed: Math.random() * 0.0007 + 0.0003,
        drift: Math.random() * Math.PI * 2,
        driftAmt: Math.random() * 0.01 + 0.004,
      }));

      const draw = (t: number) => {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(122, 90, 55, 0.45)';
        ctx.strokeStyle = 'rgba(122, 90, 55, 0.3)';
        ctx.lineWidth = devicePixelRatio;
        grains.forEach((g) => {
          if (!reduce) {
            g.x += g.speed * 16;
            if (g.x > 1.05) g.x = -0.05;
          }
          const y = g.y + (reduce ? 0 : Math.sin(t * 0.0005 + g.drift) * g.driftAmt);
          const x = g.x * w;
          const py = y * h;
          // Faster grains get a short trailing streak instead of a dot --
          // reads as motion-blurred dust rather than static specks, which
          // is what actually makes blowing sand look like it's blowing.
          if (!reduce && g.speed > 0.0006) {
            const trail = g.speed * 16 * 14 * devicePixelRatio;
            ctx.beginPath();
            ctx.moveTo(x - trail, py);
            ctx.lineTo(x, py);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(x, py, g.r * devicePixelRatio, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        if (!reduce) rafId = requestAnimationFrame(draw);
      };
      rafId = requestAnimationFrame(draw);
    } else if (behavior === 'snow') {
      const flakes: Snowflake[] = Array.from({ length: 90 }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 2.4 + 0.6,
        speed: Math.random() * 0.00035 + 0.00012,
        wobble: Math.random() * Math.PI * 2,
        wobbleAmt: Math.random() * 0.02 + 0.006,
        twinklePhase: Math.random() * Math.PI * 2,
      }));

      const draw = (t: number) => {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        flakes.forEach((f) => {
          if (!reduce) {
            f.y += f.speed * 16;
            if (f.y > 1.05) f.y = -0.05;
          }
          const x = (f.x + (reduce ? 0 : Math.sin(t * 0.0005 + f.wobble) * f.wobbleAmt)) * w;
          const y = f.y * h;
          const twinkle = reduce ? 0.85 : 0.6 + 0.4 * Math.sin(t * 0.002 + f.twinklePhase);
          ctx.globalAlpha = twinkle;
          ctx.fillStyle = ctx.strokeStyle = 'rgba(224, 245, 255, 0.95)';
          // The handful of bigger flakes sparkle as a tiny plus-shaped
          // glint instead of a plain dot -- reads as catching the light,
          // which is what makes falling snow feel worth watching.
          if (f.r > 2) {
            const s = f.r * devicePixelRatio * 1.7;
            ctx.lineWidth = devicePixelRatio;
            ctx.beginPath();
            ctx.moveTo(x - s, y);
            ctx.lineTo(x + s, y);
            ctx.moveTo(x, y - s);
            ctx.lineTo(x, y + s);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(x, y, f.r * devicePixelRatio, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.globalAlpha = 1;
        if (!reduce) rafId = requestAnimationFrame(draw);
      };
      rafId = requestAnimationFrame(draw);
    } else {
      // Rain: fast diagonal streaks rather than dots, wrapping back to
      // a random x once they fall past the bottom edge.
      const drops: RainDrop[] = Array.from({ length: 110 }, () => ({
        x: Math.random(),
        y: Math.random(),
        len: Math.random() * 16 + 10,
        speed: Math.random() * 0.9 + 0.6,
      }));

      const draw = () => {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(200, 215, 230, 0.55)';
        ctx.lineWidth = devicePixelRatio;
        drops.forEach((d) => {
          if (!reduce) {
            d.y += d.speed * 0.018;
            d.x += d.speed * 0.005;
            if (d.y > 1.05) {
              d.y = -0.05;
              d.x = Math.random();
            }
          }
          const x = d.x * w;
          const y = d.y * h;
          const len = d.len * devicePixelRatio;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - len * 0.35, y - len);
          ctx.stroke();
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
