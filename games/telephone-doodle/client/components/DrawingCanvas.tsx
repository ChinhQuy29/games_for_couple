import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { BRUSHES, CANVAS_UNITS, COLORS, LIMITS, type ChaosId, type Stroke } from '../../shared';
import { clearCanvas, fitCanvas, pointCount, renderStrokes } from '../lib/draw';

const COPY = {
  blind: '🙈 Drawing blind… trust yourself',
  out: (n: number) => `That's your ${n === 1 ? 'one stroke' : `${n} strokes`}. Hit send!`,
  undo: '↩️ Undo',
  clear: '🗑️ Clear',
};

const SHAKE = 14; // grid units of wobble for the "shaky hands" rule
const MIN_STEP = 4; // skip points closer than this, to keep drawings small

interface Props {
  strokes: Stroke[];
  onChange: (strokes: Stroke[]) => void;
  chaos: ChaosId | null;
  disabled?: boolean;
}

/** Square drawing pad. Records strokes on the shared 1000×1000 grid and applies chaos rules as you draw. */
export default function DrawingCanvas({ strokes, onChange, chaos, disabled }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef<Stroke | null>(null);
  const [color, setColor] = useState(0);
  const [brush, setBrush] = useState(1);

  const blind = chaos === 'blind';
  const strokeCap = chaos === 'one-stroke' ? 1 : chaos === 'five-strokes' ? 5 : LIMITS.maxStrokes;
  const outOfStrokes = strokes.length >= strokeCap;
  const lockedColor = chaos === 'one-color';
  const lockedBrush = chaos === 'tiny';
  const activeColor = lockedColor ? 0 : color;
  const activeBrush = lockedBrush ? 0 : brush;

  // Redraw everything whenever the committed strokes change (or the canvas resizes).
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const redraw = () => {
      const px = fitCanvas(el);
      const ctx = el.getContext('2d')!;
      clearCanvas(ctx, px);
      if (!blind) renderStrokes(ctx, strokes, px);
    };
    redraw();
    const ro = new ResizeObserver(redraw);
    ro.observe(el);
    return () => ro.disconnect();
  }, [strokes, blind]);

  function toUnits(e: PointerEvent<HTMLCanvasElement>): [number, number] {
    const r = e.currentTarget.getBoundingClientRect();
    let x = ((e.clientX - r.left) / r.width) * CANVAS_UNITS;
    let y = ((e.clientY - r.top) / r.height) * CANVAS_UNITS;
    if (chaos === 'mirror') x = CANVAS_UNITS - x;
    if (chaos === 'shaky') {
      x += (Math.random() - 0.5) * 2 * SHAKE;
      y += (Math.random() - 0.5) * 2 * SHAKE;
    }
    const clamp = (v: number) => Math.max(0, Math.min(CANVAS_UNITS, Math.round(v)));
    return [clamp(x), clamp(y)];
  }

  function paintLive() {
    const el = canvas.current;
    const s = live.current;
    if (!el || !s || blind) return;
    const px = el.width;
    renderStrokes(el.getContext('2d')!, [{ ...s, p: s.p.slice(-4) }], px);
  }

  function onDown(e: PointerEvent<HTMLCanvasElement>) {
    if (disabled || outOfStrokes || pointCount(strokes) >= LIMITS.maxPoints) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const [x, y] = toUnits(e);
    live.current = { c: activeColor, w: activeBrush, p: [x, y] };
    paintLive();
  }

  function onMove(e: PointerEvent<HTMLCanvasElement>) {
    const s = live.current;
    if (!s) return;
    const [x, y] = toUnits(e);
    const lx = s.p[s.p.length - 2]!;
    const ly = s.p[s.p.length - 1]!;
    if (Math.hypot(x - lx, y - ly) < MIN_STEP && chaos !== 'shaky') return;
    if (pointCount(strokes) + s.p.length / 2 >= LIMITS.maxPoints) return onUp();
    s.p.push(x, y);
    paintLive();
  }

  function onUp() {
    const s = live.current;
    live.current = null;
    if (s) onChange([...strokes, s]);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <canvas
          ref={canvas}
          className={`aspect-square w-full touch-none rounded-3xl border-[3px] border-line bg-white shadow-[4px_4px_0_var(--line)] ${disabled || outOfStrokes ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          aria-label="Drawing pad"
        />
        {blind && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-2xl font-extrabold text-[#2b2140]/40">
            {COPY.blind} ({strokes.length})
          </p>
        )}
        {outOfStrokes && strokeCap < LIMITS.maxStrokes && (
          <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center font-display font-bold text-[#2b2140]/60">
            {COPY.out(strokeCap)}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!lockedColor &&
          COLORS.map((c, i) => (
            <button
              key={c}
              type="button"
              aria-label={i === 7 ? 'White (eraser)' : `Color ${i + 1}`}
              aria-pressed={activeColor === i}
              onClick={() => setColor(i)}
              className={`h-9 w-9 rounded-full border-[3px] border-line transition-transform ${activeColor === i ? 'scale-125' : ''}`}
              style={{ background: c }}
            />
          ))}
        <span className="mx-1 h-8 w-[3px] rounded bg-muted" aria-hidden />
        {!lockedBrush &&
          BRUSHES.map((b, i) => (
            <button
              key={b}
              type="button"
              aria-label={`Brush size ${i + 1}`}
              aria-pressed={activeBrush === i}
              onClick={() => setBrush(i)}
              className="chip flex !h-10 !w-10 items-center justify-center !p-0"
            >
              <span className="rounded-full bg-ink" style={{ width: 4 + i * 6, height: 4 + i * 6 }} />
            </button>
          ))}
        <div className="ml-auto flex gap-2">
          <button type="button" className="chip text-sm" disabled={disabled || strokes.length === 0} onClick={() => onChange(strokes.slice(0, -1))}>
            {COPY.undo}
          </button>
          <button type="button" className="chip text-sm" disabled={disabled || strokes.length === 0} onClick={() => onChange([])}>
            {COPY.clear}
          </button>
        </div>
      </div>
    </div>
  );
}
