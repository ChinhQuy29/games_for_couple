import type { ReactNode } from 'react';
import type { PropType } from '../../shared';

// Top-down cartoon drawings of every prop, centered on (0,0) and sized to the
// footprint in shared/constants.ts. Same art on every screen, so a fake lamp
// looks exactly like a real lamp (no emoji, which differ between devices).

const INK = '#2b2140';
const S = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const };

const ART: Record<PropType, () => ReactNode> = {
  // ---------- living room ----------
  sofa: () => (
    <>
      <rect x={-150} y={-60} width={300} height={120} rx={22} fill="#7b5ec4" {...S} />
      <rect x={-150} y={22} width={300} height={38} rx={14} fill="#5d43a3" {...S} />
      <rect x={-150} y={-60} width={34} height={120} rx={14} fill="#5d43a3" {...S} />
      <rect x={116} y={-60} width={34} height={120} rx={14} fill="#5d43a3" {...S} />
      <line x1={-38} y1={-52} x2={-38} y2={20} stroke={INK} strokeWidth={2} opacity={0.4} />
      <line x1={38} y1={-52} x2={38} y2={20} stroke={INK} strokeWidth={2} opacity={0.4} />
    </>
  ),
  tv: () => (
    <>
      <rect x={-110} y={-20} width={220} height={40} rx={6} fill={INK} {...S} />
      <rect x={-100} y={-12} width={200} height={14} rx={3} fill="#4cc9f0" opacity={0.85} />
    </>
  ),
  coffeeTable: () => (
    <>
      <rect x={-100} y={-55} width={200} height={110} rx={16} fill="#c98b4f" {...S} />
      <rect x={-84} y={-40} width={168} height={80} rx={10} fill="#dba56b" />
    </>
  ),
  plant: () => (
    <>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-20} rx={10} ry={20} fill={a % 144 ? '#3ddc97' : '#2fa36f'} transform={`rotate(${a})`} {...S} />
      ))}
      <circle r={14} fill="#d9764a" {...S} />
      <circle r={6} fill="#8a4b2b" />
    </>
  ),
  lamp: () => (
    <>
      <circle r={28} fill="#ffe08a" {...S} />
      <circle r={18} fill="none" stroke="#e8b84a" strokeWidth={3} />
      <circle r={7} fill="#fff6c9" {...S} />
    </>
  ),
  cushion: () => (
    <>
      <rect x={-28} y={-28} width={56} height={56} rx={16} fill="#ff4f8b" {...S} />
      <path d="M-28,-28 L28,28 M28,-28 L-28,28" stroke={INK} strokeWidth={1.5} opacity={0.25} />
      <circle r={5} fill="#c9306a" {...S} strokeWidth={2} />
    </>
  ),
  vase: () => (
    <>
      <circle r={20} fill="#4cc9f0" {...S} />
      <circle r={9} fill={INK} />
      <circle cx={-4} cy={-14} r={5} fill="#ff4f8b" {...S} strokeWidth={2} />
      <circle cx={8} cy={-9} r={5} fill="#ffc93c" {...S} strokeWidth={2} />
    </>
  ),
  books: () => (
    <>
      <rect x={-33} y={-24} width={66} height={48} rx={4} fill="#4cc9f0" {...S} transform="rotate(-6)" />
      <rect x={-29} y={-20} width={58} height={40} rx={4} fill="#ffc93c" {...S} transform="rotate(5)" />
      <rect x={-24} y={-15} width={48} height={30} rx={3} fill="#ff4f8b" {...S} />
      <line x1={-24} y1={0} x2={24} y2={0} stroke={INK} strokeWidth={2} opacity={0.4} />
    </>
  ),
  mug: () => (
    <>
      <rect x={12} y={-5} width={9} height={10} rx={3} fill="#ffffff" {...S} />
      <circle r={14} fill="#ffffff" {...S} />
      <circle r={9} fill="#6b3e1f" />
    </>
  ),
  chair: () => (
    <>
      <rect x={-32} y={-30} width={64} height={62} rx={12} fill="#c98b4f" {...S} />
      <rect x={-36} y={-40} width={72} height={18} rx={7} fill="#8d5a2b" {...S} />
    </>
  ),

  // ---------- kitchen ----------
  counter: () => (
    <>
      <rect x={-180} y={-45} width={360} height={90} rx={8} fill="#e8e2d6" {...S} />
      <rect x={-180} y={-45} width={360} height={14} rx={6} fill="#cfc6b4" />
      <rect x={120} y={-20} width={46} height={34} rx={8} fill="#b8c4cf" {...S} strokeWidth={2} />
    </>
  ),
  fridge: () => (
    <>
      <rect x={-60} y={-55} width={120} height={110} rx={10} fill="#dfe7ee" {...S} />
      <line x1={0} y1={-55} x2={0} y2={55} stroke={INK} strokeWidth={2} opacity={0.5} />
      <rect x={-12} y={35} width={24} height={8} rx={3} fill="#9aa6b2" />
    </>
  ),
  diningTable: () => (
    <>
      <rect x={-130} y={-80} width={260} height={160} rx={22} fill="#a8693a" {...S} />
      <rect x={-112} y={-64} width={224} height={128} rx={16} fill="#bd7f4c" />
    </>
  ),
  pot: () => (
    <>
      <rect x={-34} y={-6} width={68} height={12} rx={5} fill="#5e6470" {...S} strokeWidth={2} />
      <circle r={24} fill="#8a8f99" {...S} />
      <circle r={15} fill="#a7adb7" {...S} strokeWidth={2} />
      <circle r={4} fill={INK} />
    </>
  ),
  toaster: () => (
    <>
      <rect x={-31} y={-23} width={62} height={46} rx={12} fill="#c0c6cf" {...S} />
      <rect x={-20} y={-12} width={40} height={6} rx={3} fill={INK} />
      <rect x={-20} y={4} width={40} height={6} rx={3} fill={INK} />
    </>
  ),
  bottle: () => (
    <>
      <circle r={13} fill="#3ddc97" opacity={0.85} {...S} />
      <circle r={5} fill={INK} />
    </>
  ),
  stool: () => (
    <>
      <circle r={25} fill="#ffc93c" {...S} />
      <circle r={15} fill="none" stroke="#e0a91f" strokeWidth={3} />
    </>
  ),
  fruitBowl: () => (
    <>
      <circle r={32} fill="#f6e6c8" {...S} />
      <circle cx={-10} cy={-6} r={10} fill="#ff4f4f" {...S} strokeWidth={2} />
      <circle cx={10} cy={-8} r={9} fill="#ffc93c" {...S} strokeWidth={2} />
      <circle cx={0} cy={10} r={10} fill="#ff9f43" {...S} strokeWidth={2} />
    </>
  ),

  // ---------- park ----------
  tree: () => (
    <>
      {[
        [0, 0, 70],
        [-48, -30, 46],
        [50, -24, 48],
        [-38, 42, 44],
        [44, 44, 42],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={i ? '#2fa36f' : '#3ddc97'} {...S} />
      ))}
      <circle r={22} fill="#3ddc97" opacity={0.9} />
    </>
  ),
  bench: () => (
    <>
      <rect x={-85} y={-30} width={170} height={60} rx={8} fill="#a8693a" {...S} />
      {[-15, 0, 15].map((y) => (
        <line key={y} x1={-80} y1={y} x2={80} y2={y} stroke={INK} strokeWidth={2} opacity={0.45} />
      ))}
    </>
  ),
  bush: () => (
    <>
      {[
        [-20, -8, 26],
        [20, -10, 24],
        [0, 14, 26],
        [-26, 18, 18],
        [28, 16, 18],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? '#56c97d' : '#3fb267'} {...S} />
      ))}
    </>
  ),
  rock: () => (
    <>
      <path d="M-32,6 L-22,-20 L4,-27 L28,-14 L34,10 L14,26 L-18,25 Z" fill="#a3a8b4" {...S} />
      <path d="M-10,-14 L8,-18 L18,-6" fill="none" stroke="#ffffff" strokeWidth={3} opacity={0.5} />
    </>
  ),
  flower: () => (
    <>
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={0} cy={-12} r={9} fill="#ff8fb8" transform={`rotate(${a})`} {...S} strokeWidth={2} />
      ))}
      <circle r={7} fill="#ffc93c" {...S} strokeWidth={2} />
    </>
  ),
  duck: () => (
    <>
      <ellipse cx={-4} cy={2} rx={24} ry={18} fill="#fff6c9" {...S} />
      <path d="M-24,2 L-34,-6 L-30,8 Z" fill="#fff6c9" {...S} strokeWidth={2} />
      <circle cx={16} cy={-6} r={12} fill="#2fa36f" {...S} />
      <path d="M26,-8 L36,-4 L26,0 Z" fill="#ff9f43" {...S} strokeWidth={2} />
      <circle cx={18} cy={-9} r={2} fill={INK} />
    </>
  ),
  mushroom: () => (
    <>
      <circle r={20} fill="#ff4f4f" {...S} />
      <circle cx={-8} cy={-6} r={4} fill="#ffffff" />
      <circle cx={7} cy={-9} r={3} fill="#ffffff" />
      <circle cx={5} cy={8} r={4} fill="#ffffff" />
      <circle cx={-6} cy={9} r={2.5} fill="#ffffff" />
    </>
  ),
  bin: () => (
    <>
      <circle r={25} fill="#2fa36f" {...S} />
      <circle r={17} fill="#24865a" {...S} strokeWidth={2} />
      <rect x={-8} y={-3} width={16} height={6} rx={3} fill={INK} />
    </>
  ),
  lampPost: () => (
    <>
      <circle r={24} fill="#ffe08a" opacity={0.35} />
      <circle r={14} fill="#ffe08a" {...S} />
      <circle r={6} fill="#5e6470" {...S} strokeWidth={2} />
    </>
  ),
};

export default function PropArt({ type }: { type: PropType }) {
  return <>{ART[type]()}</>;
}

/** A small standalone icon of a prop, for buttons and lists. */
export function PropIcon({ type, size = 48 }: { type: PropType; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" aria-hidden>
      <g transform={type === 'chair' || type === 'books' || type === 'duck' ? 'scale(0.9)' : undefined}>
        <PropArt type={type} />
      </g>
    </svg>
  );
}
