import { MAPS } from '../../shared';
import { useRoom } from '../store';
import Avatar from './Avatar';

/** Round, map and both scores, shown above the map. */
export default function Hud({ children }: { children?: React.ReactNode }) {
  const { s } = useRoom();
  const round = s.round!;
  const roleOf = (id: string) => (id === round.hiderId ? '🙈 hiding' : '🔫 hunting');
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="sticker px-3 py-1 font-display font-extrabold">
        Round {round.n}/{s.totalRounds} · {MAPS[round.map].emoji} {MAPS[round.map].name.en}
      </span>
      {s.players.map((p) => (
        <span key={p.id} className="sticker flex items-center gap-2 px-3 py-1 font-display font-extrabold">
          <Avatar id={p.id} size="text-xl" />
          {p.name} <span className="text-sm font-bold text-ink-soft">{roleOf(p.id)}</span>
          <span className="text-pink">{s.scores[p.id] ?? 0}</span>
        </span>
      ))}
      <div className="ml-auto flex items-center gap-3">{children}</div>
    </div>
  );
}
