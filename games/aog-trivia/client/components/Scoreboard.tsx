import { useRoom } from '../store';
import Avatar from './Avatar';

/** Both players' running scores, leader highlighted. */
export default function Scoreboard({ gained }: { gained?: Record<string, number> | null }) {
  const { s } = useRoom();
  const top = Math.max(...s.players.map((p) => s.scores[p.id] ?? 0));
  return (
    <div className="grid grid-cols-2 gap-3">
      {s.players.map((p) => {
        const score = s.scores[p.id] ?? 0;
        const leading = score === top && score > 0;
        return (
          <div key={p.id} className={`sticker flex items-center gap-2 px-3 py-2 ${leading ? '!bg-yellow text-on-accent' : ''}`}>
            <Avatar id={p.id} size="text-2xl" />
            <span className="min-w-0 flex-1 truncate font-display font-extrabold">{p.name}</span>
            <span className="font-display text-xl font-extrabold">
              {score}
              {gained && gained[p.id] ? <span className="ml-1 text-sm text-mint">+{gained[p.id]}</span> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}
