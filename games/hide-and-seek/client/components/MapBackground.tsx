import type { MapId } from '../../shared';

// Floors, rugs, paths, water and sand: decoration only, never shootable.
// Matches the spots in server/content/maps.ts.

const INK = '#2b2140';

/** A soft patch of sunlight from a window. */
const Sun = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => (
  <path d={`M${x},${y} h${w} l${w * 0.6},${h} h${-w} Z`} fill="#fff6c9" opacity={0.28} />
);

/** The room's walls: a thick border with a soft inner shadow. */
const Walls = ({ color }: { color: string }) => (
  <>
    <rect x={14} y={14} width={1572} height={972} fill="none" stroke="#000000" strokeWidth={10} opacity={0.08} />
    <rect x={6} y={6} width={1588} height={988} fill="none" stroke={color} strokeWidth={12} />
  </>
);

function Living() {
  return (
    <>
      <defs>
        <pattern id="planks" width="160" height="40" patternUnits="userSpaceOnUse">
          <rect width="160" height="40" fill="#e9c99a" />
          <path d="M0,40 H160 M80,0 V20 M0,20 H160 M140,20 V40" stroke="#d6b07d" strokeWidth="3" />
          <path d="M20,10 q20,-3 40,0 M100,30 q20,-3 30,0" stroke="#dcb88a" strokeWidth="2" fill="none" />
        </pattern>
        <pattern id="rugDots" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#f7b6cf" />
          <circle cx="20" cy="20" r="4" fill="#ff8fb8" />
        </pattern>
      </defs>
      <rect width={1600} height={1000} fill="url(#planks)" />
      <Sun x={1150} y={0} w={180} h={420} />
      <Sun x={180} y={0} w={160} h={380} />
      <rect x={300} y={30} width={1000} height={80} rx={8} fill="#c98b4f" stroke={INK} strokeWidth={3} opacity={0.6} />
      <rect x={480} y={330} width={660} height={410} rx={40} fill="#000000" opacity={0.08} />
      <rect x={470} y={320} width={660} height={410} rx={40} fill="url(#rugDots)" stroke={INK} strokeWidth={4} />
      <rect x={500} y={350} width={600} height={350} rx={28} fill="none" stroke="#ffffff" strokeWidth={6} strokeDasharray="14 12" />
      <ellipse cx={800} cy={880} rx={340} ry={110} fill="#000000" opacity={0.06} />
      <Walls color="#8a6b4f" />
    </>
  );
}

function Kitchen() {
  return (
    <>
      <defs>
        <pattern id="tiles" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="#f3efe6" />
          <rect width="50" height="50" fill="#e4ddcf" />
          <rect x="50" y="50" width="50" height="50" fill="#e4ddcf" />
        </pattern>
        <pattern id="backsplash" width="40" height="20" patternUnits="userSpaceOnUse">
          <rect width="40" height="20" fill="#bfe6f5" />
          <path d="M0,20 H40 M20,0 V10 M0,10 H40 M0,10 V20" stroke="#ffffff" strokeWidth="2" />
        </pattern>
      </defs>
      <rect width={1600} height={1000} fill="url(#tiles)" />
      <rect x={20} y={14} width={1200} height={22} fill="url(#backsplash)" />
      <Sun x={1250} y={0} w={150} h={360} />
      <rect x={600} y={390} width={540} height={400} rx={30} fill="#000000" opacity={0.08} />
      <rect x={590} y={380} width={540} height={400} rx={30} fill="#9ad8f0" stroke={INK} strokeWidth={4} opacity={0.75} />
      <rect x={620} y={410} width={480} height={340} rx={20} fill="none" stroke="#ffffff" strokeWidth={5} strokeDasharray="10 10" />
      <rect x={1360} y={800} width={200} height={160} rx={20} fill="#ffc6dd" stroke={INK} strokeWidth={3} opacity={0.7} />
      <Walls color="#9aa6b2" />
    </>
  );
}

function Park() {
  const tufts = [
    [120, 120],
    [560, 220],
    [980, 120],
    [1250, 300],
    [80, 600],
    [340, 980],
    [700, 980],
    [1100, 940],
    [1560, 700],
    [620, 560],
    [1500, 120],
    [880, 820],
  ];
  return (
    <>
      <defs>
        <pattern id="grass" width="60" height="60" patternUnits="userSpaceOnUse">
          <rect width="60" height="60" fill="#9ee6a8" />
          <path d="M10,40 l3,-8 l3,8 M40,20 l3,-8 l3,8" stroke="#86d494" strokeWidth="2" fill="none" />
        </pattern>
      </defs>
      <rect width={1600} height={1000} fill="url(#grass)" />
      {[
        [300, 700, 160],
        [1200, 250, 140],
        [700, 500, 120],
        [1450, 600, 110],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#8ad898" />
      ))}
      {tufts.map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y})`}>
          <circle cx={-8} cy={0} r={4} fill={i % 3 ? '#ffffff' : '#ffc93c'} />
          <circle cx={6} cy={-6} r={4} fill={i % 2 ? '#ff8fb8' : '#ffffff'} />
          <circle cx={4} cy={8} r={3} fill="#a77bff" />
        </g>
      ))}
      <path d="M-20,404 C300,344 600,454 900,404 S1400,364 1620,414" fill="none" stroke="#000000" strokeWidth={78} strokeLinecap="round" opacity={0.06} />
      <path d="M-20,400 C300,340 600,450 900,400 S1400,360 1620,410" fill="none" stroke="#f1dcb0" strokeWidth={70} strokeLinecap="round" />
      <path d="M-20,400 C300,340 600,450 900,400 S1400,360 1620,410" fill="none" stroke="#e2c792" strokeWidth={70} strokeDasharray="2 30" opacity={0.6} />
      <ellipse cx={1000} cy={610} rx={250} ry={168} fill="#7cc49a" />
      <ellipse cx={1000} cy={600} rx={240} ry={160} fill="#4cc9f0" stroke={INK} strokeWidth={4} />
      <ellipse cx={1000} cy={600} rx={200} ry={125} fill="none" stroke="#ffffff" strokeWidth={4} opacity={0.5} />
      {[
        [880, 520],
        [1130, 660],
        [1060, 500],
      ].map(([x, y], i) => (
        <path key={i} d={`M${x},${y} m-18,0 a18,14 0 1 0 36,0 l-18,0 Z`} fill="#3ddc97" stroke={INK} strokeWidth={2} />
      ))}
    </>
  );
}

function Bedroom() {
  return (
    <>
      <defs>
        <pattern id="carpet" width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="#d9cdf5" />
          <circle cx="6" cy="6" r="1.6" fill="#c7b8f0" />
          <circle cx="18" cy="18" r="1.6" fill="#c7b8f0" />
        </pattern>
        <pattern id="stars" width="80" height="80" patternUnits="userSpaceOnUse">
          <rect width="80" height="80" fill="#a8d0f7" />
          <path d="M20,14 l3,6 l6,1 l-5,4 l1,6 l-5,-3 l-5,3 l1,-6 l-5,-4 l6,-1 Z" fill="#fff6c9" />
          <circle cx="60" cy="56" r="4" fill="#ffffff" />
        </pattern>
      </defs>
      <rect width={1600} height={1000} fill="url(#carpet)" />
      <Sun x={600} y={0} w={200} h={440} />
      <ellipse cx={720} cy={590} rx={290} ry={200} fill="#000000" opacity={0.07} />
      <ellipse cx={710} cy={580} rx={290} ry={200} fill="url(#stars)" stroke={INK} strokeWidth={4} />
      <ellipse cx={710} cy={580} rx={250} ry={165} fill="none" stroke="#ffffff" strokeWidth={5} strokeDasharray="12 10" />
      {/* nightstands either side of the bed */}
      {[960, 1340].map((x) => (
        <rect key={x} x={x - 44} y={135} width={88} height={80} rx={10} fill="#c98b4f" stroke={INK} strokeWidth={3} />
      ))}
      <rect x={1010} y={150} width={290} height={340} rx={24} fill="#000000" opacity={0.08} />
      <rect x={180} y={860} width={300} height={130} rx={20} fill="#ffe08a" stroke={INK} strokeWidth={3} opacity={0.55} />
      <Walls color="#7a6aa8" />
    </>
  );
}

function Bathroom() {
  return (
    <>
      <defs>
        <pattern id="bathTiles" width="60" height="60" patternUnits="userSpaceOnUse">
          <rect width="60" height="60" fill="#e9f6fb" />
          <path d="M0,0 H60 M0,0 V60" stroke="#c4e2ee" strokeWidth="4" />
          <rect x="24" y="24" width="12" height="12" fill="#bfe6f5" transform="rotate(45 30 30)" />
        </pattern>
        <pattern id="showerTiles" width="30" height="30" patternUnits="userSpaceOnUse">
          <rect width="30" height="30" fill="#9ad8f0" />
          <path d="M0,0 H30 M0,0 V30" stroke="#ffffff" strokeWidth="3" />
        </pattern>
      </defs>
      <rect width={1600} height={1000} fill="url(#bathTiles)" />
      {/* the toilet stalls on the left */}
      <rect x={14} y={300} width={200} height={540} fill="#ffffff" opacity={0.5} />
      {[300, 560, 840].map((y) => (
        <rect key={y} x={14} y={y - 6} width={200} height={12} rx={4} fill="#9aa6b2" stroke={INK} strokeWidth={2} />
      ))}
      {/* the shower corner */}
      <rect x={1300} y={700} width={286} height={286} fill="url(#showerTiles)" stroke={INK} strokeWidth={4} />
      <circle cx={1460} cy={850} r={14} fill="#5e6470" stroke={INK} strokeWidth={2} />
      <path d="M1300,700 V986" stroke="#ffffff" strokeWidth={8} opacity={0.7} strokeDasharray="30 12" />
      {/* the bath mat */}
      <rect x={1240} y={240} width={300} height={120} rx={30} fill="#3ddc97" stroke={INK} strokeWidth={3} opacity={0.8} />
      <rect x={1260} y={258} width={260} height={84} rx={20} fill="none" stroke="#ffffff" strokeWidth={4} strokeDasharray="6 8" />
      {/* the round rug in the middle */}
      <circle cx={860} cy={560} r={200} fill="#ffc6dd" stroke={INK} strokeWidth={3} opacity={0.6} />
      <rect x={14} y={14} width={1210} height={20} fill="#ffffff" opacity={0.6} />
      <Walls color="#7fa6b8" />
    </>
  );
}

function Classroom() {
  return (
    <>
      <defs>
        <pattern id="woodFloor" width="200" height="50" patternUnits="userSpaceOnUse">
          <rect width="200" height="50" fill="#e2c08f" />
          <path d="M0,50 H200 M120,0 V25 M0,25 H200 M60,25 V50" stroke="#cfa874" strokeWidth="3" />
        </pattern>
      </defs>
      <rect width={1600} height={1000} fill="url(#woodFloor)" />
      <Sun x={0} y={250} w={90} h={300} />
      {/* the front of the room */}
      <rect x={14} y={14} width={1572} height={290} fill="#c9e8d9" opacity={0.55} />
      <rect x={560} y={140} width={480} height={130} rx={20} fill="#000000" opacity={0.06} />
      {/* the aisles between desk rows */}
      {[600, 1000].map((x) => (
        <rect key={x} x={x - 30} y={340} width={60} height={620} rx={20} fill="#ffffff" opacity={0.18} />
      ))}
      {/* a bulletin board and posters on the side walls */}
      <rect x={1480} y={170} width={90} height={680} rx={8} fill="#c98b4f" stroke={INK} strokeWidth={3} opacity={0.75} />
      {[230, 470, 700].map((y, i) => (
        <rect key={y} x={22} y={y} width={24} height={110} rx={4} fill={['#ffc93c', '#4cc9f0', '#ff8fb8'][i]} stroke={INK} strokeWidth={2} />
      ))}
      <rect x={1180} y={60} width={180} height={60} rx={8} fill="#ffffff" stroke={INK} strokeWidth={3} />
      <path d="M1200,90 h30 M1250,80 l10,20 l10,-20 M1290,90 h50" stroke="#ff4f4f" strokeWidth={4} fill="none" />
      <Walls color="#6a8a6e" />
    </>
  );
}

function Beach() {
  return (
    <>
      <defs>
        <pattern id="sand" width="50" height="50" patternUnits="userSpaceOnUse">
          <rect width="50" height="50" fill="#f6dfa8" />
          <circle cx="10" cy="12" r="1.6" fill="#e2c07a" />
          <circle cx="34" cy="30" r="1.6" fill="#e2c07a" />
          <circle cx="22" cy="44" r="1.2" fill="#ffffff" />
        </pattern>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a9fd6" />
          <stop offset="1" stopColor="#6fd6f2" />
        </linearGradient>
      </defs>
      <rect width={1600} height={1000} fill="url(#sand)" />
      {/* wet sand, then the sea with a foamy edge */}
      <path d="M0,0 H1600 V250 Q1400,290 1200,250 T800,250 T400,255 T0,250 Z" fill="#e8c98a" />
      <path d="M0,0 H1600 V200 Q1400,240 1200,200 T800,200 T400,205 T0,200 Z" fill="url(#sea)" />
      <path d="M0,200 Q200,245 400,205 T800,200 T1200,200 T1600,200" fill="none" stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.9} />
      {[60, 120].map((y) => (
        <path key={y} d={`M40,${y} q40,-14 80,0 M380,${y + 20} q40,-14 80,0 M760,${y} q40,-14 80,0 M1140,${y + 18} q40,-14 80,0 M1460,${y} q40,-14 80,0`} stroke="#ffffff" strokeWidth={4} fill="none" opacity={0.6} />
      ))}
      {/* a boardwalk along the bottom, and footprints across the sand */}
      <rect x={0} y={960} width={1600} height={40} fill="#c98b4f" />
      {Array.from({ length: 16 }, (_, i) => (
        <line key={i} x1={i * 100 + 50} y1={960} x2={i * 100 + 50} y2={1000} stroke="#8d5a2b" strokeWidth={3} />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <ellipse key={i} cx={560 + i * 70 + (i % 2) * 14} cy={920 - i * 60} rx={7} ry={11} fill="#e2c07a" transform={`rotate(20 ${560 + i * 70} ${920 - i * 60})`} />
      ))}
      {/* a little rock pool */}
      <ellipse cx={1250} cy={340} rx={70} ry={36} fill="#6fd6f2" stroke={INK} strokeWidth={3} />
    </>
  );
}

const BACKGROUNDS: Record<MapId, () => JSX.Element> = {
  living: Living,
  kitchen: Kitchen,
  park: Park,
  bedroom: Bedroom,
  bathroom: Bathroom,
  classroom: Classroom,
  beach: Beach,
};

export default function MapBackground({ map }: { map: MapId }) {
  const Floor = BACKGROUNDS[map];
  return <Floor />;
}
