/**
 * Confetti, on a canvas.
 *
 * A canvas rather than a few hundred animated DOM nodes: the same burst as
 * elements means the browser laying out and compositing hundreds of boxes on
 * a phone at the exact moment the pop-up is also animating in, which is where
 * the frame drops come from. One canvas draws them all in a single pass.
 *
 * It renders nothing at all when the viewer has asked for reduced motion.
 */

import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/celebrate';

interface ConfettiProps {
  /** Restarts the burst whenever this changes. */
  fireKey: number | string;
  /** Roughly how many pieces. Scaled down on small screens. */
  count?: number;
  duration?: number;
}

const COLORS = ['#D9B310', '#0EA5D6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

interface Piece {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  rot: number; vr: number;
  color: string;
  /** Flat ribbons tumble; that is the difference from falling squares. */
  tilt: number;
}

export function Confetti({ fireKey, count = 140, duration = 2600 }: ConfettiProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const n = Math.round(count * Math.min(1, w / 420));
    const pieces: Piece[] = Array.from({ length: n }, () => ({
      // Start just above the top edge, spread across the width, so the burst
      // reads as raining down over the whole screen rather than erupting
      // from one point.
      x: Math.random() * w,
      y: -20 - Math.random() * h * 0.5,
      vx: (Math.random() - 0.5) * 1.6,
      vy: 1.6 + Math.random() * 2.6,
      size: 5 + Math.random() * 6,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.22,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      tilt: Math.random() * Math.PI * 2,
    }));

    const start = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const elapsed = now - start;
      const life = elapsed / duration;
      ctx.clearRect(0, 0, w, h);

      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.035;           // gravity
        p.vx += Math.sin(p.y / 40) * 0.012;  // drift, so they do not fall straight
        p.rot += p.vr;
        p.tilt += 0.12;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = life > 0.75 ? Math.max(0, 1 - (life - 0.75) / 0.25) : 1;
        ctx.fillStyle = p.color;
        // Scaling the height by cos(tilt) is the tumble: the ribbon turns
        // edge-on and briefly disappears, the way real confetti does.
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * Math.abs(Math.cos(p.tilt)));
        ctx.restore();
      }

      if (elapsed < duration) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [fireKey, count, duration]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[200] w-full h-full"
    />
  );
}
