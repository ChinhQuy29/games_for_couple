import { PLAYER_COLORS } from '@gfc/kit/client';
import { WORLD, type Cell } from '../shared';

interface Props {
  board: Cell[];
  claimed: Record<number, string>;
  seatOf: (playerId: string) => number;
  onPick?: (n: number) => void;
  locked?: boolean;
  /** Highlight this number (recap: the slowest find, etc.). */
  dim?: boolean;
}

/** The 1600×1000 board of numbers, scaled to fit a laptop screen without scrolling. */
export default function Board({ board, claimed, seatOf, onPick, locked, dim }: Props) {
  return (
    <div className="mx-auto w-full" style={{ maxWidth: 'max(480px, calc((100dvh - 250px) * 1.6))' }}>
      <svg
        viewBox={`0 0 ${WORLD.w} ${WORLD.h}`}
        className={`block w-full select-none rounded-3xl border-[3px] border-line bg-[#fffaf0] shadow-[4px_4px_0_var(--line)] ${
          onPick && !locked ? 'cursor-pointer' : ''
        } ${locked ? 'opacity-60' : ''}`}
      >
        {board.map((c) => {
          const by = claimed[c.n];
          const color = by !== undefined ? PLAYER_COLORS[seatOf(by)] : null;
          return (
            <g
              key={c.n}
              transform={`translate(${c.x} ${c.y}) rotate(${c.rot})`}
              onPointerDown={() => !by && onPick?.(c.n)}
              className={by ? '' : 'rush-num'}
            >
              <circle r={c.size * 0.75} fill={color ?? 'transparent'} opacity={color ? 0.9 : 1} />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={c.size}
                fontWeight={800}
                fontFamily="'Baloo 2', ui-rounded, sans-serif"
                fill={color ? '#ffffff' : c.color}
                opacity={dim && !color ? 0.35 : 1}
                pointerEvents="none"
              >
                {c.n}
              </text>
            </g>
          );
        })}
        <style>{`.rush-num:hover circle { fill: #ffc93c55; }`}</style>
      </svg>
    </div>
  );
}
