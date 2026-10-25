import type { Furniture } from '../shared';

// Furniture is scenery: drawn from its rectangle (x, y = top-left; y is the surface things sit on).

const L = '#2b2140';
const P = { stroke: L, strokeWidth: 4, strokeLinejoin: 'round' as const };

export function FurnitureArt({ f }: { f: Furniture }) {
  const { x, y, w, h } = f;
  switch (f.t) {
    case 'window':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={8} fill="#bfe6ff" {...P} />
          <path d={`M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}`} {...P} />
          <circle cx={x + w * 0.75} cy={y + h * 0.28} r={14} fill="#fff6c8" />
          <rect x={x - 10} y={y + h} width={w + 20} height={12} rx={4} fill="#fff" {...P} />
        </g>
      );
    case 'bed':
      return (
        <g>
          <rect x={x} y={y - 70} width={24} height={h + 70} rx={6} fill="#c98b4f" {...P} />
          <rect x={x + w - 24} y={y - 30} width={24} height={h + 30} rx={6} fill="#c98b4f" {...P} />
          <rect x={x + 10} y={y} width={w - 20} height={60} rx={12} fill="#fff8e7" {...P} />
          <rect x={x + w * 0.35} y={y + 4} width={w * 0.6} height={52} rx={10} fill="#ffb3d1" {...P} />
          <rect x={x + 10} y={y + 60} width={w - 20} height={h - 60} fill="#a86d3a" {...P} />
        </g>
      );
    case 'nightstand':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={6} fill="#d9a066" {...P} />
          <path d={`M${x} ${y + h / 2} H${x + w}`} {...P} />
          <circle cx={x + w / 2} cy={y + h / 4 + 2} r={4} fill={L} />
          <circle cx={x + w / 2} cy={y + (h * 3) / 4} r={4} fill={L} />
        </g>
      );
    case 'shelf':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={3} fill="#c98b4f" {...P} />
          <path d={`M${x + 16} ${y + h} l14 22 M${x + w - 16} ${y + h} l-14 22`} {...P} strokeWidth={3} />
        </g>
      );
    case 'divider':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} fill="#2b2140" />
          <text x={x + w / 2} y={400} fontSize={30} textAnchor="middle">📞</text>
          <text x={x + w / 2} y={450} fontSize={22} textAnchor="middle">💗</text>
          <text x={x + w / 2} y={500} fontSize={30} textAnchor="middle">📞</text>
        </g>
      );
    case 'door':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={6} fill="#a86d3a" {...P} />
          <rect x={x + 20} y={y + 24} width={w - 40} height={h / 2 - 40} rx={4} fill="none" {...P} strokeWidth={3} />
          <circle cx={x + w - 24} cy={y + h / 2 + 20} r={7} fill="#ffc93c" {...P} strokeWidth={3} />
          <text x={x + w / 2} y={y + 70} fontSize={22} textAnchor="middle" fill="#fff8e7" fontWeight={900}>
            204
          </text>
        </g>
      );
    case 'hooks':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={3} fill="#c98b4f" {...P} />
          <path d={`M${x + 30} ${y + h} v14 q0 8 8 6 M${x + 118} ${y + h} v14 q0 8 8 6`} fill="none" {...P} strokeWidth={3} />
        </g>
      );
    case 'chair':
      return (
        <g>
          <rect x={x + w - 20} y={y - 110} width={18} height={h + 110} rx={5} fill="#c98b4f" {...P} />
          <rect x={x} y={y} width={w} height={18} rx={5} fill="#d9a066" {...P} />
          <path d={`M${x + 10} ${y + 18} V${y + h} M${x + w - 10} ${y + 18} V${y + h}`} {...P} />
        </g>
      );
    case 'desk':
      return (
        <g>
          <rect x={x} y={y} width={w} height={22} rx={5} fill="#d9a066" {...P} />
          <rect x={x + w - 110} y={y + 22} width={100} height={h - 22} fill="#c98b4f" {...P} />
          <path d={`M${x + 14} ${y + 22} V${y + h}`} {...P} strokeWidth={6} />
        </g>
      );
    case 'counter':
      return (
        <g>
          <rect x={x} y={y + 18} width={w} height={h - 18} fill="#fff8e7" {...P} />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={x + 14 + (i * (w - 28)) / 4} y={y + 40} width={(w - 28) / 4 - 14} height={h - 64} rx={4} fill="none" {...P} strokeWidth={3} />
              <circle cx={x + 14 + (i * (w - 28)) / 4 + (w - 28) / 8 - 7} cy={y + 60} r={4} fill={L} />
            </g>
          ))}
          <rect x={x - 6} y={y} width={w + 12} height={20} rx={4} fill="#9aa0aa" {...P} />
        </g>
      );
    case 'stove':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={4} fill="#e8e8ee" {...P} />
          <rect x={x + 20} y={y + 50} width={w - 40} height={h - 80} rx={6} fill="#3a3346" {...P} />
          <circle cx={x + 40} cy={y + 26} r={8} fill={L} />
          <circle cx={x + w - 40} cy={y + 26} r={8} fill={L} />
        </g>
      );
    case 'fridge':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={14} fill="#f5f5f5" {...P} />
          <path d={`M${x} ${y + 180} H${x + w}`} {...P} />
          <path d={`M${x + 24} ${y + 50} v60 M${x + 24} ${y + 220} v80`} {...P} strokeWidth={6} />
          <text x={x + w - 50} y={y + 120} fontSize={24}>🧲</text>
          <text x={x + w - 70} y={y + 280} fontSize={30}>📝</text>
        </g>
      );
    case 'table':
      return (
        <g>
          <rect x={x} y={y} width={w} height={20} rx={5} fill="#d9a066" {...P} />
          <path d={`M${x + 24} ${y + 20} V${y + h} M${x + w - 24} ${y + 20} V${y + h}`} {...P} strokeWidth={8} />
        </g>
      );
    case 'sink':
      return (
        <g>
          <rect x={x} y={y + 20} width={w} height={h - 20} rx={6} fill="#fff8e7" {...P} />
          <path d={`M${x + 30} ${y + 50} H${x + w / 2 - 20} M${x + w / 2 + 20} ${y + 50} H${x + w - 30}`} {...P} />
          <rect x={x - 6} y={y} width={w + 12} height={22} rx={8} fill="#f5f5f5" {...P} />
          <path d={`M${x + w / 2} ${y} v-24 h24`} fill="none" {...P} strokeWidth={6} />
        </g>
      );
    case 'mirror':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={w / 2} fill="#e7f6ff" {...P} />
          <path d={`M${x + 50} ${y + 60} l40 -30 M${x + 50} ${y + 100} l70 -55`} stroke="#fff" strokeWidth={8} strokeLinecap="round" />
        </g>
      );
    case 'bathtub':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h - 20} rx={40} fill="#fff" {...P} />
          <rect x={x + 20} y={y + 6} width={w - 40} height={30} rx={14} fill="#bfe6ff" />
          <circle cx={x + 50} cy={y + h - 10} r={10} fill="#ffc93c" {...P} />
          <circle cx={x + w - 50} cy={y + h - 10} r={10} fill="#ffc93c" {...P} />
        </g>
      );
    case 'rail':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={7} fill="#9aa0aa" {...P} />
        </g>
      );
    case 'sofa':
      return (
        <g>
          <rect x={x + 20} y={y - 10} width={w - 40} height={90} rx={20} fill="#9b5de5" {...P} />
          <rect x={x} y={y + 60} width={w} height={90} rx={24} fill="#b47bff" {...P} />
          <rect x={x - 10} y={y + 30} width={60} height={120} rx={20} fill="#9b5de5" {...P} />
          <rect x={x + w - 50} y={y + 30} width={60} height={120} rx={20} fill="#9b5de5" {...P} />
          <path d={`M${x + 40} ${y + 150} v${h - 150} M${x + w - 40} ${y + 150} v${h - 150}`} {...P} strokeWidth={8} />
        </g>
      );
    case 'tv':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={10} fill="#2b2140" {...P} />
          <rect x={x + 12} y={y + 12} width={w - 24} height={h - 24} rx={4} fill="#4a3a6b" />
          <text x={x + w / 2} y={y + h / 2 + 14} fontSize={40} textAnchor="middle">🎮</text>
        </g>
      );
    case 'tvstand':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={8} fill="#c98b4f" {...P} />
          <path d={`M${x + w / 2} ${y} V${y + h}`} {...P} />
        </g>
      );
    case 'rug':
      return <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} fill="#ff9f43" opacity={0.6} {...P} strokeWidth={3} />;
    // ---------- decoration ----------
    case 'curtains': {
      // Drawn around a window rect: a rod and two gathered panels.
      const panel = (x0: number, dir: 1 | -1) => (
        <path
          d={`M${x0} ${y - 8} h${dir * 62} q${dir * -14} ${h / 2} ${dir * -4} ${h + 40} q${dir * -14} 10 ${dir * -28} 0 q${dir * -14} 10 ${dir * -30} 0 Z`}
          fill="#ff9fb2"
          {...P}
          strokeWidth={3}
        />
      );
      return (
        <g>
          {panel(x - 40, 1)}
          {panel(x + w + 40, -1)}
          <path d={`M${x - 26} ${y + h * 0.5} l40 6 M${x + w + 26} ${y + h * 0.5} l-40 6`} stroke="#ffc93c" strokeWidth={6} strokeLinecap="round" />
          <rect x={x - 54} y={y - 16} width={w + 108} height={10} rx={5} fill="#c98b4f" {...P} strokeWidth={3} />
        </g>
      );
    }
    case 'garland': {
      // Fairy lights sagging between two points.
      const bulbs = Math.max(4, Math.round(w / 45));
      const colors = ['#ffc93c', '#ff4f8b', '#4cc9f0', '#3ddc97'];
      return (
        <g>
          <path d={`M${x} ${y} Q${x + w / 2} ${y + 60} ${x + w} ${y}`} fill="none" stroke={L} strokeWidth={2.5} />
          {Array.from({ length: bulbs + 1 }, (_, i) => {
            const t = i / bulbs;
            const bx = x + w * t;
            const by = y + 2 * (1 - t) * t * 60 + 6;
            return <circle key={i} cx={bx} cy={by} r={7} fill={colors[i % 4]} stroke={L} strokeWidth={2} style={{ filter: `drop-shadow(0 0 5px ${colors[i % 4]})` }} />;
          })}
        </g>
      );
    }
    case 'wallart':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={4} fill="#fff8e7" {...P} />
          <rect x={x + 12} y={y + 12} width={w - 24} height={h - 24} fill="#bfe6ff" />
          <circle cx={x + w * 0.7} cy={y + h * 0.38} r={Math.min(w, h) * 0.12} fill="#ffc93c" />
          <path d={`M${x + 12} ${y + h - 12} L${x + w * 0.38} ${y + h * 0.48} L${x + w * 0.58} ${y + h * 0.7} L${x + w * 0.72} ${y + h * 0.56} L${x + w - 12} ${y + h - 12} Z`} fill="#3ddc97" />
        </g>
      );
    case 'floorlamp':
      return (
        <g>
          <path d={`M${x + w / 2} ${y + 40} V${y + h - 6}`} {...P} strokeWidth={5} />
          <ellipse cx={x + w / 2} cy={y + h - 5} rx={w / 2} ry={7} fill="#3a3346" {...P} strokeWidth={3} />
          <path d={`M${x - 8} ${y + 44} L${x + w + 8} ${y + 44} L${x + w - 6} ${y} L${x + 6} ${y} Z`} fill="#ffe08a" {...P} strokeWidth={3} style={{ filter: 'drop-shadow(0 6px 14px rgba(255,224,138,0.9))' }} />
        </g>
      );
    case 'bigplant':
      return (
        <g>
          {[-50, -20, 10, 40, 70].map((a, i) => (
            <ellipse
              key={i}
              cx={x + w / 2}
              cy={y + h * 0.42}
              rx={w * 0.17}
              ry={h * 0.32}
              fill={i % 2 ? '#3ddc97' : '#2bb57a'}
              stroke={L}
              strokeWidth={3}
              transform={`rotate(${a - 10} ${x + w / 2} ${y + h * 0.7})`}
            />
          ))}
          <path d={`M${x + 8} ${y + h * 0.68} H${x + w - 8} L${x + w - 18} ${y + h} H${x + 18} Z`} fill="#e07a4f" {...P} strokeWidth={3} />
        </g>
      );
    case 'suitcase':
      return (
        <g>
          <path d={`M${x + w * 0.35} ${y} v-14 h${w * 0.3} v14`} fill="none" {...P} strokeWidth={4} />
          <rect x={x} y={y} width={w} height={h} rx={12} fill="#ff6b6b" {...P} />
          <path d={`M${x + w * 0.3} ${y} V${y + h} M${x + w * 0.7} ${y} V${y + h}`} stroke="#c94b4b" strokeWidth={4} />
          <circle cx={x + w * 0.5} cy={y + h * 0.5} r={10} fill="#ffc93c" stroke={L} strokeWidth={2} />
        </g>
      );
    case 'tiles':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} fill="#ffffff" opacity={0.75} />
          {Array.from({ length: Math.floor(w / 40) + 1 }, (_, i) => (
            <path key={`v${i}`} d={`M${x + i * 40} ${y} V${y + h}`} stroke="#9fd8c0" strokeWidth={2} />
          ))}
          {Array.from({ length: Math.floor(h / 40) + 1 }, (_, i) => (
            <path key={`h${i}`} d={`M${x} ${y + i * 40} H${x + w}`} stroke="#9fd8c0" strokeWidth={2} />
          ))}
        </g>
      );
    case 'pendant':
      return (
        <g>
          <path d={`M${x + w / 2} ${y} V${y + h - 40}`} {...P} strokeWidth={3} />
          <path d={`M${x - 10} ${y + h} Q${x + w / 2} ${y + h - 70} ${x + w + 10} ${y + h} Z`} fill="#ff9f43" {...P} strokeWidth={3} />
          <circle cx={x + w / 2} cy={y + h + 4} r={9} fill="#fff6c8" style={{ filter: 'drop-shadow(0 0 12px #ffe08a)' }} />
        </g>
      );
  }
}
