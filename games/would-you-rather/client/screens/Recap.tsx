import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { computeStats } from '../../shared';
import { useWyr, useRoom } from '../store';
import Avatar from '../components/Avatar';

const COPY = {
  title: "How compatible are you?",
  matched: (m: number, t: number) => `You picked the same thing ${m} out of ${t} times`,
  reads: 'Who knows who best?',
  read: (who: string, them: string, right: number, total: number) => `${who} read ${them} right ${right} of ${total} times`,
  hot: '🔥 Hot takes (you disagreed)',
  none: 'You never disagreed. Suspicious. 🤨',
  all: 'Every answer',
  same: '🤝',
  diff: '⚔️',
};

export default function Recap() {
  const { act, leave } = useWyr();
  const { s } = useRoom();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const ids = s.players.map((p) => p.id);
  const stats = computeStats(s.history, ids);
  const nameOf = (id: string) => s.players.find((p) => p.id === id)?.name ?? '???';
  const [a, b] = s.players;
  const split = s.history.filter((t) => a && b && t.picks[a.id] !== t.picks[b.id]);
  const pct = Math.round(stats.matchRate * 100);

  return (
    <main className="flex flex-1 flex-col gap-6">
      <header className="text-center">
        <h1 className="font-display text-3xl font-extrabold">{COPY.title}</h1>
        <motion.div
          initial={reduce ? false : { scale: 0.3, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: -2, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 12, delay: 0.2 }}
          className="sticker mx-auto mt-4 inline-block !bg-pink px-8 py-5 text-white"
        >
          <p className="text-6xl">{stats.verdict.emoji}</p>
          <p className="font-display text-5xl font-extrabold">{pct}%</p>
          <p className="font-display text-2xl font-extrabold">{stats.verdict.text}</p>
        </motion.div>
        <p className="mt-3 font-semibold text-ink-soft">{COPY.matched(stats.matches, stats.total)}</p>
      </header>

      <section className="sticker space-y-2 p-5">
        <h2 className="font-display text-xl font-extrabold">{COPY.reads}</h2>
        {s.players.map((p) => {
          const other = s.players.find((x) => x.id !== p.id);
          const r = stats.byPlayer[p.id];
          if (!other || !r) return null;
          return (
            <p key={p.id} className="flex items-center gap-2 font-semibold">
              <Avatar id={p.id} size="text-2xl" /> {COPY.read(p.name, other.name, r.readsRight, r.readsTotal)}
            </p>
          );
        })}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl font-extrabold">{COPY.hot}</h2>
        {split.length === 0 && <p className="font-semibold text-ink-soft">{COPY.none}</p>}
        {split.map((t) => (
          <article key={t.index} className="sticker space-y-2 p-4">
            <p className="font-display text-lg font-extrabold">
              {t.question.a} <span className="text-ink-soft">or</span> {t.question.b}?
            </p>
            {s.players.map((p) => (
              <p key={p.id} className="font-semibold">
                <Avatar id={p.id} size="text-xl" /> {p.name} → <b>{t.picks[p.id] ? t.question[t.picks[p.id]!] : '?'}</b>
                {t.defenses[p.id] ? <span className="text-ink-soft"> · “{t.defenses[p.id]}”</span> : null}
              </p>
            ))}
          </article>
        ))}
      </section>

      <details className="sticker p-4">
        <summary className="cursor-pointer font-display text-lg font-extrabold">{COPY.all}</summary>
        <ol className="mt-3 space-y-2">
          {s.history.map((t) => {
            const same = a && b && t.picks[a.id] === t.picks[b.id];
            return (
              <li key={t.index} className="font-semibold">
                {same ? COPY.same : COPY.diff} {t.question.a} / {t.question.b}
                {t.question.authorId && <span className="text-ink-soft"> (by {nameOf(t.question.authorId)})</span>}
              </li>
            );
          })}
        </ol>
      </details>

      <div className="action-bar flex gap-3">
        <button
          className="btn btn-ghost"
          onClick={async () => {
            await leave();
            navigate('/wyr');
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
