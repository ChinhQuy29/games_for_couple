import { useEffect, useRef } from 'react';
import { DIRS, H, W, idx, xy, type Dir, type ExplorerView, type House, type NavigatorView } from '../shared';

const T = 32;
const VIEW = `0 0 ${W * T} ${H * T}`;
const ANGLE: Record<Dir, number> = { right: 0, down: 90, left: 180, up: 270 };
/** Keeps the map at a size that fits a laptop screen next to the sidebar. */
const MAP_STYLE = { width: `min(100%, calc((100dvh - 190px) * ${W / H}))` } as const;

function Tile({ i, ch, lit, uv }: { i: number; ch: string; lit: boolean; uv?: boolean }) {
  const [x, y] = xy(i);
  const fill =
    ch === '#'
      ? lit
        ? '#4a3f63'
        : '#2a2338'
      : ch === 'E'
        ? '#3ddc97'
        : ch === 'c'
          ? lit
            ? '#8a6a4a'
            : '#3d3026'
          : lit
            ? uv
              ? '#5b3fa0'
              : '#c9b89a'
            : '#3a3446';
  return (
    <g>
      <rect x={x * T} y={y * T} width={T} height={T} fill={fill} stroke={ch === '#' ? 'none' : 'rgba(0,0,0,0.12)'} />
      {ch === 'c' && (
        <text x={x * T + T / 2} y={y * T + T * 0.72} textAnchor="middle" fontSize={20} opacity={lit ? 1 : 0.5}>
          🚪
        </text>
      )}
    </g>
  );
}

/** The Explorer's view: darkness, a flashlight cone, and whatever they remember. */
export function ExplorerMap({ v, hunt, gameKey }: { v: ExplorerView; hunt: string; gameKey: number }) {
  const memory = useRef(new Map<number, string>());
  const lastGame = useRef(gameKey);
  if (lastGame.current !== gameKey) {
    memory.current = new Map();
    lastGame.current = gameKey;
  }
  for (const [k, ch] of Object.entries(v.visible)) memory.current.set(Number(k), ch);
  const lit = new Set(Object.keys(v.visible).map(Number));
  const [px, py] = v.pos;
  const cx = px * T + T / 2;
  const cy = py * T + T / 2;

  return (
    <div className="relative mx-auto" style={MAP_STYLE}>
      <svg viewBox={VIEW} className="block w-full rounded-2xl border-[3px] border-line bg-black">
        <defs>
          <radialGradient id="beam" cx="0" cy="0.5" r="1">
            <stop offset="0" stopColor={v.uv ? '#b18cff' : '#fff6c8'} stopOpacity="0.55" />
            <stop offset="1" stopColor={v.uv ? '#b18cff' : '#fff6c8'} stopOpacity="0" />
          </radialGradient>
        </defs>
        {[...memory.current].map(([i, ch]) => (
          <Tile key={i} i={i} ch={ch} lit={lit.has(i)} uv={v.uv} />
        ))}
        {v.book && memory.current.has(idx(...v.book.pos)) && (
          <text x={v.book.pos[0] * T + T / 2} y={v.book.pos[1] * T + T * 0.75} textAnchor="middle" fontSize={22}>
            {v.book.written ? '✍️' : '📓'}
          </text>
        )}
        {v.cameras.map(([x, y], k) => (
          <text key={k} x={x * T + T / 2} y={y * T + T * 0.75} textAnchor="middle" fontSize={20}>
            📹
          </text>
        ))}
        {v.prints.map(([x, y], k) => (
          <text key={k} x={x * T + T / 2} y={y * T + T * 0.75} textAnchor="middle" fontSize={22}>
            🖐️
          </text>
        ))}
        {!v.hidden && (
          <g transform={`rotate(${ANGLE[v.facing]} ${cx} ${cy})`} pointerEvents="none">
            <path d={`M ${cx} ${cy} L ${cx + T * 7} ${cy - T * 5.5} L ${cx + T * 7} ${cy + T * 5.5} Z`} fill="url(#beam)" />
          </g>
        )}
        <circle cx={cx} cy={cy} r={T * 0.36} fill="#ff4f8b" stroke="#2b2140" strokeWidth={3} />
        <circle cx={cx + DIRS[v.facing][0] * T * 0.22} cy={cy + DIRS[v.facing][1] * T * 0.22} r={4} fill="#fff" />
        {v.ghost && (
          <text x={v.ghost[0] * T + T / 2} y={v.ghost[1] * T + T * 0.85} textAnchor="middle" fontSize={34} className="jiggle">
            👻
          </text>
        )}
      </svg>
      {hunt !== 'calm' && <div className={`pointer-events-none absolute inset-0 rounded-2xl ${hunt === 'hunt' ? 'animate-pulse shadow-[inset_0_0_120px_40px_rgba(255,0,40,0.75)]' : 'flicker shadow-[inset_0_0_80px_20px_rgba(255,255,255,0.4)]'}`} />}
      {v.hidden && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/80 text-center font-display text-2xl font-extrabold text-white">
          🚪 You're hiding in a closet.
          <br />
          Don't breathe.
        </div>
      )}
    </div>
  );
}

/** The Navigator's blueprint: every room, the Explorer's dot and the cameras. No ghost. */
export function NavigatorMap({ v, hunt, house }: { v: NavigatorView; hunt: string; house: House }) {
  const [px, py] = v.explorer.pos;
  const cx = px * T + T / 2;
  const cy = py * T + T / 2;
  return (
    <div className="relative mx-auto" style={MAP_STYLE}>
      <svg viewBox={VIEW} className="block w-full rounded-2xl border-[3px] border-line bg-[#13294b]">
        {[...v.map].map((ch, i) => {
          const [x, y] = xy(i);
          if (ch === '#') return <rect key={i} x={x * T} y={y * T} width={T} height={T} fill="#0b1a33" />;
          return (
            <g key={i}>
              <rect x={x * T} y={y * T} width={T} height={T} fill={ch === 'E' ? '#3ddc97' : ch === 'd' ? '#2f5f9e' : '#1d3d6e'} stroke="#2a5288" strokeWidth={1} />
              {ch === 'c' && (
                <text x={x * T + T / 2} y={y * T + T * 0.72} textAnchor="middle" fontSize={18}>
                  🚪
                </text>
              )}
            </g>
          );
        })}
        {house.rooms.map((r) => (
          <text
            key={r.id}
            x={(r.x + r.w / 2) * T}
            y={(r.y + r.h / 2) * T}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={r.h < 3 ? 16 : 20}
            fontWeight={800}
            fill="#8fb8ff"
            opacity={0.75}
            className="font-display uppercase"
          >
            {r.name}
          </text>
        ))}
        <text x={house.exit[0] * T + T / 2} y={house.exit[1] * T + T * 0.68} textAnchor="middle" fontSize={house.exit[0] === 0 || house.exit[0] === W - 1 ? 9 : 14} fontWeight={800} fill="#13294b">
          EXIT
        </text>
        {v.book && (
          <text x={v.book.pos[0] * T + T / 2} y={v.book.pos[1] * T + T * 0.75} textAnchor="middle" fontSize={20}>
            📓
          </text>
        )}
        {v.cameras.map((c, k) => (
          <text key={k} x={c.pos[0] * T + T / 2} y={c.pos[1] * T + T * 0.75} textAnchor="middle" fontSize={20}>
            📹
          </text>
        ))}
        <g transform={`rotate(${ANGLE[v.explorer.facing]} ${cx} ${cy})`}>
          <path d={`M ${cx} ${cy} L ${cx + T * 2.2} ${cy - T * 1.4} L ${cx + T * 2.2} ${cy + T * 1.4} Z`} fill={v.explorer.uv ? '#b18cff' : '#fff6c8'} opacity={0.35} />
        </g>
        <circle cx={cx} cy={cy} r={T * 0.4} fill="#ff4f8b" stroke="#fff" strokeWidth={3} opacity={v.explorer.hidden ? 0.4 : 1}>
          <animate attributeName="r" values={`${T * 0.34};${T * 0.44};${T * 0.34}`} dur="1.2s" repeatCount="indefinite" />
        </circle>
      </svg>
      {hunt !== 'calm' && <div className={`pointer-events-none absolute inset-0 rounded-2xl ${hunt === 'hunt' ? 'animate-pulse shadow-[inset_0_0_120px_40px_rgba(255,0,40,0.6)]' : 'flicker'}`} />}
    </div>
  );
}

/**
 * Holds WASD/arrow keys (or on-screen arrows) and repeats moves while held.
 * Returns the handler for the kit's TouchControls.
 */
export function useMovementKeys(onMove: (d: Dir) => void, onKey: (k: string) => void, enabled: boolean) {
  const held = useRef<Dir[]>([]);
  const touch = useRef<Dir[]>([]);
  const move = useRef(onMove);
  const key = useRef(onKey);
  move.current = onMove;
  key.current = onKey;
  useEffect(() => {
    if (!enabled) return;
    const map: Record<string, Dir> = { w: 'up', arrowup: 'up', s: 'down', arrowdown: 'down', a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right' };
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input, textarea, select')) return;
      const k = e.key.toLowerCase();
      const dir = map[k];
      if (dir) {
        e.preventDefault();
        if (!held.current.includes(dir)) {
          held.current.push(dir);
          move.current(dir);
        }
        return;
      }
      if (!e.repeat) key.current(k);
      if (k === ' ') e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      const dir = map[e.key.toLowerCase()];
      if (dir) held.current = held.current.filter((d) => d !== dir);
    };
    const blur = () => {
      held.current = [];
      touch.current = [];
    };
    const id = setInterval(() => {
      const d = held.current[held.current.length - 1] ?? touch.current[touch.current.length - 1];
      if (d) move.current(d);
    }, 160);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      clearInterval(id);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [enabled]);
  return (buttons: Record<string, boolean>) => {
    const now = (Object.keys(DIRS) as Dir[]).filter((d) => buttons[d]);
    const fresh = now.filter((d) => !touch.current.includes(d));
    touch.current = [...touch.current.filter((d) => now.includes(d)), ...fresh];
    // A new press steps at once; holding keeps stepping with the keys' repeat.
    if (enabled && fresh.length) move.current(fresh[fresh.length - 1]!);
  };
}
