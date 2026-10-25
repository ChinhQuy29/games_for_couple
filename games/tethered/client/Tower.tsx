import { useEffect, useRef } from 'react';
import { PLAYER_COLORS } from '@gfc/kit/client';
import { CHAIN_LENGTH, CHECKPOINTS, LEVEL, LH, LW, MOVERS, PHYS, SUMMIT, moverAt, type Frame } from '../shared';

const VIEW_ROWS = 17;

interface Buffered {
  prev: Frame | null;
  last: Frame | null;
  at: number;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Draws the tower on a canvas at the screen's frame rate, interpolating the 30 Hz frames. */
export function Tower({ frames, mySlot, names }: { frames: React.MutableRefObject<Buffered>; mySlot: number; names: string[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const cam = useRef<number | null>(null);

  useEffect(() => {
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
      const bodies = last.b.map((b, i) => {
        const p = prev?.b[i] ?? b;
        return { x: lerp(p[0], b[0], k), y: lerp(p[1], b[1], k), flags: b[4], stamina: b[5] };
      });
      const t = prev ? lerp(prev.t, last.t, k) : last.t;

      // Camera follows the pair, smoothly.
      const midY = bodies.reduce((s, b) => s + b.y, 0) / Math.max(1, bodies.length);
      const want = Math.max(0, Math.min(LH - VIEW_ROWS, midY - VIEW_ROWS * 0.55));
      cam.current = cam.current === null ? want : lerp(cam.current, want, 0.12);
      const top = cam.current;
      const Y = (y: number) => (y - top) * T;

      // Sky: gets warmer as you climb.
      const height = 1 - top / (LH - VIEW_ROWS);
      const g = ctx.createLinearGradient(0, 0, 0, ch);
      g.addColorStop(0, `hsl(${215 - height * 190}, 65%, ${60 - height * 8}%)`);
      g.addColorStop(1, `hsl(${200 - height * 170}, 70%, ${78 - height * 10}%)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cw, ch);

      // Tiles.
      const gone = new Set(last.gone);
      const r0 = Math.max(0, Math.floor(top) - 1);
      const r1 = Math.min(LH - 1, Math.ceil(top + VIEW_ROWS) + 1);
      for (let ty = r0; ty <= r1; ty++) {
        const row = LEVEL[ty]!;
        for (let tx = 0; tx < LW; tx++) {
          const tch = row[tx]!;
          const x = tx * T;
          const y = Y(ty);
          if (tch === '#') {
            ctx.fillStyle = tx === 0 || tx === LW - 1 ? '#5a4e6e' : '#7a6a58';
            ctx.fillRect(x, y, T + 0.5, T + 0.5);
            if (ty > 0 && LEVEL[ty - 1]![tx] === ' ' && tx > 0 && tx < LW - 1) {
              ctx.fillStyle = '#5fd17a';
              ctx.fillRect(x, y, T + 0.5, T * 0.22);
            }
          } else if (tch === '-') {
            ctx.fillStyle = '#c98b4f';
            ctx.fillRect(x, y, T + 0.5, T * 0.28);
            ctx.fillStyle = '#8a5a2e';
            ctx.fillRect(x, y + T * 0.28, T + 0.5, T * 0.08);
          } else if (tch === 'x' && !gone.has(ty * LW + tx)) {
            ctx.fillStyle = '#b9a58c';
            ctx.fillRect(x, y, T + 0.5, T + 0.5);
            ctx.strokeStyle = '#6b5a45';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + T * 0.2, y + T * 0.1);
            ctx.lineTo(x + T * 0.5, y + T * 0.5);
            ctx.lineTo(x + T * 0.35, y + T * 0.9);
            ctx.moveTo(x + T * 0.5, y + T * 0.5);
            ctx.lineTo(x + T * 0.85, y + T * 0.6);
            ctx.stroke();
          } else if (tch === '^') {
            ctx.fillStyle = '#d8d8e0';
            for (let s = 0; s < 3; s++) {
              ctx.beginPath();
              ctx.moveTo(x + (s * T) / 3, y + T);
              ctx.lineTo(x + ((s + 0.5) * T) / 3, y + T * 0.25);
              ctx.lineTo(x + ((s + 1) * T) / 3, y + T);
              ctx.fill();
            }
          }
        }
      }

      // Moving platforms.
      for (let i = 0; i < MOVERS.length; i++) {
        const p = moverAt(i, t);
        ctx.fillStyle = '#4cc9f0';
        ctx.fillRect(p.x * T, Y(p.y), p.w * T, T * 0.32);
        ctx.fillStyle = '#2b2140';
        ctx.fillRect(p.x * T, Y(p.y) + T * 0.32, p.w * T, T * 0.06);
      }

      // Flags.
      ctx.font = `${T * 0.9}px system-ui`;
      ctx.textAlign = 'center';
      CHECKPOINTS.forEach((c, i) => {
        if (i === 0) return;
        ctx.globalAlpha = i <= last.checkpoint ? 1 : 0.55;
        ctx.fillText(i <= last.checkpoint ? '🚩' : '🏳️', (c.flagX + 0.5) * T, Y(c.flagY + 0.85));
        ctx.globalAlpha = 1;
      });
      ctx.font = `${T * 1.3}px system-ui`;
      ctx.fillText('🏁', (SUMMIT.x + 0.5) * T, Y(SUMMIT.y + 0.95));

      // The chain: sags when slack, goes red when taut.
      if (bodies.length === 2) {
        const [a, b] = bodies as [(typeof bodies)[0], (typeof bodies)[0]];
        const ax = (a.x + PHYS.w / 2) * T;
        const ay = Y(a.y + PHYS.h / 2);
        const bx = (b.x + PHYS.w / 2) * T;
        const by = Y(b.y + PHYS.h / 2);
        const d = Math.hypot(bx - ax, by - ay) / T;
        const slack = Math.max(0, CHAIN_LENGTH - d);
        ctx.strokeStyle = slack < 0.15 ? '#ff4f4f' : '#3a3346';
        ctx.lineWidth = Math.max(2, T * 0.12);
        ctx.setLineDash([T * 0.18, T * 0.1]);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + slack * T * 0.8, bx, by);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Climbers.
      bodies.forEach((b, i) => {
        const x = b.x * T;
        const y = Y(b.y);
        const w = PHYS.w * T;
        const h = PHYS.h * T;
        const left = (b.flags & 4) !== 0;
        ctx.fillStyle = PLAYER_COLORS[i] ?? '#fff';
        ctx.strokeStyle = '#2b2140';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, T * 0.2);
        ctx.fill();
        ctx.stroke();
        // Eyes look where you're going.
        ctx.fillStyle = '#fff';
        const ex = x + w * (left ? 0.3 : 0.7);
        ctx.beginPath();
        ctx.arc(ex - T * 0.09, y + h * 0.35, T * 0.08, 0, Math.PI * 2);
        ctx.arc(ex + T * 0.09, y + h * 0.35, T * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2b2140';
        ctx.beginPath();
        ctx.arc(ex - T * 0.07 * (left ? 1.3 : 0.7), y + h * 0.36, T * 0.04, 0, Math.PI * 2);
        ctx.arc(ex + T * 0.07 * (left ? 0.7 : 1.3), y + h * 0.36, T * 0.04, 0, Math.PI * 2);
        ctx.fill();
        if (b.flags & 1) {
          ctx.font = `${T * 0.55}px system-ui`;
          ctx.fillText('✊', x + w / 2, y + h + T * 0.15);
        }
        // Name and stamina.
        ctx.font = `bold ${Math.max(10, T * 0.36)}px system-ui`;
        ctx.fillStyle = i === mySlot ? '#2b2140' : 'rgba(43,33,64,0.7)';
        ctx.fillText(i === mySlot ? 'you' : (names[i] ?? ''), x + w / 2, y - T * 0.45);
        if (b.stamina < 100) {
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.fillRect(x - T * 0.1, y - T * 0.32, w + T * 0.2, T * 0.12);
          ctx.fillStyle = b.stamina > 30 ? '#ffc93c' : '#ff4f4f';
          ctx.fillRect(x - T * 0.1, y - T * 0.32, ((w + T * 0.2) * b.stamina) / 100, T * 0.12);
        }
      });
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [frames, mySlot, names]);

  return (
    <canvas
      ref={canvas}
      className="mx-auto block rounded-2xl border-[3px] border-line"
      style={{ width: `min(100%, calc((100dvh - 200px) * ${LW / VIEW_ROWS}))`, aspectRatio: `${LW} / ${VIEW_ROWS}` }}
    />
  );
}

export type { Buffered };
