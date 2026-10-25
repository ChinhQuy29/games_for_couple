import type { ReactNode } from 'react';
import { PROP_TYPES, type PropType } from '../../shared';

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

  // ---------- bedroom ----------
  bed: () => (
    <>
      <rect x={-130} y={-160} width={260} height={320} rx={18} fill="#8d5a2b" {...S} />
      <rect x={-118} y={-130} width={236} height={280} rx={14} fill="#fff6f0" {...S} />
      <path d="M-118,-30 H118 V136 a14,14 0 0 1 -14,14 H-104 a14,14 0 0 1 -14,-14 Z" fill="#7fb8f0" {...S} />
      <path d="M-118,-30 H118 V0 H-118 Z" fill="#a8d0f7" {...S} strokeWidth={2} />
      {[-60, 0, 60].map((x) => (
        <circle key={x} cx={x} cy={70} r={8} fill="#ffffff" opacity={0.55} />
      ))}
    </>
  ),
  wardrobe: () => (
    <>
      <rect x={-130} y={-40} width={260} height={80} rx={8} fill="#c98b4f" {...S} />
      <rect x={-130} y={-40} width={260} height={16} rx={6} fill="#a8693a" />
      <line x1={-43} y1={-40} x2={-43} y2={40} stroke={INK} strokeWidth={2} />
      <line x1={43} y1={-40} x2={43} y2={40} stroke={INK} strokeWidth={2} />
      {[-52, -34, 34, 52].map((x) => (
        <circle key={x} cx={x} cy={8} r={4} fill="#ffc93c" {...S} strokeWidth={1.5} />
      ))}
    </>
  ),
  desk: () => (
    <>
      <rect x={-100} y={-45} width={200} height={90} rx={10} fill="#dba56b" {...S} />
      <rect x={-88} y={-34} width={176} height={68} rx={6} fill="#e9bd85" />
      <rect x={-30} y={-20} width={60} height={36} rx={4} fill="#ffffff" {...S} strokeWidth={2} transform="rotate(-8)" />
      <line x1={-20} y1={-8} x2={18} y2={-13} stroke={INK} strokeWidth={1.5} opacity={0.4} />
      <line x1={-18} y1={2} x2={20} y2={-3} stroke={INK} strokeWidth={1.5} opacity={0.4} />
    </>
  ),
  teddy: () => (
    <>
      <circle cx={-18} cy={-22} r={10} fill="#c98b4f" {...S} />
      <circle cx={18} cy={-22} r={10} fill="#c98b4f" {...S} />
      <ellipse cx={0} cy={12} rx={22} ry={20} fill="#c98b4f" {...S} />
      <circle cx={0} cy={-10} r={18} fill="#dba56b" {...S} />
      <ellipse cx={0} cy={-4} rx={8} ry={6} fill="#f6e6c8" />
      <circle cx={-7} cy={-14} r={2.5} fill={INK} />
      <circle cx={7} cy={-14} r={2.5} fill={INK} />
      <circle cx={0} cy={-6} r={2.5} fill={INK} />
      <path d="M-8,8 L0,13 L8,8 L0,3 Z" fill="#ff4f8b" {...S} strokeWidth={1.5} />
    </>
  ),
  slippers: () => (
    <>
      <ellipse cx={-13} cy={2} rx={12} ry={23} fill="#ff8fb8" {...S} />
      <ellipse cx={13} cy={-2} rx={12} ry={23} fill="#ff8fb8" {...S} />
      <path d="M-24,-10 Q-13,-24 -2,-10" fill="#ffffff" {...S} strokeWidth={2} />
      <path d="M2,-14 Q13,-28 24,-14" fill="#ffffff" {...S} strokeWidth={2} />
    </>
  ),
  pillow: () => (
    <>
      <path d="M-40,-24 Q0,-32 40,-24 Q46,0 40,24 Q0,32 -40,24 Q-46,0 -40,-24 Z" fill="#ffffff" {...S} />
      <path d="M-28,-14 Q0,-20 28,-14" fill="none" stroke="#c7b8f0" strokeWidth={3} />
      <path d="M-28,14 Q0,20 28,14" fill="none" stroke="#c7b8f0" strokeWidth={3} />
    </>
  ),
  alarmClock: () => (
    <>
      <circle cx={-14} cy={-16} r={7} fill="#ffc93c" {...S} strokeWidth={2} />
      <circle cx={14} cy={-16} r={7} fill="#ffc93c" {...S} strokeWidth={2} />
      <circle r={18} fill="#ff4f4f" {...S} />
      <circle r={13} fill="#ffffff" {...S} strokeWidth={2} />
      <path d="M0,0 V-9 M0,0 L6,4" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
    </>
  ),
  guitar: () => (
    <>
      <rect x={-5} y={-58} width={10} height={58} rx={3} fill="#8d5a2b" {...S} strokeWidth={2} />
      <rect x={-9} y={-60} width={18} height={14} rx={4} fill={INK} />
      <circle cx={0} cy={6} r={16} fill="#ff9f43" {...S} />
      <circle cx={0} cy={34} r={22} fill="#ff9f43" {...S} />
      <rect x={-14} y={12} width={28} height={22} fill="#ff9f43" />
      <circle cx={0} cy={18} r={7} fill={INK} />
      <rect x={-10} y={36} width={20} height={5} rx={2} fill={INK} />
    </>
  ),
  basket: () => (
    <>
      <circle r={30} fill="#e9c99a" {...S} />
      <circle r={22} fill="#7fb8f0" {...S} strokeWidth={2} />
      <path d="M-14,-6 Q0,-18 14,-4 Q4,8 -12,8 Z" fill="#ff8fb8" {...S} strokeWidth={2} />
      <path d="M-4,4 Q10,0 14,14" fill="none" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" />
    </>
  ),

  // ---------- bathroom ----------
  bathtub: () => (
    <>
      <rect x={-160} y={-75} width={320} height={150} rx={60} fill="#ffffff" {...S} />
      <rect x={-140} y={-56} width={280} height={112} rx={46} fill="#9ad8f0" {...S} strokeWidth={2} />
      {[
        [-80, -20, 16],
        [-50, 20, 12],
        [60, -26, 14],
        [100, 18, 10],
        [10, 30, 9],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#ffffff" opacity={0.8} />
      ))}
      <rect x={128} y={-10} width={24} height={20} rx={6} fill="#b8c4cf" {...S} strokeWidth={2} />
    </>
  ),
  sinkUnit: () => (
    <>
      <rect x={-110} y={-40} width={220} height={80} rx={10} fill="#dfe7ee" {...S} />
      <ellipse cx={0} cy={6} rx={46} ry={26} fill="#ffffff" {...S} />
      <ellipse cx={0} cy={8} rx={34} ry={17} fill="#9ad8f0" />
      <rect x={-5} y={-36} width={10} height={20} rx={4} fill="#9aa6b2" {...S} strokeWidth={2} />
    </>
  ),
  toilet: () => (
    <>
      <rect x={-30} y={-44} width={60} height={26} rx={8} fill="#ffffff" {...S} />
      <ellipse cx={0} cy={12} rx={28} ry={32} fill="#ffffff" {...S} />
      <ellipse cx={0} cy={14} rx={18} ry={21} fill="#9ad8f0" {...S} strokeWidth={2} />
      <rect x={-8} y={-38} width={16} height={8} rx={3} fill="#b8c4cf" />
    </>
  ),
  towel: () => (
    <>
      <rect x={-35} y={-25} width={70} height={50} rx={8} fill="#3ddc97" {...S} />
      <rect x={-35} y={10} width={70} height={8} fill="#ffffff" opacity={0.75} />
      <path d="M-35,-12 Q0,-4 35,-12" fill="none" stroke={INK} strokeWidth={1.5} opacity={0.35} />
    </>
  ),
  soap: () => (
    <>
      <rect x={-21} y={-15} width={42} height={30} rx={12} fill="#ffc6dd" {...S} />
      <circle cx={-8} cy={-5} r={4} fill="#ffffff" opacity={0.85} />
      <circle cx={14} cy={-18} r={5} fill="#ffffff" {...S} strokeWidth={1.5} opacity={0.9} />
      <circle cx={22} cy={-8} r={3} fill="#ffffff" {...S} strokeWidth={1.5} opacity={0.9} />
    </>
  ),
  toothCup: () => (
    <>
      <circle r={16} fill="#4cc9f0" {...S} />
      <circle r={10} fill="#2b8cb0" />
      <rect x={-3} y={-24} width={6} height={22} rx={3} fill="#ff4f8b" {...S} strokeWidth={1.5} transform="rotate(-20)" />
      <rect x={-3} y={-24} width={6} height={22} rx={3} fill="#ffc93c" {...S} strokeWidth={1.5} transform="rotate(25)" />
    </>
  ),
  toiletRoll: () => (
    <>
      <circle r={19} fill="#ffffff" {...S} />
      <circle r={7} fill="#e8b84a" {...S} strokeWidth={2} />
      <path d="M19,0 Q24,14 16,22" fill="none" stroke={INK} strokeWidth={2} />
    </>
  ),
  shampoo: () => (
    <>
      <rect x={-15} y={-14} width={30} height={36} rx={10} fill="#a77bff" {...S} />
      <rect x={-7} y={-23} width={14} height={11} rx={3} fill="#ffffff" {...S} strokeWidth={2} />
      <rect x={-9} y={-2} width={18} height={14} rx={3} fill="#ffffff" opacity={0.8} />
    </>
  ),

  // ---------- classroom ----------
  blackboard: () => (
    <>
      <rect x={-220} y={-20} width={440} height={40} rx={4} fill="#a8693a" {...S} />
      <rect x={-210} y={-14} width={420} height={22} fill="#2f5d50" />
      <path d="M-180,-4 h40 M-120,-6 q10,-6 20,0 t20,0 M60,-4 h70 M150,-6 l14,6 l14,-6" stroke="#ffffff" strokeWidth={2} fill="none" opacity={0.8} />
      <rect x={-40} y={10} width={20} height={5} rx={2} fill="#ffffff" />
    </>
  ),
  schoolDesk: () => (
    <>
      <rect x={-60} y={-35} width={120} height={70} rx={8} fill="#e9bd85" {...S} />
      <rect x={-60} y={-35} width={120} height={12} rx={6} fill="#c98b4f" />
      <circle cx={42} cy={-29} r={3} fill={INK} />
    </>
  ),
  globe: () => (
    <>
      <circle r={26} fill="#4cc9f0" {...S} />
      <path d="M-14,-16 q10,-4 14,4 q-4,10 -12,8 q-6,-4 -2,-12 Z M4,6 q12,-6 16,4 q-2,12 -12,10 q-6,-6 -4,-14 Z M-20,8 q6,2 6,8 q-6,2 -8,-2 Z" fill="#3ddc97" {...S} strokeWidth={1.5} />
      <path d="M-26,0 A26,26 0 0 0 26,0" fill="none" stroke="#e8b84a" strokeWidth={4} transform="rotate(-25)" />
    </>
  ),
  backpack: () => (
    <>
      <rect x={-26} y={-30} width={52} height={62} rx={16} fill="#ff4f4f" {...S} />
      <rect x={-18} y={4} width={36} height={22} rx={8} fill="#c93a3a" {...S} strokeWidth={2} />
      <path d="M-12,-30 Q0,-42 12,-30" fill="none" stroke={INK} strokeWidth={4} />
      <line x1={-18} y1={-8} x2={18} y2={-8} stroke={INK} strokeWidth={2} opacity={0.5} />
    </>
  ),
  apple: () => (
    <>
      <path d="M0,-10 C-22,-22 -24,14 -6,17 Q0,15 6,17 C24,14 22,-22 0,-10 Z" fill="#ff4f4f" {...S} />
      <path d="M0,-10 Q2,-18 4,-20" stroke={INK} strokeWidth={2.5} fill="none" />
      <ellipse cx={9} cy={-17} rx={6} ry={3} fill="#3ddc97" {...S} strokeWidth={1.5} transform="rotate(-25 9 -17)" />
      <circle cx={-8} cy={-4} r={3} fill="#ffffff" opacity={0.7} />
    </>
  ),
  pencilCup: () => (
    <>
      <circle r={16} fill="#ffc93c" {...S} />
      <circle r={11} fill="#e0a91f" />
      {[
        [-5, -4, '#ff4f4f'],
        [5, -3, '#4cc9f0'],
        [0, 5, '#3ddc97'],
        [-6, 6, '#a77bff'],
      ].map(([x, y, c], i) => (
        <circle key={i} cx={x as number} cy={y as number} r={3.5} fill={c as string} {...S} strokeWidth={1.5} />
      ))}
    </>
  ),
  trophy: () => (
    <>
      <path d="M-20,-10 Q-30,-10 -26,2 Q-22,10 -12,8" fill="none" stroke={INK} strokeWidth={3} />
      <path d="M20,-10 Q30,-10 26,2 Q22,10 12,8" fill="none" stroke={INK} strokeWidth={3} />
      <circle r={20} fill="#ffc93c" {...S} />
      <circle r={12} fill="#ffe08a" {...S} strokeWidth={2} />
      <path d="M0,-6 L2,-2 L6,-2 L3,1 L4,6 L0,3 L-4,6 L-3,1 L-6,-2 L-2,-2 Z" fill="#e0a91f" />
    </>
  ),

  // ---------- beach ----------
  umbrella: () => (
    <>
      <circle r={88} fill="#ffffff" {...S} />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <path key={a} d="M0,0 L88,0 A88,88 0 0 1 44,76.2 Z" fill={a % 120 ? '#ffffff' : '#ff4f8b'} transform={`rotate(${a})`} {...S} strokeWidth={2} />
      ))}
      {[30, 150, 270].map((a) => (
        <path key={a} d="M0,0 L88,0 A88,88 0 0 1 44,76.2 Z" fill="#4cc9f0" transform={`rotate(${a})`} {...S} strokeWidth={2} />
      ))}
      <circle r={10} fill="#ffc93c" {...S} />
    </>
  ),
  palm: () => (
    <>
      {[0, 51, 103, 154, 206, 257, 309].map((a, i) => (
        <path
          key={a}
          d="M0,0 Q30,-22 98,-6 Q60,-2 0,0 Z M0,0 Q40,10 92,10 Q40,-4 0,0 Z"
          fill={i % 2 ? '#2fa36f' : '#3ddc97'}
          transform={`rotate(${a})`}
          {...S}
          strokeWidth={2.5}
        />
      ))}
      {[
        [-8, -6],
        [8, -4],
        [0, 9],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={9} fill="#8d5a2b" {...S} strokeWidth={2} />
      ))}
    </>
  ),
  beachTowel: () => (
    <>
      <rect x={-60} y={-105} width={120} height={210} rx={10} fill="#ffffff" {...S} />
      {[-75, -35, 5, 45].map((y) => (
        <rect key={y} x={-60} y={y} width={120} height={22} fill="#ffc93c" />
      ))}
      <rect x={-60} y={-105} width={120} height={210} rx={10} fill="none" {...S} />
      <path d="M-50,-105 v-8 M-30,-105 v-8 M-10,-105 v-8 M10,-105 v-8 M30,-105 v-8 M50,-105 v-8" stroke={INK} strokeWidth={2} />
    </>
  ),
  surfboard: () => (
    <>
      <path d="M0,-75 C26,-50 26,50 0,75 C-26,50 -26,-50 0,-75 Z" fill="#4cc9f0" {...S} />
      <path d="M0,-70 C10,-40 10,40 0,70" fill="none" stroke="#ffffff" strokeWidth={4} />
      <path d="M-13,-10 h26" stroke="#ff4f8b" strokeWidth={6} />
    </>
  ),
  sandcastle: () => (
    <>
      <rect x={-36} y={-34} width={72} height={68} rx={4} fill="#f1cf8a" {...S} />
      <rect x={-22} y={-20} width={44} height={40} rx={3} fill="#e2b866" {...S} strokeWidth={2} />
      {[
        [-36, -34],
        [36, -34],
        [-36, 34],
        [36, 34],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={11} fill="#e2b866" {...S} strokeWidth={2} />
      ))}
      <circle r={9} fill="#f1cf8a" {...S} strokeWidth={2} />
      <path d="M0,-9 V-24 L10,-20 L0,-16" fill="#ff4f4f" stroke={INK} strokeWidth={1.5} />
    </>
  ),
  beachBall: () => (
    <>
      <circle r={25} fill="#ffffff" {...S} />
      {[
        [0, '#ff4f4f'],
        [120, '#4cc9f0'],
        [240, '#ffc93c'],
      ].map(([a, c]) => (
        <path key={a as number} d="M0,0 L25,0 A25,25 0 0 1 12.5,21.65 Z" fill={c as string} transform={`rotate(${a})`} />
      ))}
      <circle r={25} fill="none" {...S} />
      <circle r={5} fill="#ffffff" {...S} strokeWidth={2} />
    </>
  ),
  shell: () => (
    <>
      <path d="M0,17 L-20,-4 Q-14,-19 0,-19 Q14,-19 20,-4 Z" fill="#ffc6dd" {...S} />
      {[-12, -6, 0, 6, 12].map((x) => (
        <line key={x} x1={0} y1={16} x2={x} y2={-17} stroke={INK} strokeWidth={1.5} opacity={0.4} />
      ))}
      <rect x={-6} y={14} width={12} height={6} rx={2} fill="#ffc6dd" {...S} strokeWidth={1.5} />
    </>
  ),
  crab: () => (
    <>
      {[-1, 1].map((sd) => (
        <g key={sd} transform={`scale(${sd},1)`}>
          <path d="M14,4 L28,12 M14,10 L26,18 M12,-2 L28,4" stroke={INK} strokeWidth={3} strokeLinecap="round" />
          <circle cx={24} cy={-12} r={8} fill="#ff6b4f" {...S} strokeWidth={2} />
          <path d="M24,-12 L32,-18" stroke={INK} strokeWidth={2} />
        </g>
      ))}
      <ellipse rx={18} ry={14} fill="#ff6b4f" {...S} />
      <circle cx={-6} cy={-12} r={4} fill="#ffffff" {...S} strokeWidth={1.5} />
      <circle cx={6} cy={-12} r={4} fill="#ffffff" {...S} strokeWidth={1.5} />
      <circle cx={-6} cy={-12} r={1.6} fill={INK} />
      <circle cx={6} cy={-12} r={1.6} fill={INK} />
    </>
  ),
  bucket: () => (
    <>
      <circle r={23} fill="#ff4f8b" {...S} />
      <circle r={16} fill="#f1cf8a" {...S} strokeWidth={2} />
      <path d="M-23,0 Q0,34 23,0" fill="none" stroke={INK} strokeWidth={2.5} />
      <rect x={-4} y={-30} width={8} height={22} rx={3} fill="#ffc93c" {...S} strokeWidth={1.5} transform="rotate(30)" />
    </>
  ),
  starfish: () => (
    <>
      <path
        d="M0,-22 L6,-7 L21,-7 L9,3 L14,19 L0,10 L-14,19 L-9,3 L-21,-7 L-6,-7 Z"
        fill="#ff9f43"
        {...S}
        strokeLinejoin="round"
      />
      {[
        [0, -10],
        [9, -2],
        [5, 9],
        [-5, 9],
        [-9, -2],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.8} fill="#ffffff" />
      ))}
    </>
  ),
};

export default function PropArt({ type }: { type: PropType }) {
  return <>{ART[type]()}</>;
}

/** Shrinks tall or wide props (a guitar, a surfboard) so they fit the icon. */
const iconScale = (type: PropType) => {
  const { w, h } = PROP_TYPES[type];
  return Math.min(type === 'chair' || type === 'books' || type === 'duck' ? 0.9 : 1, 92 / Math.max(w, h));
};

/** A small standalone icon of a prop, for buttons and lists. */
export function PropIcon({ type, size = 48 }: { type: PropType; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" aria-hidden>
      <g transform={`scale(${iconScale(type)})`}>
        <PropArt type={type} />
      </g>
    </svg>
  );
}
