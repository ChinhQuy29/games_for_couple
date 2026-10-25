import { useEffect, useRef } from 'react';
import { LEVELS, LH, LW, PHYS, levelTheme, moverAt, type Frame, type Theme } from '../shared';
import { preloadSprites, sprite } from './sprites';

export interface Buffered {
  prev: Frame | null;
  last: Frame | null;
  at: number;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const BACKGROUND: Record<Theme, string | null> = {
  grass: 'backgrounds/background_color_hills',
  snow: null,
  sand: 'backgrounds/background_color_desert',
  purple: 'backgrounds/background_color_mushrooms',
  stone: 'backgrounds/background_color_trees',
};
const SKY: Record<Theme, [string, string]> = {
  grass: ['#8fd3ff', '#e7f7ff'],
  snow: ['#a9c7e8', '#f2f7ff'],
  sand: ['#ffcf8f', '#fff1d6'],
  purple: ['#5b3a8c', '#c9a7ff'],
  stone: ['#55607a', '#c4cbe0'],
};
const DECOR: Record<Theme, string[]> = {
  grass: ['bush', 'grass', 'mushroom_red', 'fence'],
  snow: ['snow', 'rock'],
  sand: ['cactus', 'rock', 'grass'],
  purple: ['grass_purple', 'mushroom_red'],
  stone: ['rock', 'bush'],
};

/** A stable pseudo-random number per tile, for decorations. */
const hash = (x: number, y: number) => {
  let h = (x * 374761393 + y * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** Draws one level on a canvas, interpolating the 30 Hz frames. */
export function Stage({ frames, level, walkerColor, jumperColor }: { frames: React.MutableRefObject<Buffered>; level: number; walkerColor: string; jumperColor: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => preloadSprites(), []);
  useEffect(() => {
    const L = LEVELS[level]!;
    const theme = levelTheme(level);
    const at = (x: number, y: number) => L.rows[y]?.[x] ?? '#';
    const solid = (x: number, y: number) => at(x, y) === '#';
    const tile = (name: string) => sprite(`tiles/${name}`);
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const c = canvas.current;
      const { prev, last, at: arrived } = frames.current;
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
      const k = prev ? Math.min(1, (performance.now() - arrived) / (1000 / 30)) : 1;
      const p = prev?.b ?? last.b;
      const bx = lerp(p[0], last.b[0], k);
      const by = lerp(p[1], last.b[1], k);
      const t = prev ? lerp(prev.t, last.t, k) : last.t;
      const draw1 = (img: HTMLImageElement | null, x: number, y: number, w = T, h = T) => img && ctx.drawImage(img, x, y, w + 0.5, h + 0.5);

      // Sky, the backdrop and drifting clouds.
      const [top, bottom] = SKY[theme];
      const g = ctx.createLinearGradient(0, 0, 0, ch);
      g.addColorStop(0, top);
      g.addColorStop(1, bottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cw, ch);
      const bgName = BACKGROUND[theme];
      const bg = bgName ? sprite(bgName) : null;
      if (bg) {
        ctx.globalAlpha = 0.55;
        for (let x = 0; x < cw; x += ch) ctx.drawImage(bg, x, 0, ch, ch);
        ctx.globalAlpha = 1;
      }
      const clouds = sprite('backgrounds/background_clouds');
      if (clouds) {
        const size = ch * 0.9;
        ctx.globalAlpha = theme === 'snow' ? 0.85 : 0.5;
        for (let x = -((t * 6) % size); x < cw; x += size) ctx.drawImage(clouds, x, -size * 0.3, size, size);
        ctx.globalAlpha = 1;
      }

      for (let ty = 0; ty < LH; ty++) {
        for (let tx = 0; tx < LW; tx++) {
          const tch = L.rows[ty]![tx]!;
          const x = tx * T;
          const y = ty * T;
          if (tch === '#') {
            const wall = tx === 0 || tx === LW - 1 || ty === 0;
            draw1(tile(wall ? 'terrain_stone_block_center' : solid(tx, ty - 1) ? `terrain_${theme}_block_center` : `terrain_${theme}_block_top`), x, y);
            if (!wall && at(tx, ty - 1) === ' ' && hash(tx, ty) < 0.18) {
              const pool = DECOR[theme];
              draw1(tile(pool[Math.floor(hash(ty, tx) * pool.length)]!), x, y - T);
            }
          } else if (tch === '-') {
            const l = at(tx - 1, ty) === '-';
            const r = at(tx + 1, ty) === '-';
            draw1(tile(`terrain_${theme}_horizontal_${l && r ? 'middle' : l ? 'right' : r ? 'left' : 'middle'}`), x, y);
          } else if (tch === '^') {
            draw1(tile('spikes'), x, y);
          } else if (tch === 'D') {
            if (!last.key) draw1(tile('lock_yellow'), x, y);
            else {
              ctx.globalAlpha = 0.2;
              draw1(tile('lock_yellow'), x, y);
              ctx.globalAlpha = 1;
            }
          } else if (tch === 'H') {
            const open = last.gate > 0;
            ctx.globalAlpha = open ? 0.25 : 1;
            draw1(tile(open ? 'block_exclamation_active' : 'block_exclamation'), x, y);
            ctx.globalAlpha = 1;
          } else if (tch === 'K') {
            if (!last.key) draw1(tile('key_yellow'), x, y + Math.sin(t * 3) * T * 0.08);
          } else if (tch === 'B') {
            draw1(tile(last.gate > 0 ? 'switch_red_pressed' : 'switch_red'), x, y);
          } else if (tch === '~') {
            draw1(tile(Math.floor(t * 2) % 2 ? 'spring_out' : 'spring'), x, y);
            ctx.font = `bold ${T * 0.5}px system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#2b2140';
            ctx.lineWidth = 3;
            ctx.strokeText('⇄', x + T / 2, y - T * 0.25);
            ctx.fillText('⇄', x + T / 2, y - T * 0.25);
          } else if (tch === 'G') {
            draw1(tile(Math.floor(t * 3) % 2 ? 'flag_yellow_a' : 'flag_yellow_b'), x, y);
            draw1(tile('star'), x + T * 0.6, y - T * 0.6 + Math.sin(t * 3) * T * 0.1, T * 0.7, T * 0.7);
          }
        }
      }

      // Moving platforms: a row of cloud tiles with a chain hanging above.
      L.movers.forEach((_, i) => {
        const m = moverAt(L, i, t);
        for (let j = 0; j < m.w; j++) draw1(tile(`terrain_${theme}_cloud_middle`), (m.x + j) * T, m.y * T, T, T * 0.6);
        draw1(tile('chain'), (m.x + m.w / 2 - 0.25) * T, m.y * T - T * 0.6, T * 0.5, T * 0.6);
      });

      // The shared body: walker's color below (legs), jumper's on top (spring).
      const x = bx * T;
      const y = by * T;
      const w = PHYS.w * T;
      const h = PHYS.h * T;
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h + T * 0.05, w * 0.55, T * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, T * 0.2);
      ctx.clip();
      ctx.fillStyle = jumperColor;
      ctx.fillRect(x, y, w, h / 2);
      ctx.fillStyle = walkerColor;
      ctx.fillRect(x, y + h / 2, w, h / 2);
      ctx.restore();
      ctx.strokeStyle = '#2b2140';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, T * 0.2);
      ctx.stroke();
      const left = (last.b[4] & 4) !== 0;
      const ex = x + w * (left ? 0.32 : 0.68);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ex - T * 0.09, y + h * 0.3, T * 0.09, 0, Math.PI * 2);
      ctx.arc(ex + T * 0.09, y + h * 0.3, T * 0.09, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2b2140';
      ctx.beginPath();
      ctx.arc(ex - T * 0.07 * (left ? 1.3 : 0.7), y + h * 0.3, T * 0.045, 0, Math.PI * 2);
      ctx.arc(ex + T * 0.11 * (left ? 0.7 : 1), y + h * 0.3, T * 0.045, 0, Math.PI * 2);
      ctx.fill();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [frames, level, walkerColor, jumperColor]);

  return (
    <>
      {/* Fit the screen; phones held sideways get nearly the full height. */}
      <style>{`.twobody-canvas{width:min(100%,calc((100dvh - 230px)*${LW / LH}))}@media (max-height:520px){.twobody-canvas{width:min(100%,calc((100dvh - 64px)*${LW / LH}))}}`}</style>
      <canvas ref={canvas} className="twobody-canvas mx-auto block rounded-2xl border-[3px] border-line" style={{ aspectRatio: `${LW} / ${LH}` }} />
    </>
  );
}
