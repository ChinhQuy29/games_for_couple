import { BRUSHES, CANVAS_UNITS, COLORS, type Stroke } from '../../shared';

/** Sizes the canvas backing store to its CSS size × devicePixelRatio. Returns the pixel width. */
export function fitCanvas(canvas: HTMLCanvasElement): number {
  const dpr = window.devicePixelRatio || 1;
  const px = Math.max(1, Math.round(canvas.clientWidth * dpr));
  if (canvas.width !== px || canvas.height !== px) {
    canvas.width = px;
    canvas.height = px;
  }
  return px;
}

export function clearCanvas(ctx: CanvasRenderingContext2D, px: number): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, px, px);
}

/** Draws strokes onto a px×px canvas. `pointLimit` draws only the first N points (for replays). */
export function renderStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[], px: number, pointLimit = Infinity): void {
  const k = px / CANVAS_UNITS;
  let budget = pointLimit;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of strokes) {
    if (budget <= 0) break;
    const n = Math.min(s.p.length / 2, budget);
    budget -= n;
    ctx.strokeStyle = COLORS[s.c] ?? COLORS[0];
    ctx.fillStyle = ctx.strokeStyle;
    const width = (BRUSHES[s.w] ?? BRUSHES[0]) * k * 2.5;
    ctx.lineWidth = width;
    if (n === 1) {
      ctx.beginPath();
      ctx.arc(s.p[0]! * k, s.p[1]! * k, width / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(s.p[0]! * k, s.p[1]! * k);
    for (let i = 1; i < n; i++) ctx.lineTo(s.p[i * 2]! * k, s.p[i * 2 + 1]! * k);
    ctx.stroke();
  }
}

export const pointCount = (strokes: Stroke[]) => strokes.reduce((n, s) => n + s.p.length / 2, 0);
