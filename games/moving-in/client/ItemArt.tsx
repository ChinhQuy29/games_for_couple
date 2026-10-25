import { KINDS, type Kind } from '../shared';

// Hand-drawn items, each in its own box from (0, 0) to (w, h). Chunky outlines, flat colors,
// same sticker style as the rest of the portal.

const L = '#2b2140';
const sw = 3;
const P = { stroke: L, strokeWidth: sw, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** Little pictures for the six photo frames (one per room of the story). */
const FRAME_PICS = ['📱', '🧳', '🛏️', '🍜', '🪥', '🏠'];

export function ItemArt({ kind, variant = 0 }: { kind: Kind; variant?: number }) {
  const { w, h } = KINDS[kind];
  switch (kind) {
    case 'pillow':
      return <rect x={2} y={4} width={w - 4} height={h - 6} rx={18} fill={variant % 2 ? '#ffd6e5' : '#d6ecff'} {...P} />;
    case 'phone':
      return (
        <g>
          <rect x={2} y={2} width={w - 4} height={h - 4} rx={5} fill="#2b2140" {...P} />
          <rect x={6} y={7} width={w - 12} height={h - 16} rx={2} fill="#4cc9f0" />
          <text x={w / 2} y={h / 2 + 2} fontSize={11} textAnchor="middle">💗</text>
        </g>
      );
    case 'lamp':
      return (
        <g>
          <path d={`M8 34 L${w - 8} 34 L${w - 16} 4 L16 4 Z`} fill="#ffe08a" {...P} />
          <line x1={w / 2} y1={34} x2={w / 2} y2={h - 8} {...P} />
          <rect x={w / 2 - 14} y={h - 9} width={28} height={7} rx={3} fill="#9b5de5" {...P} />
        </g>
      );
    case 'controller':
      return (
        <g>
          <path d={`M10 6 H${w - 10} Q${w - 1} 6 ${w - 3} ${h - 4} Q${w - 10} ${h} ${w - 18} ${h - 10} H18 Q10 ${h} 3 ${h - 4} Q1 6 10 6 Z`} fill="#3a3346" {...P} />
          <circle cx={w - 18} cy={14} r={3} fill="#ff4f8b" />
          <circle cx={w - 11} cy={19} r={3} fill="#3ddc97" />
          <path d="M14 15 h10 M19 10 v10" stroke="#fff" strokeWidth={3} />
        </g>
      );
    case 'book':
      return (
        <g>
          <rect x={3} y={2} width={w - 6} height={h - 4} rx={3} fill={variant % 2 ? '#ff9f43' : '#3ddc97'} {...P} />
          <line x1={9} y1={4} x2={9} y2={h - 4} {...P} />
        </g>
      );
    case 'frame':
      return (
        <g>
          <rect x={2} y={2} width={w - 4} height={h - 4} rx={4} fill="#c98b4f" {...P} />
          <rect x={9} y={9} width={w - 18} height={h - 18} fill="#fff8e7" stroke={L} strokeWidth={2} />
          <text x={w / 2} y={h / 2 + 7} fontSize={20} textAnchor="middle">{FRAME_PICS[variant % FRAME_PICS.length]}</text>
        </g>
      );
    case 'plush':
      return (
        <g>
          <circle cx={16} cy={14} r={9} fill="#c98b4f" {...P} />
          <circle cx={w - 16} cy={14} r={9} fill="#c98b4f" {...P} />
          <ellipse cx={w / 2} cy={h - 18} rx={24} ry={17} fill="#d9a066" {...P} />
          <circle cx={w / 2} cy={26} r={20} fill="#d9a066" {...P} />
          <circle cx={w / 2 - 7} cy={23} r={2.5} fill={L} />
          <circle cx={w / 2 + 7} cy={23} r={2.5} fill={L} />
          <ellipse cx={w / 2} cy={31} rx={5} ry={3.5} fill="#ffd6e5" stroke={L} strokeWidth={2} />
        </g>
      );
    case 'camera':
      return (
        <g>
          <rect x={2} y={10} width={w - 4} height={h - 12} rx={6} fill="#3a3346" {...P} />
          <rect x={12} y={3} width={16} height={9} rx={2} fill="#3a3346" {...P} />
          <circle cx={w / 2} cy={h / 2 + 4} r={11} fill="#4cc9f0" {...P} />
        </g>
      );
    case 'sunglasses':
      return (
        <g>
          <ellipse cx={15} cy={h / 2 + 2} rx={13} ry={9} fill="#2b2140" {...P} />
          <ellipse cx={w - 15} cy={h / 2 + 2} rx={13} ry={9} fill="#2b2140" {...P} />
          <path d={`M28 ${h / 2} Q${w / 2} ${h / 2 - 6} ${w - 28} ${h / 2}`} fill="none" {...P} />
        </g>
      );
    case 'charger':
      return (
        <g>
          <rect x={5} y={8} width={w - 10} height={h - 10} rx={4} fill="#f5f5f5" {...P} />
          <path d="M12 8 v-6 M22 8 v-6" {...P} />
        </g>
      );
    case 'shoes':
      return (
        <g>
          <path d={`M3 ${h - 3} V12 Q3 6 12 8 L22 14 Q34 16 36 ${h - 3} Z`} fill={variant % 2 ? '#ff4f8b' : '#4cc9f0'} {...P} />
          <path d={`M42 ${h - 3} V12 Q42 6 51 8 L61 14 Q75 16 77 ${h - 3} Z`} fill={variant % 2 ? '#ff4f8b' : '#4cc9f0'} {...P} />
        </g>
      );
    case 'passport':
      return (
        <g>
          <rect x={3} y={2} width={w - 6} height={h - 4} rx={3} fill={variant % 2 ? '#7b1e3a' : '#1e3a7b'} {...P} />
          <circle cx={w / 2} cy={h / 2 - 2} r={7} fill="none" stroke="#ffc93c" strokeWidth={2} />
        </g>
      );
    case 'backpack':
      return (
        <g>
          <rect x={6} y={14} width={w - 12} height={h - 16} rx={18} fill="#3ddc97" {...P} />
          <path d={`M24 16 Q${w / 2} -6 ${w - 24} 16`} fill="none" {...P} />
          <rect x={18} y={h - 44} width={w - 36} height={28} rx={8} fill="#2bb57a" {...P} />
        </g>
      );
    case 'hat':
      return (
        <g>
          <ellipse cx={w / 2} cy={h - 9} rx={w / 2 - 3} ry={7} fill="#f2c57c" {...P} />
          <path d={`M18 ${h - 10} Q20 4 ${w / 2} 4 Q${w - 20} 4 ${w - 18} ${h - 10} Z`} fill="#f2c57c" {...P} />
          <path d={`M19 ${h - 18} H${w - 19}`} stroke="#ff4f8b" strokeWidth={6} />
        </g>
      );
    case 'perfume':
      return (
        <g>
          <rect x={3} y={18} width={w - 6} height={h - 20} rx={6} fill="#ffb3d1" {...P} />
          <rect x={9} y={6} width={w - 18} height={13} rx={2} fill="#ffc93c" {...P} />
        </g>
      );
    case 'scarf':
      return (
        <g>
          <path d={`M6 3 H${w - 6} V${h - 18} L${w - 12} ${h - 3} L12 ${h - 3} L6 ${h - 18} Z`} fill="#ff6b6b" {...P} />
          <path d={`M6 30 H${w - 6} M6 54 H${w - 6}`} stroke="#fff" strokeWidth={4} />
        </g>
      );
    case 'monitor':
      return (
        <g>
          <rect x={3} y={3} width={w - 6} height={h - 30} rx={6} fill="#2b2140" {...P} />
          <rect x={11} y={11} width={w - 22} height={h - 46} rx={3} fill="#4a3a6b" />
          <text x={w / 2} y={h / 2 - 6} fontSize={24} textAnchor="middle">⚔️</text>
          <path d={`M${w / 2 - 8} ${h - 27} V${h - 8} M${w / 2 - 30} ${h - 5} H${w / 2 + 30}`} {...P} />
        </g>
      );
    case 'keyboard':
      return (
        <g>
          <rect x={2} y={4} width={w - 4} height={h - 6} rx={5} fill="#3a3346" {...P} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <rect key={i} x={10 + i * 14} y={9} width={9} height={6} rx={1} fill={['#ff4f8b', '#ffc93c', '#3ddc97', '#4cc9f0'][i % 4]} />
          ))}
        </g>
      );
    case 'headphones':
      return (
        <g>
          <path d={`M10 ${h - 14} V28 Q10 4 ${w / 2} 4 Q${w - 10} 4 ${w - 10} 28 V${h - 14}`} fill="none" {...P} strokeWidth={5} />
          <rect x={2} y={h - 30} width={16} height={26} rx={6} fill="#ff4f8b" {...P} />
          <rect x={w - 18} y={h - 30} width={16} height={26} rx={6} fill="#ff4f8b" {...P} />
        </g>
      );
    case 'clock':
      return (
        <g>
          <circle cx={w / 2} cy={h / 2} r={w / 2 - 3} fill="#fff8e7" {...P} />
          <path d={`M${w / 2} ${h / 2} V14 M${w / 2} ${h / 2} H${w / 2 + 12}`} {...P} />
        </g>
      );
    case 'plant':
      return (
        <g>
          <path d={`M${w / 2} 44 Q8 30 6 8 Q24 14 ${w / 2} 44 Q${w - 8} 28 ${w - 6} 6 Q${w - 24} 14 ${w / 2} 44`} fill="#3ddc97" {...P} />
          <path d={`M10 44 H${w - 10} L${w - 15} ${h - 3} H15 Z`} fill="#e07a4f" {...P} />
        </g>
      );
    case 'mug':
      return (
        <g>
          <path d={`M${w - 12} 14 q12 0 10 12 q-2 8 -10 7`} fill="none" {...P} />
          <rect x={3} y={6} width={w - 15} height={h - 8} rx={5} fill={variant % 2 ? '#ffb3d1' : '#a8d8ff'} {...P} />
          <text x={(w - 12) / 2 + 1} y={h / 2 + 6} fontSize={12} textAnchor="middle">{variant % 2 ? '💗' : '💙'}</text>
        </g>
      );
    case 'noodles':
      return (
        <g>
          <path d={`M4 6 H${w - 4} L${w - 9} ${h - 3} H9 Z`} fill="#fff8e7" {...P} />
          <rect x={4} y={18} width={w - 8} height={16} fill="#ff4f4f" />
          <text x={w / 2} y={31} fontSize={10} textAnchor="middle" fill="#fff" fontWeight={800}>MÌ</text>
        </g>
      );
    case 'pan':
      return (
        <g>
          <path d={`M4 6 H66 Q64 ${h - 3} 35 ${h - 3} Q6 ${h - 3} 4 6 Z`} fill="#3a3346" {...P} />
          <rect x={64} y={6} width={w - 66} height={8} rx={4} fill="#c98b4f" {...P} />
        </g>
      );
    case 'kettle':
      return (
        <g>
          <path d={`M10 ${h - 3} Q4 22 20 16 H${w - 22} Q${w - 6} 22 ${w - 12} ${h - 3} Z`} fill="#4cc9f0" {...P} />
          <path d={`M20 16 Q${w / 2} -4 ${w - 22} 16`} fill="none" {...P} />
          <path d={`M10 30 L1 22`} {...P} />
        </g>
      );
    case 'board':
      return <rect x={2} y={4} width={w - 4} height={h - 6} rx={6} fill="#d9a066" {...P} />;
    case 'teapot':
      return (
        <g>
          <ellipse cx={w / 2} cy={h - 22} rx={24} ry={20} fill="#fff8e7" {...P} />
          <path d={`M${w / 2 + 22} 30 L${w - 3} 20`} {...P} />
          <path d={`M${w / 2 - 22} 26 q-14 4 -10 16`} fill="none" {...P} />
          <circle cx={w / 2} cy={14} r={5} fill="#ffb3d1" {...P} />
          <circle cx={w / 2} cy={h - 22} r={5} fill="#ffb3d1" />
        </g>
      );
    case 'cookies':
      return (
        <g>
          <rect x={4} y={14} width={w - 8} height={h - 16} rx={8} fill="#e7f6ff" {...P} />
          <rect x={10} y={4} width={w - 20} height={11} rx={3} fill="#ff9f43" {...P} />
          <circle cx={18} cy={36} r={7} fill="#d9a066" />
          <circle cx={32} cy={46} r={7} fill="#d9a066" />
        </g>
      );
    case 'fruit':
      return (
        <g>
          <circle cx={24} cy={18} r={11} fill="#ff4f4f" {...P} />
          <circle cx={42} cy={14} r={11} fill="#ffc93c" {...P} />
          <circle cx={58} cy={19} r={10} fill="#3ddc97" {...P} />
          <path d={`M3 22 H${w - 3} Q${w - 8} ${h - 3} ${w / 2} ${h - 3} Q8 ${h - 3} 3 22 Z`} fill="#4cc9f0" {...P} />
        </g>
      );
    case 'cupcake':
      return (
        <g>
          <path d={`M6 22 H${w - 6} L${w - 10} ${h - 3} H10 Z`} fill="#ff9f43" {...P} />
          <path d={`M5 22 Q4 6 ${w / 2} 6 Q${w - 4} 6 ${w - 5} 22 Z`} fill="#ffb3d1" {...P} />
          <circle cx={w / 2} cy={5} r={4} fill="#ff4f4f" {...P} />
        </g>
      );
    case 'toothbrush':
      return (
        <g>
          <rect x={4} y={14} width={6} height={h - 16} rx={3} fill={variant % 2 ? '#ff4f8b' : '#4cc9f0'} {...P} strokeWidth={2} />
          <rect x={2} y={2} width={10} height={14} rx={2} fill="#fff" {...P} strokeWidth={2} />
        </g>
      );
    case 'towel':
      return (
        <g>
          <rect x={3} y={3} width={w - 6} height={h - 6} rx={6} fill={variant % 2 ? '#ffb3d1' : '#a8d8ff'} {...P} />
          <path d={`M3 ${h - 22} H${w - 3}`} stroke="#fff" strokeWidth={5} />
        </g>
      );
    case 'shampoo':
      return (
        <g>
          <rect x={3} y={14} width={w - 6} height={h - 16} rx={7} fill="#9b5de5" {...P} />
          <rect x={10} y={4} width={w - 20} height={11} rx={2} fill="#fff" {...P} />
        </g>
      );
    case 'slippers':
      return (
        <g>
          <ellipse cx={19} cy={h - 9} rx={17} ry={8} fill={variant % 2 ? '#ffb3d1' : '#a8d8ff'} {...P} />
          <ellipse cx={w - 19} cy={h - 9} rx={17} ry={8} fill={variant % 2 ? '#ffb3d1' : '#a8d8ff'} {...P} />
          <path d={`M8 ${h - 12} Q19 2 30 ${h - 12} M${w - 30} ${h - 12} Q${w - 19} 2 ${w - 8} ${h - 12}`} fill="none" {...P} />
        </g>
      );
    case 'duck':
      return (
        <g>
          <path d={`M4 ${h - 16} Q4 ${h - 3} 24 ${h - 3} H${w - 8} Q${w - 2} ${h - 18} ${w - 14} ${h - 22} Q${w - 22} ${h - 24} 26 ${h - 18} Z`} fill="#ffc93c" {...P} />
          <circle cx={16} cy={16} r={12} fill="#ffc93c" {...P} />
          <path d="M3 16 L-6 20 L4 22" fill="#ff9f43" {...P} strokeWidth={2} />
          <circle cx={13} cy={13} r={2.5} fill={L} />
        </g>
      );
    case 'soap':
      return <rect x={2} y={3} width={w - 4} height={h - 5} rx={9} fill="#ffd6e5" {...P} />;
    case 'lotion':
      return (
        <g>
          <rect x={3} y={18} width={w - 6} height={h - 20} rx={6} fill="#fff8e7" {...P} />
          <path d={`M${w / 2} 18 V6 H${w - 4}`} fill="none" {...P} />
        </g>
      );
    case 'hairdryer':
      return (
        <g>
          <rect x={18} y={30} width={14} height={h - 32} rx={5} fill="#9b5de5" {...P} />
          <rect x={3} y={6} width={w - 18} height={26} rx={13} fill="#ffb3d1" {...P} />
          <rect x={w - 18} y={10} width={15} height={18} rx={3} fill="#fff" {...P} />
        </g>
      );
    case 'console':
      return (
        <g>
          <rect x={2} y={4} width={w - 4} height={h - 6} rx={6} fill="#f5f5f5" {...P} />
          <path d={`M14 ${h / 2 + 1} H40`} stroke="#4cc9f0" strokeWidth={4} />
        </g>
      );
    case 'posterLq':
      return (
        <g>
          <rect x={3} y={3} width={w - 6} height={h - 6} rx={4} fill="#1b2a5b" {...P} />
          <text x={w / 2} y={70} fontSize={46} textAnchor="middle">⚔️</text>
          <text x={w / 2} y={118} fontSize={18} textAnchor="middle" fill="#ffc93c" fontWeight={900}>LIÊN</text>
          <text x={w / 2} y={140} fontSize={18} textAnchor="middle" fill="#ffc93c" fontWeight={900}>QUÂN</text>
          <text x={w / 2} y={168} fontSize={11} textAnchor="middle" fill="#fff" fontWeight={700}>MOBILE</text>
        </g>
      );
    case 'posterSgp':
      return (
        <g>
          <rect x={3} y={3} width={w - 6} height={h - 6} rx={4} fill="#0d0d12" {...P} />
          <text x={w / 2} y={74} fontSize={48} textAnchor="middle">👻</text>
          <text x={w / 2} y={126} fontSize={30} textAnchor="middle" fill="#ff4f4f" fontWeight={900}>SGP</text>
          <text x={w / 2} y={156} fontSize={11} textAnchor="middle" fill="#fff" fontWeight={700}>SAIGON PHANTOM</text>
        </g>
      );
    case 'cushion':
      return (
        <g>
          <rect x={4} y={4} width={w - 8} height={h - 8} rx={16} fill={variant % 2 ? '#ffb3d1' : '#ffe08a'} {...P} />
          <text x={w / 2} y={h / 2 + 8} fontSize={22} textAnchor="middle">{variant % 2 ? '💗' : '⭐'}</text>
        </g>
      );
    case 'candle':
      return (
        <g>
          <rect x={6} y={18} width={w - 12} height={h - 20} rx={4} fill="#fff8e7" {...P} />
          <path d={`M${w / 2} 4 Q${w / 2 + 7} 12 ${w / 2} 17 Q${w / 2 - 7} 12 ${w / 2} 4 Z`} fill="#ff9f43" stroke={L} strokeWidth={2} />
        </g>
      );
  }
}
