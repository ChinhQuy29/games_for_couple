import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { PROP_TYPES, WORLD, type MapId, type Placement, type Prop, type PropType, type Shot } from '../../shared';
import MapBackground from './MapBackground';
import PropArt from './PropArt';

// The room, drawn as one SVG in world units (1600×1000) that scales to the window.
//   mode 'hide'   → the hider drags their object (passed as `me`) anywhere
//   mode 'seek'   → hunter: click a prop to shoot; hider: drag their prop to sneak
//   mode 'reveal' → everything visible, the fake highlighted

export interface MapViewProps {
  map: MapId;
  props: Prop[];
  mode: 'hide' | 'seek' | 'reveal';
  role: 'hider' | 'hunter';
  /** The hider's own object while hiding (not in `props` yet). */
  me?: (Placement & { type: PropType }) | null;
  /** Hider: which prop is theirs (seek). Reveal: which prop was the fake. */
  myPropId?: string | null;
  shots?: Shot[];
  tauntPropId?: string | null;
  canSneak?: boolean;
  onMove?: (x: number, y: number) => void;
  onShoot?: (propId: string) => void;
}

const REACTIONS = {
  shatter: { emoji: '💥', text: 'CRASH!' },
  feathers: { emoji: '🪶', text: 'poof' },
  leaves: { emoji: '🍃', text: 'rustle' },
  quack: { emoji: '🦆', text: 'QUACK!' },
  spark: { emoji: '⚡', text: 'bzzt' },
  thud: { emoji: '💢', text: 'thunk' },
} as const;

/** Big pieces underneath, small things on top, then top-to-bottom. */
const drawOrder = (a: Prop, b: Prop) =>
  Number(PROP_TYPES[a.type].hideable) - Number(PROP_TYPES[b.type].hideable) || a.y - b.y;

const ME_ID = '__me';

export default function MapView(props: MapViewProps) {
  const { map, mode, role, me, myPropId, shots = [], tauntPropId, canSneak, onMove, onShoot } = props;
  const svg = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number; x: number; y: number } | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const bursts = useBursts(shots, props.props);

  const all: Prop[] = [...props.props];
  if (mode === 'hide' && me) all.push({ id: ME_ID, ...me });
  all.sort(drawOrder);

  const shotIds = new Set(shots.map((s) => s.propId));
  const ownId = mode === 'hide' ? ME_ID : role === 'hider' ? myPropId : null;
  const fakeId = mode === 'reveal' ? myPropId : null;

  function toWorld(e: { clientX: number; clientY: number }) {
    const el = svg.current!;
    const pt = el.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(el.getScreenCTM()!.inverse());
    return { x: Math.max(0, Math.min(WORLD.w, p.x)), y: Math.max(0, Math.min(WORLD.h, p.y)) };
  }

  const canDrag = (id: string) => id === ownId && (mode === 'hide' || (mode === 'seek' && canSneak));

  function onDown(e: PointerEvent, p: Prop) {
    if (mode === 'seek' && role === 'hunter') {
      if (!shotIds.has(p.id)) onShoot?.(p.id);
      return;
    }
    if (!canDrag(p.id)) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const w = toWorld(e);
    setDrag({ id: p.id, dx: p.x - w.x, dy: p.y - w.y, x: p.x, y: p.y });
  }

  function onPointerMove(e: PointerEvent) {
    if (!drag) return;
    const w = toWorld(e);
    setDrag({ ...drag, x: w.x + drag.dx, y: w.y + drag.dy });
  }

  function onUp() {
    if (!drag) return;
    const moved = all.find((p) => p.id === drag.id);
    if (moved && (Math.abs(moved.x - drag.x) > 2 || Math.abs(moved.y - drag.y) > 2)) onMove?.(Math.round(drag.x), Math.round(drag.y));
    setDrag(null);
  }

  const hunterAiming = mode === 'seek' && role === 'hunter';

  return (
    // Cap the width so the whole 16:10 map fits on a laptop screen without scrolling
    // (≈230px is the top bar, scores, timer and hint line above it).
    <div className="mx-auto w-full" style={{ maxWidth: 'max(480px, calc((100dvh - 230px) * 1.6))' }}>
    <svg
      ref={svg}
      viewBox={`0 0 ${WORLD.w} ${WORLD.h}`}
      className={`block w-full touch-none select-none rounded-3xl border-[3px] border-line bg-card shadow-[4px_4px_0_var(--line)] ${
        hunterAiming ? 'cursor-crosshair' : ''
      }`}
      onPointerMove={onPointerMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      <style>{`
        .hns-prop { transition: transform 0.7s cubic-bezier(.34,1.3,.64,1); }
        .hns-prop.dragging { transition: none; }
        @keyframes hns-wiggle { 0%,100% { transform: rotate(0) scale(1) } 25% { transform: rotate(-9deg) scale(1.06) } 75% { transform: rotate(9deg) scale(1.06) } }
        .hns-wiggle { animation: hns-wiggle 0.3s ease-in-out 3; transform-box: fill-box; transform-origin: center; }
        @keyframes hns-burst { from { opacity: 1; transform: translateY(0) scale(.8) } to { opacity: 0; transform: translateY(-70px) scale(1.3) } }
        .hns-burst { animation: hns-burst 1.6s ease-out forwards; }
        @keyframes hns-pulse { 0%,100% { opacity: .9 } 50% { opacity: .35 } }
        .hns-pulse { animation: hns-pulse 1s ease-in-out infinite; }
      `}</style>
      <MapBackground map={map} />

      {all.map((p) => {
        const dragging = drag?.id === p.id;
        const x = dragging ? drag.x : p.x;
        const y = dragging ? drag.y : p.y;
        const def = PROP_TYPES[p.type];
        const shot = shotIds.has(p.id);
        const own = p.id === ownId;
        const hitR = Math.max(28, Math.max(def.w, def.h) / 2);
        const highlight = hunterAiming && hover === p.id && !shot;
        return (
          <g
            key={p.id}
            className={`hns-prop ${dragging ? 'dragging' : ''}`}
            style={{ transform: `translate(${x}px, ${y}px)` }}
            onPointerDown={(e) => onDown(e, p)}
            onPointerEnter={() => setHover(p.id)}
            onPointerLeave={() => setHover((h) => (h === p.id ? null : h))}
            cursor={canDrag(p.id) ? (dragging ? 'grabbing' : 'grab') : undefined}
          >
            <g transform={`rotate(${p.rot}) scale(${p.scale})`}>
              <g className={tauntPropId === p.id ? 'hns-wiggle' : undefined} opacity={shot && p.id !== fakeId ? 0.45 : 1}>
                <PropArt type={p.type} />
              </g>
            </g>
            {/* A generous invisible click target so small props are easy to hit. */}
            <circle r={hitR} fill="transparent" />
            {highlight && <circle r={hitR + 6} fill="none" stroke="#ff4f8b" strokeWidth={5} strokeDasharray="10 8" pointerEvents="none" />}
            {own && mode !== 'reveal' && (
              <circle r={hitR + 8} fill="none" stroke="#3ddc97" strokeWidth={5} strokeDasharray="12 8" className="hns-pulse" pointerEvents="none" />
            )}
            {p.id === fakeId && (
              <>
                <circle r={hitR + 10} fill="none" stroke="#ffc93c" strokeWidth={8} className="hns-pulse" pointerEvents="none" />
                <text y={-hitR - 20} textAnchor="middle" fontSize={34} fontWeight={800} fill="#2b2140" pointerEvents="none">
                  🙈 it was me!
                </text>
              </>
            )}
            {shot && p.id !== fakeId && (
              <text textAnchor="middle" dominantBaseline="central" fontSize={34} pointerEvents="none">
                ❌
              </text>
            )}
          </g>
        );
      })}

      {shots
        .filter((s) => s.hit)
        .map((s) => (
          <text key={s.at} x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central" fontSize={70} pointerEvents="none">
            🎯
          </text>
        ))}

      {bursts.map((b) => (
        <g key={b.key} transform={`translate(${b.x} ${b.y})`} pointerEvents="none">
          <g className="hns-burst">
            <text textAnchor="middle" fontSize={54}>
              {b.emoji}
            </text>
            <text y={44} textAnchor="middle" fontSize={30} fontWeight={800} fill="#2b2140" stroke="#ffffff" strokeWidth={6} paintOrder="stroke">
              {b.text}
            </text>
          </g>
        </g>
      ))}
    </svg>
    </div>
  );
}

/** One-off reaction bursts for shots that just landed on real props. */
function useBursts(shots: Shot[], props: Prop[]) {
  const seen = useRef<Set<number> | null>(null);
  const [bursts, setBursts] = useState<{ key: number; x: number; y: number; emoji: string; text: string }[]>([]);

  useEffect(() => {
    // Shots that existed before this view mounted don't burst again.
    if (seen.current === null) {
      seen.current = new Set(shots.map((s) => s.at));
      return;
    }
    const fresh = shots.filter((s) => !seen.current!.has(s.at) && !s.hit);
    fresh.forEach((s) => seen.current!.add(s.at));
    shots.forEach((s) => seen.current!.add(s.at));
    if (!fresh.length) return;
    const added = fresh.map((s) => {
      const type = props.find((p) => p.id === s.propId)?.type;
      const r = REACTIONS[type ? PROP_TYPES[type].reaction : 'thud'];
      return { key: s.at, x: s.x, y: s.y - 40, ...r };
    });
    setBursts((b) => [...b, ...added]);
    const t = setTimeout(() => setBursts((b) => b.filter((x) => !added.some((a) => a.key === x.key))), 1700);
    return () => clearTimeout(t);
  }, [shots, props]);

  return bursts;
}
