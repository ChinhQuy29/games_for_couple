import { useEffect, useRef } from 'react';
import { PLAYER_COLORS } from '@gfc/kit/client';
import { HOUSES, ITEMS, LH, LW, PHYS, moverAt, type Frame, type ItemKind } from '../shared';
import { preloadSprites, sprite } from './sprites';

export interface Buffered {
  prev: Frame | null;
  last: Frame | null;
  at: number;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const L = '#2b2140';
/** Wallpaper per house: base and stripe. */
const WALLPAPER: [string, string][] = [
  ['#f3dcc9', '#efd2bc'],
  ['#e3efd9', '#d8e8cc'],
  ['#e6def5', '#dcd2f0'],
  ['#fdebd3', '#f8e0c0'],
  ['#ececec', '#e2e2e2'],
];

/** Draws one valuable inside its box (x, y, w, h in pixels). */
function drawItem(ctx: CanvasRenderingContext2D, kind: ItemKind, x: number, y: number, w: number, h: number) {
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = L;
  const box = (fill: string, rx = 6, bx = x, by = y, bw = w, bh = h) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, rx);
    ctx.fill();
    ctx.stroke();
  };
  switch (kind) {
    case 'vase':
      ctx.fillStyle = '#4cc9f0';
      ctx.beginPath();
      ctx.moveTo(x + w * 0.3, y);
      ctx.lineTo(x + w * 0.7, y);
      ctx.quadraticCurveTo(x + w * 1.1, y + h * 0.6, x + w * 0.75, y + h);
      ctx.lineTo(x + w * 0.25, y + h);
      ctx.quadraticCurveTo(x - w * 0.1, y + h * 0.6, x + w * 0.3, y);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + w * 0.2, y + h * 0.5, w * 0.6, h * 0.08);
      break;
    case 'lamp':
      box('#ffe08a', 4, x, y, w, h * 0.4);
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y + h * 0.4);
      ctx.lineTo(x + w / 2, y + h);
      ctx.stroke();
      box('#9b5de5', 3, x + w * 0.15, y + h * 0.9, w * 0.7, h * 0.1);
      break;
    case 'painting':
      box('#c98b4f', 3);
      ctx.fillStyle = '#bfe6ff';
      ctx.fillRect(x + w * 0.12, y + h * 0.15, w * 0.76, h * 0.7);
      ctx.fillStyle = '#3ddc97';
      ctx.beginPath();
      ctx.moveTo(x + w * 0.12, y + h * 0.85);
      ctx.lineTo(x + w * 0.45, y + h * 0.4);
      ctx.lineTo(x + w * 0.88, y + h * 0.85);
      ctx.fill();
      break;
    case 'plant':
      ctx.fillStyle = '#3ddc97';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h * 0.35, w * 0.45, h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      box('#e07a4f', 3, x + w * 0.2, y + h * 0.6, w * 0.6, h * 0.4);
      break;
    case 'statue':
      ctx.fillStyle = '#ffc93c';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h * 0.65, w * 0.42, h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h * 0.28, w * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + w * 0.3, y + h * 0.12);
      ctx.lineTo(x + w * 0.32, y);
      ctx.lineTo(x + w * 0.45, y + h * 0.06);
      ctx.moveTo(x + w * 0.7, y + h * 0.12);
      ctx.lineTo(x + w * 0.68, y);
      ctx.lineTo(x + w * 0.55, y + h * 0.06);
      ctx.fill();
      ctx.stroke();
      break;
    case 'plates':
      box('#d9a066', 3);
      ctx.fillStyle = L;
      ctx.font = `bold ${h * 0.32}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText('FRAGILE', x + w / 2, y + h * 0.62);
      break;
    case 'tv':
      box('#2b2140', 6);
      ctx.fillStyle = '#4a3a6b';
      ctx.fillRect(x + w * 0.06, y + h * 0.1, w * 0.88, h * 0.75);
      ctx.fillStyle = '#4cc9f0';
      ctx.fillRect(x + w * 0.1, y + h * 0.15, w * 0.3, h * 0.12);
      break;
    case 'fishtank':
      box('rgba(191,230,255,0.85)', 4);
      ctx.fillStyle = '#ff9f43';
      for (const [fx, fy] of [
        [0.3, 0.5],
        [0.65, 0.35],
        [0.55, 0.7],
      ] as const) {
        ctx.beginPath();
        ctx.ellipse(x + w * fx, y + h * fy, w * 0.06, h * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#3ddc97';
      ctx.fillRect(x + w * 0.05, y + h * 0.85, w * 0.9, h * 0.1);
      break;
    case 'piano':
      box('#1f1b2e', 6);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + w * 0.06, y + h * 0.42, w * 0.88, h * 0.18);
      ctx.fillStyle = '#1f1b2e';
      for (let k = 0; k < 12; k++) ctx.fillRect(x + w * 0.08 + (k * w * 0.84) / 12, y + h * 0.42, w * 0.03, h * 0.1);
      break;
    case 'sofa':
      box('#9b5de5', 10, x, y, w, h * 0.55);
      box('#b47bff', 10, x, y + h * 0.4, w, h * 0.6);
      break;
  }
}

/** Draws a house on a canvas, interpolating the 30 Hz frames. */
export function Stage({
  frames,
  house,
  kinds,
  names,
  mySlot,
}: {
  frames: React.MutableRefObject<Buffered>;
  house: number;
  kinds: Map<number, ItemKind>;
  names: string[];
  mySlot: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => preloadSprites(), []);
  useEffect(() => {
    const H = HOUSES[house]!;
    const empty = (x: number, y: number) => (H.rows[y]?.[x] ?? '#') === ' ';
    const windows: [number, number][] = [];
    for (const [wx, wy] of [[4, 2], [14, 2], [20, 3], [8, 11], [18, 11]] as const) if ([0, 1].every((dy) => [0, 1].every((dx) => empty(wx + dx, wy + dy)))) windows.push([wx + 0.3, wy + 0.3]);
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
      const t = prev ? lerp(prev.t, last.t, k) : last.t;

      const tile = (name: string) => sprite(`tiles/${name}`);
      const draw1 = (img: HTMLImageElement | null, x: number, y: number, w = T, h = T) => img && ctx.drawImage(img, x, y, w + 0.5, h + 0.5);

      // Outside: sky, hills and clouds. Inside (left of the outer wall): wallpaper with windows.
      const sky = ctx.createLinearGradient(0, 0, 0, ch);
      sky.addColorStop(0, '#8fd3ff');
      sky.addColorStop(1, '#e7f7ff');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, cw, ch);
      const hills = sprite('backgrounds/background_color_hills');
      if (hills) ctx.drawImage(hills, 22 * T, ch - 12 * T, 12 * T, 12 * T);
      const clouds = sprite('backgrounds/background_clouds');
      if (clouds) {
        ctx.globalAlpha = 0.6;
        ctx.drawImage(clouds, 24 * T - ((t * 4) % (8 * T)), -T * 2, 10 * T, 10 * T);
        ctx.globalAlpha = 1;
      }
      const [paper, stripe] = WALLPAPER[house % WALLPAPER.length]!;
      ctx.fillStyle = paper;
      ctx.fillRect(T, T, 23 * T, 15 * T);
      ctx.fillStyle = stripe;
      for (let x = 1; x < 24; x += 1) if (x % 2) ctx.fillRect(x * T, T, T * 0.5, 15 * T);
      // Windows, only on bare wall (nothing in the 2×2 tiles behind them).
      for (const [wx, wy] of windows) draw1(tile('window'), wx * T, wy * T, T * 1.4, T * 1.4);

      for (let ty = 0; ty < LH; ty++)
        for (let tx = 0; tx < LW; tx++) {
          const tch = H.rows[ty]![tx]!;
          const x = tx * T;
          const y = ty * T;
          const outside = tx >= 26;
          if (tch === '#') {
            const border = tx === 0 || tx === LW - 1 || ty === 0;
            const above = H.rows[ty - 1]?.[tx];
            if (border) draw1(tile('terrain_stone_block_center'), x, y);
            else if (ty < 16 && (tx === 24 || tx === 25)) draw1(tile('bricks_brown'), x, y);
            else if (ty >= 16) draw1(tile(outside ? (above === '#' ? 'terrain_grass_block_center' : 'terrain_grass_block_top') : above === '#' ? 'terrain_stone_block_center' : 'terrain_stone_block_top'), x, y);
            else draw1(tile('brick_brown'), x, y);
          } else if (tch === '-') {
            const l = H.rows[ty]![tx - 1] === '-';
            const r = H.rows[ty]![tx + 1] === '-';
            draw1(tile(`terrain_stone_horizontal_${l && r ? 'middle' : l ? 'right' : r ? 'left' : 'middle'}`), x, y);
          }
        }
      // The doorway in the outer wall, and an exit sign over it.
      draw1(tile('sign_exit'), 24.45 * T, 10.5 * T, T * 1.1, T * 1.1);

      // The truck: a box with an open back, the green drop zone inside, wheels below.
      ctx.fillStyle = '#fff8e7';
      ctx.strokeStyle = L;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(26.6 * T, 11.6 * T, 4.2 * T, 4.4 * T, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(61,220,151,0.28)';
      ctx.fillRect(26.8 * T, 12.9 * T, 3.9 * T, 3 * T);
      ctx.fillStyle = L;
      ctx.font = `bold ${T * 0.42}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText('🚚 TRUCK', 28.7 * T, 12.45 * T);

      H.movers.forEach((_, i) => {
        const m = moverAt(H, i, t);
        for (let j = 0; j < m.w; j++) draw1(tile('terrain_stone_cloud_middle'), (m.x + j) * T, m.y * T, T, T * 0.5);
        draw1(tile('chain'), (m.x + m.w / 2 - 0.25) * T, m.y * T - T * 0.6, T * 0.5, T * 0.6);
      });

      // Items.
      const prevItems = new Map((prev?.i ?? []).map((p) => [p[0], p]));
      for (const it of last.i) {
        const kind = kinds.get(it[0]);
        if (!kind) continue;
        const p = prevItems.get(it[0]) ?? it;
        const x = lerp(p[1], it[1], k) * T;
        const y = lerp(p[2], it[2], k) * T;
        const w = ITEMS[kind].w * T;
        const h = ITEMS[kind].h * T;
        drawItem(ctx, kind, x, y, w, h);
        if (it[3] < 100) {
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.fillRect(x, y - 8, w, 5);
          ctx.fillStyle = it[3] > 50 ? '#3ddc97' : it[3] > 25 ? '#ffc93c' : '#ff4f4f';
          ctx.fillRect(x, y - 8, (w * it[3]) / 100, 5);
        }
      }

      // Movers (the people).
      last.b.forEach((b, i) => {
        const p = prev?.b[i] ?? b;
        const x = lerp(p[0], b[0], k) * T;
        const y = lerp(p[1], b[1], k) * T;
        const w = PHYS.w * T;
        const h = PHYS.h * T;
        ctx.fillStyle = PLAYER_COLORS[i] ?? '#fff';
        ctx.strokeStyle = L;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, T * 0.2);
        ctx.fill();
        ctx.stroke();
        const left = (b[2] & 4) !== 0;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + w * (left ? 0.3 : 0.7) - T * 0.08, y + h * 0.35, T * 0.07, 0, Math.PI * 2);
        ctx.arc(x + w * (left ? 0.3 : 0.7) + T * 0.08, y + h * 0.35, T * 0.07, 0, Math.PI * 2);
        ctx.fill();
        if (b[2] & 8) {
          // Arms up.
          ctx.beginPath();
          ctx.moveTo(x + w * 0.1, y + h * 0.4);
          ctx.lineTo(x + w * 0.1, y - 2);
          ctx.moveTo(x + w * 0.9, y + h * 0.4);
          ctx.lineTo(x + w * 0.9, y - 2);
          ctx.stroke();
        }
        ctx.font = `bold ${Math.max(10, T * 0.36)}px system-ui`;
        ctx.fillStyle = L;
        ctx.textAlign = 'center';
        ctx.fillText(i === mySlot ? 'you' : (names[i] ?? ''), x + w / 2, y + h + T * 0.45);
      });
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [frames, house, kinds, names, mySlot]);

  return (
    <canvas
      ref={canvas}
      className="mx-auto block rounded-2xl border-[3px] border-line"
      style={{ width: `min(100%, calc((100dvh - 230px) * ${LW / LH}))`, aspectRatio: `${LW} / ${LH}` }}
    />
  );
}
