import { useEffect, useRef } from 'react';
import { ROAD_HALF, TRIPS, VAN, forkSpread, roadCenter, type Frame, type PublicState } from '../shared';

export interface Buffered {
  prev: Frame | null;
  last: Frame | null;
  at: number;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const VIEW_W = 30;

/** Top-down road on a canvas, scrolling with the van and interpolating 30 Hz frames. */
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

      ctx.fillStyle = trip.night ? '#1d3b2a' : '#7cc46b';
      ctx.fillRect(0, 0, cw, ch);

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
