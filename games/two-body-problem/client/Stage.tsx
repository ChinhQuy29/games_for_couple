import { useEffect, useRef } from 'react';
import { LEVELS, LH, LW, PHYS, moverAt, type Frame } from '../shared';

export interface Buffered {
  prev: Frame | null;
  last: Frame | null;
  at: number;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Draws one level on a canvas, interpolating the 30 Hz frames. */
export function Stage({ frames, level, walkerColor, jumperColor }: { frames: React.MutableRefObject<Buffered>; level: number; walkerColor: string; jumperColor: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const L = LEVELS[level]!;
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const c = canvas.current;
      const { prev, last, at } = frames.current;
      if (!c || !last) return;
      const ctx = c.getContext('2d')!;
      const dpr = window.devicePixelRatio || 1;
      const cw = c.clientWidth;
      const ch = c.clientHeight;
      if (c.width !== Math.round(cw * dpr)) {
        c.width = Math.round(cw * dpr);
        c.height = Math.round(ch * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const T = cw / LW;
      const k = prev ? Math.min(1, (performance.now() - at) / (1000 / 30)) : 1;
      const p = prev?.b ?? last.b;
      const bx = lerp(p[0], last.b[0], k);
      const by = lerp(p[1], last.b[1], k);
      const t = prev ? lerp(prev.t, last.t, k) : last.t;

      const g = ctx.createLinearGradient(0, 0, 0, ch);
      g.addColorStop(0, '#2b2140');
      g.addColorStop(1, '#4a3a6b');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cw, ch);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let ty = 0; ty < LH; ty++) {
        for (let tx = 0; tx < LW; tx++) {
          const tch = L.rows[ty]![tx]!;
          const x = tx * T;
          const y = ty * T;
          if (tch === '#') {
            ctx.fillStyle = '#ffc93c';
            ctx.fillRect(x, y, T + 0.5, T + 0.5);
            ctx.strokeStyle = 'rgba(43,33,64,0.25)';
            ctx.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);
          } else if (tch === '-') {
            ctx.fillStyle = '#4cc9f0';
            ctx.fillRect(x, y, T + 0.5, T * 0.28);
          } else if (tch === '^') {
            ctx.fillStyle = '#ff4f4f';
            for (let s = 0; s < 3; s++) {
              ctx.beginPath();
              ctx.moveTo(x + (s * T) / 3, y + T);
              ctx.lineTo(x + ((s + 0.5) * T) / 3, y + T * 0.3);
              ctx.lineTo(x + ((s + 1) * T) / 3, y + T);
              ctx.fill();
            }
          } else if (tch === 'D') {
            if (!last.key) {
              ctx.fillStyle = '#9b5de5';
              ctx.fillRect(x + T * 0.1, y, T * 0.8, T + 0.5);
              ctx.font = `${T * 0.55}px system-ui`;
              ctx.fillText('🔒', x + T / 2, y + T / 2);
            } else {
              ctx.strokeStyle = 'rgba(155,93,229,0.5)';
              ctx.setLineDash([4, 4]);
              ctx.strokeRect(x + T * 0.1, y, T * 0.8, T);
              ctx.setLineDash([]);
            }
          } else if (tch === 'H') {
            const open = last.gate > 0;
            ctx.fillStyle = open ? 'rgba(61,220,151,0.25)' : '#3ddc97';
            ctx.fillRect(x + T * 0.2, y, T * 0.6, T + 0.5);
          } else if (tch !== ' ') {
            const icon = tch === 'K' ? (last.key ? '' : '🔑') : tch === 'B' ? '🔘' : tch === '~' ? '⇄' : tch === 'G' ? '⭐' : '';
            if (icon) {
              ctx.font = `bold ${T * 0.8}px system-ui`;
              ctx.fillStyle = '#fff';
              ctx.fillText(icon, x + T / 2, y + T / 2 + (tch === 'G' ? Math.sin(t * 3) * T * 0.1 : 0));
            }
          }
        }
      }
      L.movers.forEach((_, i) => {
        const m = moverAt(L, i, t);
        ctx.fillStyle = '#ff4f8b';
        ctx.fillRect(m.x * T, m.y * T, m.w * T, T * 0.32);
      });

      // The shared body: walker's color below (legs), jumper's on top (spring).
      const x = bx * T;
      const y = by * T;
      const w = PHYS.w * T;
      const h = PHYS.h * T;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, T * 0.2);
      ctx.clip();
      ctx.fillStyle = jumperColor;
      ctx.fillRect(x, y, w, h / 2);
      ctx.fillStyle = walkerColor;
      ctx.fillRect(x, y + h / 2, w, h / 2);
      ctx.restore();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, T * 0.2);
      ctx.stroke();
      const left = (last.b[4] & 4) !== 0;
      ctx.fillStyle = '#fff';
      const ex = x + w * (left ? 0.32 : 0.68);
      ctx.beginPath();
      ctx.arc(ex - T * 0.08, y + h * 0.3, T * 0.07, 0, Math.PI * 2);
      ctx.arc(ex + T * 0.08, y + h * 0.3, T * 0.07, 0, Math.PI * 2);
      ctx.fill();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [frames, level, walkerColor, jumperColor]);

  return (
    <canvas
      ref={canvas}
      className="mx-auto block rounded-2xl border-[3px] border-line"
      style={{ width: `min(100%, calc((100dvh - 230px) * ${LW / LH}))`, aspectRatio: `${LW} / ${LH}` }}
    />
  );
}
