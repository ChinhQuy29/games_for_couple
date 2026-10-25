import type { MapId } from '../../shared';

// Floors, rugs, paths and the pond: decoration only, never shootable.
// Matches the spots in server/content/maps.ts.

const INK = '#2b2140';

function Living() {
  return (
    <>
      <defs>
        <pattern id="planks" width="160" height="40" patternUnits="userSpaceOnUse">
          <rect width="160" height="40" fill="#e9c99a" />
          <path d="M0,40 H160 M80,0 V20 M0,20 H160 M140,20 V40" stroke="#d6b07d" strokeWidth="3" />
        </pattern>
      </defs>
      <rect width={1600} height={1000} fill="url(#planks)" />
      <rect x={300} y={30} width={1000} height={80} rx={8} fill="#c98b4f" stroke={INK} strokeWidth={3} opacity={0.6} />
      <rect x={470} y={320} width={660} height={410} rx={40} fill="#f7b6cf" stroke={INK} strokeWidth={4} />
      <rect x={500} y={350} width={600} height={350} rx={28} fill="none" stroke="#ffffff" strokeWidth={6} strokeDasharray="14 12" />
      <rect x={6} y={6} width={1588} height={988} fill="none" stroke="#8a6b4f" strokeWidth={12} />
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
      </defs>
      <rect width={1600} height={1000} fill="url(#tiles)" />
      <rect x={590} y={380} width={540} height={400} rx={30} fill="#9ad8f0" stroke={INK} strokeWidth={4} opacity={0.7} />
      <rect x={6} y={6} width={1588} height={988} fill="none" stroke="#9aa6b2" strokeWidth={12} />
    </>
  );
}

function Park() {
  return (
    <>
      <rect width={1600} height={1000} fill="#9ee6a8" />
      {[
        [300, 700, 160],
        [1200, 250, 140],
        [700, 500, 120],
        [1450, 600, 110],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#8ad898" />
      ))}
      <path
        d="M-20,400 C300,340 600,450 900,400 S1400,360 1620,410"
        fill="none"
        stroke="#f1dcb0"
        strokeWidth={70}
        strokeLinecap="round"
      />
      <path
        d="M-20,400 C300,340 600,450 900,400 S1400,360 1620,410"
        fill="none"
        stroke="#e2c792"
        strokeWidth={70}
        strokeDasharray="2 30"
        opacity={0.6}
      />
      <ellipse cx={1000} cy={600} rx={240} ry={160} fill="#4cc9f0" stroke={INK} strokeWidth={4} />
      <ellipse cx={1000} cy={600} rx={200} ry={125} fill="none" stroke="#ffffff" strokeWidth={4} opacity={0.5} />
    </>
  );
}

export default function MapBackground({ map }: { map: MapId }) {
  if (map === 'living') return <Living />;
  if (map === 'kitchen') return <Kitchen />;
  return <Park />;
}
