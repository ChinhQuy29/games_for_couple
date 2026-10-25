import { useNavigate } from 'react-router-dom';
import { MAPS, PROP_TYPES } from '../../shared';
import { useHns, useRoom } from '../store';
import Avatar from '../components/Avatar';
import { PropIcon } from '../components/PropArt';

export default function Recap() {
  const { act, leave } = useHns();
  const { s } = useRoom();
  const navigate = useNavigate();
  const [a, b] = s.players;
  const sa = a ? (s.scores[a.id] ?? 0) : 0;
  const sb = b ? (s.scores[b.id] ?? 0) : 0;
  const winner = sa === sb ? null : sa > sb ? a : b;

  const statsFor = (id: string) => {
    const hides = s.history.filter((r) => r.hiderId === id);
    const hunts = s.history.filter((r) => r.hunterId === id);
    return {
      survived: hides.filter((r) => r.result === 'survived').length,
      hides: hides.length,
      found: hunts.filter((r) => r.result === 'found').length,
      hunts: hunts.length,
      shots: hunts.reduce((n, r) => n + r.shots.length, 0),
    };
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6">
      <h1 className="text-center font-display text-4xl font-extrabold">
        {winner ? `🏆 ${winner.name} wins!` : "🤝 It's a tie!"}
      </h1>

      <section className="grid grid-cols-2 gap-4">
        {s.players.map((p) => {
          const st = statsFor(p.id);
          return (
            <div key={p.id} className={`sticker flex flex-col items-center gap-1 p-5 text-center ${p === winner ? '!bg-yellow text-on-accent' : ''}`}>
              <Avatar id={p.id} size="text-5xl" />
              <p className="font-display text-2xl font-extrabold">{p.name}</p>
              <p className="font-display text-3xl font-extrabold text-pink">{s.scores[p.id] ?? 0}</p>
              <p className="font-semibold">🙈 survived {st.survived}/{st.hides} hides</p>
              <p className="font-semibold">🎯 found {st.found}/{st.hunts} times</p>
              <p className="text-sm font-semibold opacity-80">
                🔫 {st.shots} shot{st.shots === 1 ? '' : 's'} fired
              </p>
            </div>
          );
        })}
      </section>

      <section className="sticker p-4">
        <h2 className="mb-2 font-display text-xl font-extrabold">Every round</h2>
        <ol className="space-y-2">
          {s.history.map((r) => {
            const hider = s.players.find((p) => p.id === r.hiderId);
            return (
              <li key={r.n} className="flex items-center gap-3 font-semibold">
                {r.hider && <PropIcon type={r.hider.type} size={36} />}
                <span>
                  {r.n}. {MAPS[r.map].emoji} {hider?.name} as a {r.hider ? PROP_TYPES[r.hider.type].label.en.toLowerCase() : '?'} ·{' '}
                  {r.result === 'found' ? `🎯 found in ${r.shots.length}` : '🙈 survived'}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="action-bar flex gap-3">
        <button
          className="btn btn-ghost"
          onClick={async () => {
            await leave();
            navigate('/hns');
          }}
        >
          🏠 Leave
        </button>
        <button className="btn btn-pink flex-1" onClick={() => act('game:rematch')}>
          🔁 Rematch
        </button>
      </div>
    </main>
  );
}
