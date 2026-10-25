import type { ReactNode } from 'react';
import { FLOOR, H, KINDS, ROOMS, W, type Item, type Kind } from '../shared';
import { FurnitureArt } from './FurnitureArt';
import { ItemArt } from './ItemArt';

/** Which copy of a kind this is (0, 1, …), so pairs like two mugs look different. */
export function variants(items: Item[]): Map<number, number> {
  const seen = new Map<Kind, number>();
  const out = new Map<number, number>();
  for (const i of items) {
    const n = seen.get(i.kind) ?? 0;
    out.set(i.id, n);
    seen.set(i.kind, n + 1);
  }
  return out;
}

export function PlacedItem({ kind, x, y, variant, glow, ring, ghost }: { kind: Kind; x: number; y: number; variant: number; glow?: boolean; ring?: string; ghost?: boolean }) {
  const { w, h } = KINDS[kind];
  return (
    <g
      transform={`translate(${x - w / 2} ${y - h})`}
      opacity={ghost ? 0.45 : 1}
      style={glow ? { filter: 'drop-shadow(0 0 6px #ff3b3b) drop-shadow(0 0 10px #ff3b3b)' } : undefined}
    >
      {ring && <rect x={-6} y={-6} width={w + 12} height={h + 12} rx={10} fill="none" stroke={ring} strokeWidth={4} strokeDasharray="8 6" />}
      <ItemArt kind={kind} variant={variant} />
    </g>
  );
}

/** The room itself: wall, floor, furniture, then whatever the caller draws on top. */
export function Scene({ room, children, className, svgRef, ...rest }: { room: number; children?: ReactNode; className?: string; svgRef?: React.Ref<SVGSVGElement> } & React.SVGProps<SVGSVGElement>) {
  const def = ROOMS[room]!;
  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className={className} {...rest}>
      <rect x={0} y={0} width={W} height={FLOOR} fill={def.wall} />
      <rect x={0} y={FLOOR} width={W} height={H - FLOOR} fill={def.floor} />
      <path d={`M0 ${FLOOR} H${W}`} stroke="#2b2140" strokeWidth={5} />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M${i * 200 + 100} ${FLOOR} V${H}`} stroke="rgba(0,0,0,0.08)" strokeWidth={3} />
      ))}
      {def.furniture.map((f, i) => (
        <FurnitureArt key={i} f={f} />
      ))}
      {children}
    </svg>
  );
}

/** A finished room: every slot filled with its item. For the photos at the end. */
export function SolvedScene({ room, className }: { room: number; className?: string }) {
  const def = ROOMS[room]!;
  const items: Item[] = def.slots.map((s, i) => ({ id: i, kind: s.kind, owner: 0, inBox: false, x: s.x, y: s.y, slot: i }));
  const v = variants(items);
  return (
    <Scene room={room} className={className}>
      {items.map((i) => (
        <PlacedItem key={i.id} kind={i.kind} x={i.x} y={i.y} variant={v.get(i.id) ?? 0} />
      ))}
    </Scene>
  );
}
