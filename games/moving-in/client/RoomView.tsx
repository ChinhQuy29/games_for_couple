import { useEffect, useRef, useState } from 'react';
import { PLAYER_COLORS } from '@gfc/kit/client';
import { BOX_AT, KINDS, SNAP } from '../shared';
import { kit } from './kit';
import { PlacedItem, Scene, variants } from './Scene';

const { useGame, useRoom } = kit;

interface Drag {
  id: number;
  x: number;
  y: number;
  /** Pointer offset from the item's anchor, so it doesn't jump under the cursor. */
  ox: number;
  oy: number;
}

function Box({ seat, left, name, mine, onClick }: { seat: number; left: number; name: string; mine: boolean; onClick: () => void }) {
  const [x, y] = BOX_AT[seat as 0 | 1];
  const color = PLAYER_COLORS[seat]!;
  return (
    <g onClick={mine && left > 0 ? onClick : undefined} style={{ cursor: mine && left > 0 ? 'pointer' : 'default' }} opacity={left > 0 ? 1 : 0.45}>
      <rect x={x - 70} y={y} width={140} height={86} rx={6} fill="#d9a066" stroke="#2b2140" strokeWidth={4} />
      <path d={`M${x - 70} ${y} l-18 -22 h88 l18 22 M${x + 70} ${y} l18 -22 h-88 l-18 22`} fill="#c98b4f" stroke="#2b2140" strokeWidth={4} strokeLinejoin="round" />
      <rect x={x - 12} y={y} width={24} height={86} fill={color} opacity={0.85} />
      <text x={x} y={y + 50} fontSize={20} fontWeight={900} textAnchor="middle" fill="#2b2140">
        {left > 0 ? `${left} left` : 'empty'}
      </text>
      <text x={x} y={y + 76} fontSize={16} fontWeight={800} textAnchor="middle" fill="#2b2140">
        {name}
      </text>
      {mine && left > 0 && (
        <text x={x} y={y - 34} fontSize={18} fontWeight={900} textAnchor="middle" fill="#2b2140" className="wobble" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          click to unpack ↓
        </text>
      )}
    </g>
  );
}

/** The live room: unpack from your box, drag anything, watch your partner drag. */
export function RoomView() {
  const { act, send, socket, clockOffset } = useGame();
  const { s, me, partner } = useRoom();
  const svg = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const lastSent = useRef(0);
  const [theirs, setTheirs] = useState<{ item: number; x: number; y: number } | null>(null);
  const [now, setNow] = useState(Date.now());

  // The partner's live drag.
  useEffect(() => {
    const on = (d: { by: string; item: number; x: number; y: number }) => setTheirs({ item: d.item, x: d.x, y: d.y });
    socket.on('drag', on);
    return () => {
      socket.off('drag', on);
    };
  }, [socket]);
  // A new state means drops have landed: forget stale partner positions.
  const partnerHolding = partner ? s.held[partner.id] : null;
  useEffect(() => {
    if (partnerHolding === null || partnerHolding === undefined) setTheirs(null);
  }, [partnerHolding, s.items]);
  // Re-render while a hint is showing so it fades on time.
  useEffect(() => {
    if (!s.hint) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [s.hint]);

  const toWorld = (e: React.PointerEvent) => {
    const el = svg.current!;
    const pt = el.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(el.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  };

  const start = (e: React.PointerEvent, id: number) => {
    const item = s.items.find((i) => i.id === id)!;
    const p = toWorld(e);
    const d = { id, x: item.x, y: item.y, ox: p.x - item.x, oy: p.y - item.y };
    dragRef.current = d;
    setDrag(d);
    svg.current?.setPointerCapture(e.pointerId);
    void act('grab', { item: id }).then((r) => {
      if (!r.ok && dragRef.current?.id === id) {
        dragRef.current = null;
        setDrag(null);
      }
    });
  };
  const move = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const p = toWorld(e);
    const next = { ...d, x: p.x - d.ox, y: p.y - d.oy };
    dragRef.current = next;
    setDrag(next);
    if (performance.now() - lastSent.current > 33) {
      lastSent.current = performance.now();
      send('drag', { item: d.id, x: next.x, y: next.y });
    }
  };
  const end = () => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    void act('drop', { item: d.id, x: d.x, y: d.y }).finally(() => setDrag((cur) => (cur?.id === d.id ? null : cur)));
  };

  const v = variants(s.items);
  const wrong = new Set(s.wrong);
  const heldBy = new Map(Object.entries(s.held).filter(([, i]) => i !== null).map(([pid, i]) => [i as number, pid]));
  const nearest = (() => {
    if (!drag) return -1;
    let best = -1;
    let bestD = SNAP;
    s.slots.forEach((sl, i) => {
      const d = Math.hypot(sl.x - drag.x, sl.y - drag.y);
      const taken = s.items.some((o) => o.id !== drag.id && o.slot === i);
      if (d < bestD && !taken) {
        best = i;
        bestD = d;
      }
    });
    return best;
  })();
  const showHint = s.hint && s.hint.until > now + clockOffset;
  const names = s.players.map((p) => p.name);

  return (
    <Scene
      room={s.room}
      svgRef={svg}
      className="mx-auto block touch-none select-none rounded-2xl border-[3px] border-line"
      style={{ width: 'min(100%, calc((100dvh - 210px) * 16 / 9))' }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {drag &&
        s.slots.map((sl, i) => (
          <circle key={i} cx={sl.x} cy={sl.y - 12} r={i === nearest ? 22 : 9} fill={i === nearest ? 'rgba(61,220,151,0.35)' : 'rgba(43,33,64,0.18)'} stroke={i === nearest ? '#3ddc97' : 'none'} strokeWidth={4} />
        ))}
      {showHint && s.hint && (
        <g className="animate-pulse">
          <PlacedItem kind={s.hint.kind} x={s.hint.x} y={s.hint.y} variant={v.get(s.hint.item) ?? 0} ghost />
          <circle cx={s.hint.x} cy={s.hint.y - KINDS[s.hint.kind].h / 2} r={Math.max(KINDS[s.hint.kind].w, KINDS[s.hint.kind].h) / 2 + 16} fill="none" stroke="#ffc93c" strokeWidth={5} strokeDasharray="10 8" />
        </g>
      )}
      {[0, 1].map((seat) => (
        <Box key={seat} seat={seat} left={s.boxLeft[seat as 0 | 1]} name={names[seat] ?? ''} mine={seat === s.mySeat} onClick={() => void act('unpack')} />
      ))}
      {s.items
        .filter((i) => !i.inBox)
        // Whatever is being dragged is drawn last, on top of everything.
        .sort((a, b) => Number(a.id === drag?.id || heldBy.has(a.id)) - Number(b.id === drag?.id || heldBy.has(b.id)))
        .map((i) => {
          const mine = drag?.id === i.id;
          const theirsNow = theirs?.item === i.id && heldBy.get(i.id) === partner?.id ? theirs : null;
          const x = mine ? drag!.x : theirsNow ? theirsNow.x : i.x;
          const y = mine ? drag!.y : theirsNow ? theirsNow.y : i.y;
          const holder = heldBy.get(i.id);
          const ring = holder && holder !== me.id ? PLAYER_COLORS[s.players.findIndex((p) => p.id === holder)] : undefined;
          return (
            <g key={i.id} onPointerDown={(e) => start(e, i.id)} style={{ cursor: mine ? 'grabbing' : 'grab' }}>
              <PlacedItem kind={i.kind} x={x} y={y} variant={v.get(i.id) ?? 0} glow={wrong.has(i.id) && !mine} ring={ring} />
            </g>
          );
        })}
    </Scene>
  );
}
