import { useEffect, useRef } from 'react';
import { CHAIN_LENGTH, LW, PHYS, moverOf, tileOf, type Frame, type Theme, type Tower as TowerT } from '../shared';
import { preloadSprites, sprite } from './sprites';

const VIEW_ROWS = 17;

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
const DECOR: Record<Theme, string[]> = {
  grass: ['bush', 'grass', 'mushroom_red', 'fence'],
  snow: ['snow', 'rock', 'bush'],
  sand: ['cactus', 'rock', 'grass'],
  purple: ['mushroom_brown', 'mushroom_red', 'grass_purple'],
  stone: ['rock', 'torch_on_a', 'mushroom_brown'],
};
const SKY: Record<Theme, [string, string]> = {
  grass: ['#8fd3ff', '#e7f7ff'],
  snow: ['#a9c7e8', '#f2f7ff'],
  sand: ['#ffcf8f', '#fff1d6'],
  purple: ['#5b3a8c', '#c9a7ff'],
  stone: ['#55607a', '#c4cbe0'],
};
/** Characters: slot 0 is pink, slot 1 is green. */
const CHARS = ['pink', 'green'] as const;

/** A stable pseudo-random number per tile, for decorations. */
const hash = (x: number, y: number) => {
  let h = (x * 374761393 + y * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** Draws the tower on a canvas at the screen's frame rate, interpolating the 30 Hz frames. */
export function Tower({ frames, tower, mySlot, names, checkpoint }: { frames: React.MutableRefObject<Buffered>; tower: TowerT; mySlot: number; names: string[]; checkpoint: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const cam = useRef<number | null>(null);
  const reached = useRef(checkpoint);
  reached.current = checkpoint;

  useEffect(() => preloadSprites(), []);

  useEffect(() => {
    let raf = 0;
    const theme = tower.theme;
    const solid = (x: number, y: number) => '#x'.includes(tileOf(tower, x, y));
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
      ctx.imageSmoothingEnabled = true;
      const T = cw / LW;
      const k = prev ? Math.min(1, (performance.now() - at) / (1000 / 30)) : 1;
      const bodies = last.b.map((b, i) => {
        const p = prev?.b[i] ?? b;
        return { x: lerp(p[0], b[0], k), y: lerp(p[1], b[1], k), vx: b[2], vy: b[3], flags: b[4], stamina: b[5] };
      });
      const t = prev ? lerp(prev.t, last.t, k) : last.t;

      // Camera follows the pair, smoothly.
      const midY = bodies.reduce((s, b) => s + b.y, 0) / Math.max(1, bodies.length);
      const want = Math.max(0, Math.min(tower.h - VIEW_ROWS, midY - VIEW_ROWS * 0.55));
      cam.current = cam.current === null ? want : lerp(cam.current, want, 0.12);
      const top = cam.current;
      const Y = (y: number) => (y - top) * T;
      const progress = 1 - top / Math.max(1, tower.h - VIEW_ROWS);

      // Sky, a far parallax backdrop and drifting clouds.
      const [skyTop, skyBottom] = SKY[theme];
      const g = ctx.createLinearGradient(0, 0, 0, ch);
      g.addColorStop(0, skyTop);
      g.addColorStop(1, skyBottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cw, ch);
      const bgName = BACKGROUND[theme];
      const bg = bgName ? sprite(bgName) : null;
      if (bg) {
        // The backdrop sinks as you climb, so the view opens up to the sky near the top.
        const size = ch * 1.1;
        const by = ch - size + progress * size * 0.6;
        ctx.globalAlpha = 0.5;
        for (let x = 0; x < cw; x += size) ctx.drawImage(bg, x, by, size, size);
        ctx.globalAlpha = 1;
      }
      const clouds = sprite('backgrounds/background_clouds');
      if (clouds) {
        const size = ch * 0.8;
        const off = -((t * 8) % size);
        ctx.globalAlpha = theme === 'snow' ? 0.85 : 0.55;
        for (let x = off; x < cw; x += size) ctx.drawImage(clouds, x, -size * 0.25 + progress * 30, size, size);
        ctx.globalAlpha = 1;
      }

      // Tiles.
      const gone = new Set(last.gone);
      const r0 = Math.max(0, Math.floor(top) - 1);
      const r1 = Math.min(tower.h - 1, Math.ceil(top + VIEW_ROWS) + 1);
      const tileImg = (name: string) => sprite(`tiles/${name}`);
      for (let ty = r0; ty <= r1; ty++) {
        for (let tx = 0; tx < LW; tx++) {
          const tch = tileOf(tower, tx, ty);
          const x = tx * T;
          const y = Y(ty);
          let img: HTMLImageElement | null = null;
          if (tch === '#') {
            const wall = tx === 0 || tx === LW - 1 || ty === 0;
            img = tileImg(wall ? 'terrain_stone_block_center' : solid(tx, ty - 1) ? `terrain_${theme}_block_center` : `terrain_${theme}_block_top`);
          } else if (tch === 'x') {
            if (gone.has(ty * LW + tx)) continue;
            img = tileImg('block_planks');
          } else if (tch === '-') {
            const l = tileOf(tower, tx - 1, ty) === '-';
            const r = tileOf(tower, tx + 1, ty) === '-';
            img = tileImg(`terrain_${theme}_horizontal_${l && r ? 'middle' : l ? 'right' : r ? 'left' : 'middle'}`);
          } else if (tch === '^') {
            img = tileImg('spikes');
          }
          if (img) ctx.drawImage(img, x, y, T + 0.5, T + 0.5);
          // Decorations on top of open ground.
          if (tch === '#' && tx > 0 && tx < LW - 1 && ty > 0 && tileOf(tower, tx, ty - 1) === ' ' && hash(tx, ty) < 0.22) {
            const pool = DECOR[theme];
            const d = tileImg(pool[Math.floor(hash(ty, tx) * pool.length)]!);
            if (d) ctx.drawImage(d, x, y - T, T, T);
          }
        }
      }

      // Moving platforms.
      for (let i = 0; i < tower.movers.length; i++) {
        const p = moverOf(tower, i, t);
        for (let j = 0; j < p.w; j++) {
          const img = tileImg(`terrain_${theme}_cloud_middle`) ?? tileImg('bridge_logs');
          if (img) ctx.drawImage(img, (p.x + j) * T, Y(p.y), T + 0.5, T * 0.6);
        }
        // A little chain hanging above it shows it moves.
        const chain = tileImg('chain');
        if (chain) ctx.drawImage(chain, (p.x + p.w / 2 - 0.25) * T, Y(p.y) - T * 0.6, T * 0.5, T * 0.6);
      }

      // Camp flags (waving once reached) and the summit.
      const wave = Math.floor(t * 3) % 2 === 0 ? 'a' : 'b';
      tower.checkpoints.forEach((c, i) => {
        if (i === 0) return;
        const img = tileImg(i <= reached.current ? `flag_green_${wave}` : 'flag_off');
        if (img) ctx.drawImage(img, c.flagX * T, Y(c.flagY), T, T);
      });
      const summit = tileImg(`flag_yellow_${wave}`);
      if (summit) ctx.drawImage(summit, tower.summit.x * T, Y(tower.summit.y), T, T);
      const star = tileImg('star');
      if (star) {
        const bob = Math.sin(t * 3) * T * 0.1;
        ctx.drawImage(star, (tower.summit.x + 1) * T, Y(tower.summit.y) - T * 0.4 + bob, T * 0.8, T * 0.8);
      }

      // The chain: sags when slack, goes red when taut.
      if (bodies.length === 2) {
        const [a, b] = bodies as [(typeof bodies)[0], (typeof bodies)[0]];
        const ax = (a.x + PHYS.w / 2) * T;
        const ay = Y(a.y + PHYS.h / 2);
        const bx = (b.x + PHYS.w / 2) * T;
        const by = Y(b.y + PHYS.h / 2);
        const d = Math.hypot(bx - ax, by - ay) / T;
        const slack = Math.max(0, CHAIN_LENGTH - d);
        ctx.strokeStyle = slack < 0.15 ? '#ff4f4f' : '#4a4058';
        ctx.lineWidth = Math.max(3, T * 0.14);
        ctx.setLineDash([T * 0.22, T * 0.12]);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + slack * T * 0.8, bx, by);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Climbers: Kenney characters, posed by what they're doing.
      ctx.textAlign = 'center';
      bodies.forEach((b, i) => {
        const color = CHARS[i] ?? 'pink';
        const grabbing = (b.flags & 1) !== 0;
        const ground = (b.flags & 2) !== 0;
        const left = (b.flags & 4) !== 0;
        const pose = grabbing ? 'climb_a' : !ground ? 'jump' : Math.abs(b.vx) > 0.5 ? (Math.floor(t * 8) % 2 ? 'walk_a' : 'walk_b') : 'idle';
        const img = sprite(`characters/character_${color}_${pose}`);
        const size = T * 2.1;
        const cx = (b.x + PHYS.w / 2) * T;
        const feet = Y(b.y + PHYS.h);
        if (img) {
          ctx.save();
          ctx.translate(cx, feet);
          if (left) ctx.scale(-1, 1);
          ctx.drawImage(img, -size / 2, -size * 0.97, size, size);
          ctx.restore();
        }
        // Name and stamina.
        const headY = feet - size * 0.62;
        ctx.font = `bold ${Math.max(11, T * 0.38)}px system-ui`;
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        const label = i === mySlot ? 'you' : (names[i] ?? '');
        ctx.strokeText(label, cx, headY - T * 0.25);
        ctx.fillStyle = '#2b2140';
        ctx.fillText(label, cx, headY - T * 0.25);
        if (b.stamina < 100) {
          const w = T * 0.9;
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.fillRect(cx - w / 2, headY - T * 0.12, w, T * 0.12);
          ctx.fillStyle = b.stamina > 30 ? '#ffc93c' : '#ff4f4f';
          ctx.fillRect(cx - w / 2, headY - T * 0.12, (w * b.stamina) / 100, T * 0.12);
        }
      });
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [frames, tower, mySlot, names]);

  return (
    <canvas
      ref={canvas}
      className="tethered-canvas mx-auto block rounded-2xl border-[3px] border-line"
      style={{ aspectRatio: `${LW} / ${VIEW_ROWS}` }}
    />
  );
}
