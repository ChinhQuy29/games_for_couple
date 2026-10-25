import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { Drawing } from '../../shared';
import { clearCanvas, fitCanvas, pointCount, renderStrokes } from '../lib/draw';

// Drawings that already replayed on this device, so re-renders don't replay them.
const replayed = new Set<string>();

const REPLAY_MS = 2200;

interface Props {
  drawing: Drawing;
  /** When set, the drawing replays stroke by stroke the first time this id is shown. */
  replayId?: string;
  className?: string;
}

export default function DrawingView({ drawing, replayId, className = '' }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext('2d')!;
    const total = pointCount(drawing.strokes);
    const draw = (limit = Infinity) => {
      const px = fitCanvas(el);
      clearCanvas(ctx, px);
      renderStrokes(ctx, drawing.strokes, px, limit);
    };

    const ro = new ResizeObserver(() => draw());
    ro.observe(el);

    if (!replayId || reduce || replayed.has(replayId) || total === 0) {
      draw();
      return () => ro.disconnect();
    }
    replayed.add(replayId);
    let frame = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const progress = Math.min(1, (t - start) / REPLAY_MS);
      draw(Math.ceil(total * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [drawing, replayId, reduce]);

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvas} className="aspect-square w-full rounded-3xl border-[3px] border-line bg-white" aria-label="A drawing" />
      {drawing.strokes.length === 0 && (
        <p className="absolute inset-0 flex items-center justify-center p-4 text-center font-display text-xl font-bold text-[#2b2140]/50">
          (an empty page. A bold artistic choice.)
        </p>
      )}
    </div>
  );
}
