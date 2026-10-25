import { useEffect, useRef } from 'react';
import { ROAD_HALF, TRIPS, VAN, forkSpread, roadCenter, type Frame, type PublicState, type Scene } from '../shared';

export interface Buffered {
  prev: Frame | null;
  last: Frame | null;
  at: number;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const VIEW_W = 30;

/** Top-down road on a canvas, scrolling with the van and interpolating 30 Hz frames. */
type Decor = 'tree' | 'pine' | 'palm' | 'bush' | 'flowers' | 'rock' | 'house' | 'cactus' | 'snowPine' | 'snowHouse' | 'hut' | 'pond';

const SCENES: Record<Scene, { ground: string; texture: string; density: number; decor: Decor[] }> = {
  coast: { ground: '#86d27a', texture: '#79c56d', density: 0.55, decor: ['palm', 'palm', 'bush', 'flowers', 'house'] },
  mountain: { ground: '#6fae62', texture: '#64a258', density: 0.7, decor: ['pine', 'pine', 'rock', 'rock', 'tree'] },
  night: { ground: '#1d3b2a', texture: '#22452f', density: 0.55, decor: ['pine', 'tree', 'house', 'bush'] },
  rice: { ground: '#9be07a', texture: '#7fcf62', density: 0.4, decor: ['hut', 'palm', 'pond', 'bush'] },
  desert: { ground: '#f0cf8c', texture: '#e2bb6e', density: 0.35, decor: ['cactus', 'cactus', 'rock', 'rock'] },
  snow: { ground: '#f4f8ff', texture: '#dfe8f5', density: 0.6, decor: ['snowPine', 'snowPine', 'snowHouse', 'rock'] },
};

/** A stable pseudo-random number in [0, 1) for a spot along the road. */
const hash = (a: number, b: number) => {
  let h = (Math.round(a) * 374761393 + Math.round(b) * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** One roadside thing, seen from above, centred on (x, y). */
function drawDecor(ctx: CanvasRenderingContext2D, kind: Decor, x: number, y: number, px: number, night: boolean) {
  const ink = '#2b2140';
  const circle = (cx: number, cy: number, r: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  ctx.lineWidth = 2;
  ctx.strokeStyle = ink;
  // A soft shadow under everything.
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(x + px * 0.3, y + px * 0.3, px * 1.1, px * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  switch (kind) {
    case 'tree':
      circle(x, y, px * 1.2, night ? '#245a3a' : '#3fb267');
      circle(x - px * 0.3, y - px * 0.3, px * 0.5, night ? '#2e6e47' : '#56c97d');
      break;
    case 'bush':
      circle(x - px * 0.4, y, px * 0.55, '#3fb267');
      circle(x + px * 0.4, y, px * 0.55, '#56c97d');
      break;
    case 'pine':
    case 'snowPine':
      for (const [r, c] of [[1.1, kind === 'pine' ? (night ? '#1f4d33' : '#2f8a57') : '#2f8a57'], [0.7, kind === 'pine' ? (night ? '#28603f' : '#3fb267') : '#ffffff']] as const) {
        ctx.fillStyle = c;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const rr = (i % 2 ? 0.55 : 1) * r * px;
          ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      break;
    case 'palm':
      ctx.fillStyle = '#3ddc97';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * px * 0.7, y + Math.sin(a) * px * 0.7, px * 0.75, px * 0.25, a, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      circle(x, y, px * 0.25, '#8d5a2b');
      break;
    case 'flowers':
      for (let i = 0; i < 5; i++) circle(x + Math.cos(i * 1.3) * px * 0.6, y + Math.sin(i * 1.3) * px * 0.5, px * 0.18, ['#ff8fb8', '#ffc93c', '#ffffff', '#a77bff', '#ff4f4f'][i]!);
      break;
    case 'rock':
      ctx.fillStyle = '#a3a8b4';
      ctx.beginPath();
      ctx.moveTo(x - px * 0.7, y + px * 0.2);
      ctx.lineTo(x - px * 0.4, y - px * 0.5);
      ctx.lineTo(x + px * 0.3, y - px * 0.6);
      ctx.lineTo(x + px * 0.8, y);
      ctx.lineTo(x + px * 0.3, y + px * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'cactus':
      ctx.fillStyle = '#3fb267';
      ctx.beginPath();
      ctx.roundRect(x - px * 0.25, y - px * 0.9, px * 0.5, px * 1.8, px * 0.25);
      ctx.roundRect(x - px * 0.85, y - px * 0.3, px * 0.6, px * 0.35, px * 0.17);
      ctx.roundRect(x + px * 0.25, y - px * 0.1, px * 0.6, px * 0.35, px * 0.17);
      ctx.fill();
      ctx.stroke();
      break;
    case 'house':
    case 'snowHouse':
    case 'hut': {
      const w = px * (kind === 'hut' ? 1.6 : 2);
      ctx.fillStyle = kind === 'snowHouse' ? '#ffffff' : kind === 'hut' ? '#e2b866' : '#ff8f6b';
      ctx.beginPath();
      ctx.rect(x - w / 2, y - w / 2.6, w, w / 1.3);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y);
      ctx.lineTo(x + w / 2, y);
      ctx.stroke();
      if (night) circle(x, y + w / 5, px * 0.18, '#ffe08a');
      break;
    }
    case 'pond':
      ctx.fillStyle = '#4cc9f0';
      ctx.beginPath();
      ctx.ellipse(x, y, px * 1.6, px * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
  }
}

export function Road({ frames, s }: { frames: React.MutableRefObject<Buffered>; s: PublicState }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const cam = useRef<number | null>(null);
  const data = useRef(s);
  data.current = s;

  useEffect(() => {
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const c = canvas.current;
      const { prev, last, at } = frames.current;
      if (!c || !last) return;
      const st = data.current;
      const trip = TRIPS[st.trip]!;
      const ctx = c.getContext('2d')!;
      const dpr = window.devicePixelRatio || 1;
      const cw = c.clientWidth;
      const ch = c.clientHeight;
      if (c.width !== Math.round(cw * dpr)) {
        c.width = Math.round(cw * dpr);
        c.height = Math.round(ch * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const k = prev ? Math.min(1, (performance.now() - at) / (1000 / 30)) : 1;
      // A U-turn jumps d backwards: don't interpolate across it.
      const jump = prev && Math.abs(last.d - prev.d) > 5;
      const vd = prev && !jump ? lerp(prev.d, last.d, k) : last.d;
      const vx = prev && !jump ? lerp(prev.x, last.x, k) : last.x;
      const px = cw / VIEW_W;
      const want = roadCenter(st.curve, vd + 6) * 0.5 + vx * 0.5;
      cam.current = cam.current === null ? want : lerp(cam.current, want, 0.08);
      const X = (x: number) => cw / 2 + (x - cam.current!) * px;
      const vanY = ch * 0.86;
      const Y = (d: number) => vanY - (d - vd) * px;
      const ahead = vanY / px + 2;

      // The land: ground, a texture that scrolls with the road, and roadside things.
      const scene = SCENES[trip.scene];
      ctx.fillStyle = scene.ground;
      ctx.fillRect(0, 0, cw, ch);
      ctx.strokeStyle = scene.texture;
      ctx.lineWidth = Math.max(1.5, px * 0.08);
      for (let d = Math.floor((vd - 8) / 4) * 4; d <= vd + ahead; d += 4) {
        const y = Y(d);
        ctx.beginPath();
        if (trip.scene === 'rice') {
          // Paddy rows: long straight lines.
          ctx.moveTo(0, y);
          ctx.lineTo(cw, y);
        } else {
          // Dunes, drifts and grass tufts: short wavy marks.
          for (let i = 0; i < 6; i++) {
            const x = ((hash(d, i) * 1.3) % 1) * cw;
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + px * 0.6, y - px * 0.35, x + px * 1.2, y);
          }
        }
        ctx.stroke();
      }
      for (let d = Math.floor((vd - 10) / 3) * 3; d <= vd + ahead + 3; d += 3) {
        for (const side of [-1, 1] as const) {
          const h = hash(d, side);
          if (h > scene.density) continue;
          const off = ROAD_HALF + 1.6 + hash(side, d) * 9;
          const kind = scene.decor[Math.floor(hash(d * 7, side * 3) * scene.decor.length)]!;
          drawDecor(ctx, kind, X(roadCenter(st.curve, d) + side * off), Y(d + hash(d, 9) * 2), px, trip.night);
        }
      }

      // The road (both branches during forks), then the centre lines.
      const strip = (side: -1 | 0 | 1, fill: string, half: number) => {
        ctx.fillStyle = fill;
        ctx.beginPath();
        const pts: [number, number][] = [];
        for (let d = vd - 8; d <= vd + ahead; d += 1) {
          const cx = roadCenter(st.curve, d) + side * forkSpread(st.junctions, d);
          pts.push([X(cx - half), Y(d)]);
        }
        for (let d = vd + ahead; d >= vd - 8; d -= 1) {
          const cx = roadCenter(st.curve, d) + side * forkSpread(st.junctions, d);
          pts.push([X(cx + half), Y(d)]);
        }
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fill();
      };
      for (const side of [-1, 1] as const) strip(side, '#e8dcc4', ROAD_HALF + 0.35);
      for (const side of [-1, 1] as const) strip(side, trip.night ? '#3a3346' : '#5a5466', ROAD_HALF);
      ctx.strokeStyle = '#ffe08a';
      ctx.lineWidth = Math.max(2, px * 0.12);
      ctx.setLineDash([px * 1.2, px * 1.2]);
      for (const side of [-1, 1] as const) {
        ctx.beginPath();
        for (let d = vd - 8; d <= vd + ahead; d += 1) {
          const cx = roadCenter(st.curve, d) + side * forkSpread(st.junctions, d);
          if (d === vd - 8) ctx.moveTo(X(cx), Y(d));
          else ctx.lineTo(X(cx), Y(d));
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Finish line.
      if (trip.length - vd < ahead) {
        const cx = roadCenter(st.curve, trip.length);
        for (let i = 0; i < 8; i++)
          for (let j = 0; j < 2; j++) {
            ctx.fillStyle = (i + j) % 2 ? '#fff' : '#2b2140';
            ctx.fillRect(X(cx - ROAD_HALF) + (i * 2 * ROAD_HALF * px) / 8, Y(trip.length) - j * px * 0.5, (2 * ROAD_HALF * px) / 8, px * 0.5);
          }
      }

      // Signs before each fork.
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const j of st.junctions) {
        const sd = j.d - 30;
        if (sd < vd - 8 || sd > vd + ahead) continue;
        const cx = X(roadCenter(st.curve, sd));
        const y = Y(sd);
        ctx.font = `bold ${Math.max(11, px * 0.45)}px system-ui`;
        const w = px * 4.2;
        for (const [i, name] of j.names.entries()) {
          const x = cx + (i === 0 ? -w / 2 - 4 : w / 2 + 4);
          ctx.fillStyle = '#2bb57a';
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x - w / 2, y - px * 0.45, w, px * 0.9, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#fff';
          ctx.fillText(i === 0 ? `⬅ ${name}` : `${name} ➡`, x, y);
        }
      }

      // Things on the road.
      const cows = new Map(last.cows);
      const prevCows = new Map(prev?.cows ?? []);
      for (const o of st.obstacles) {
        if (o.d < vd - 8 || o.d > vd + ahead) continue;
        if (trip.night && o.d - vd > 20 && o.kind !== 'fuel') continue; // it's dark out there
        let ox = o.x;
        if (o.kind === 'cow' && cows.has(o.id)) ox = lerp(prevCows.get(o.id) ?? cows.get(o.id)!, cows.get(o.id)!, k);
        const x = X(ox);
        const y = Y(o.d);
        if (o.kind === 'mud') {
          ctx.fillStyle = '#6b4a2e';
          ctx.beginPath();
          ctx.ellipse(x, y, px * 1.6, px * 1.1, 0, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }
        if (o.kind === 'pothole') {
          ctx.fillStyle = '#1f1b2e';
          ctx.beginPath();
          ctx.ellipse(x, y, px * 0.6, px * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }
        if (o.hit && o.kind === 'fuel') continue;
        ctx.font = `${px * (o.kind === 'cow' ? 1.6 : 1.2)}px system-ui`;
        ctx.globalAlpha = o.hit ? 0.5 : 1;
        ctx.fillText(o.kind === 'cow' ? (o.hit ? '💫' : '🐄') : o.kind === 'rock' ? '🪨' : '⛽', x, y);
        ctx.globalAlpha = 1;
      }

      // The van.
      const x = X(vx);
      const w = VAN.halfW * 2 * px;
      const h = VAN.halfL * 2 * px;
      if (trip.night) {
        const g = ctx.createRadialGradient(x, vanY - h, px, x, vanY - h * 4, px * 9);
        g.addColorStop(0, 'rgba(255,246,200,0.35)');
        g.addColorStop(1, 'rgba(255,246,200,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, cw, ch);
      }
      ctx.fillStyle = '#ff4f8b';
      ctx.strokeStyle = '#2b2140';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, vanY - h / 2, w, h, px * 0.3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#bfe6ff';
      ctx.fillRect(x - w / 2 + 4, vanY - h / 2 + 5, w - 8, h * 0.22);
      ctx.fillStyle = '#fff8e7';
      ctx.fillRect(x - w / 2 + 4, vanY - h * 0.05, w - 8, h * 0.35);
      if (last.stalled > 0) {
        ctx.font = `bold ${px * 0.9}px system-ui`;
        ctx.fillStyle = '#fff';
        ctx.fillText('🔁', x, vanY - h);
      }
      if (trip.night) {
        // Darkness everywhere except the headlights' reach.
        const g = ctx.createRadialGradient(x, vanY - h * 3, px * 3, x, vanY - h * 3, px * 18);
        g.addColorStop(0, 'rgba(10,10,25,0)');
        g.addColorStop(1, 'rgba(10,10,25,0.85)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, cw, ch);
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [frames]);

  return <canvas ref={canvas} className="block h-full w-full rounded-2xl border-[3px] border-line" />;
}
