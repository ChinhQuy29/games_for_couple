import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { rankFor, type PublicTurn } from '../../shared';
import { useAog, useRoom } from '../store';
import { useCopy, useT } from '../lib/i18n';
import Avatar from '../components/Avatar';

const COPY = {
  vi: {
    winner: (n: string) => `🏆 ${n} là fan cứng nhất!`,
    tie: '🤝 Hòa! Hai fan cứng ngang tài ngang sức',
    rank: 'Rank fan',
    correct: (c: number, t: number) => `${c}/${t} câu đúng`,
    points: (p: number) => `${p} điểm`,
    streak: (n: number) => `Chuỗi dài nhất: ${n}`,
    review: 'Xem lại các câu hỏi',
    flaggedTitle: '🚩 Câu bị báo sai (để sửa trong file câu hỏi)',
    rematch: '🔁 Đấu lại',
    leave: '🏠 Rời phòng',
  },
  en: {
    winner: (n: string) => `🏆 ${n} is the biggest superfan!`,
    tie: "🤝 It's a tie! Two equally hardcore fans",
    rank: 'Fan rank',
    correct: (c: number, t: number) => `${c}/${t} correct`,
    points: (p: number) => `${p} points`,
    streak: (n: number) => `Best streak: ${n}`,
    review: 'Review the questions',
    flaggedTitle: '🚩 Reported questions (to fix in the question file)',
    rematch: '🔁 Rematch',
    leave: '🏠 Leave',
  },
};

function statsFor(history: PublicTurn[], id: string) {
  let correct = 0;
  let streak = 0;
  let best = 0;
  for (const t of history) {
    if ((t.points?.[id] ?? 0) > 0) {
      correct += 1;
      streak += 1;
      best = Math.max(best, streak);
    } else streak = 0;
  }
  return { correct, best };
}

export default function Recap() {
  const { act, leave } = useAog();
  const { s } = useRoom();
  const c = useCopy(COPY);
  const tr = useT();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [a, b] = s.players;
  const sa = a ? (s.scores[a.id] ?? 0) : 0;
  const sb = b ? (s.scores[b.id] ?? 0) : 0;
  const winner = sa === sb ? null : sa > sb ? a : b;
  const flagged = s.history.filter((t) => t.flagged);

  return (
    <main className="flex flex-1 flex-col gap-6">
      <motion.h1
        initial={reduce ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 12 }}
        className="text-center font-display text-3xl font-extrabold"
      >
        {winner ? c.winner(winner.name) : c.tie}
      </motion.h1>

      <section className="grid grid-cols-2 gap-4">
        {s.players.map((p, i) => {
          const st = statsFor(s.history, p.id);
          const rank = rankFor(st.correct, s.history.length);
          return (
            <motion.div
              key={p.id}
              initial={reduce ? false : { y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.3, type: 'spring' }}
              className={`sticker flex flex-col items-center gap-1 p-4 text-center ${p === winner ? '!bg-yellow text-on-accent' : ''}`}
            >
              <Avatar id={p.id} size="text-4xl" />
              <p className="max-w-full truncate font-display text-xl font-extrabold">{p.name}</p>
              <p className="text-5xl">{rank.emoji}</p>
              <p className="text-xs font-bold uppercase">{c.rank}</p>
              <p className="font-display text-2xl font-extrabold">{tr(rank.name)}</p>
              <p className="font-semibold">{c.correct(st.correct, s.history.length)}</p>
              <p className="font-semibold">{c.points(s.scores[p.id] ?? 0)}</p>
              <p className="text-sm font-semibold opacity-80">{c.streak(st.best)}</p>
            </motion.div>
          );
        })}
      </section>

      {flagged.length > 0 && (
        <section className="sticker space-y-2 p-4">
          <h2 className="font-display text-lg font-extrabold">{c.flaggedTitle}</h2>
          {flagged.map((t) => (
            <p key={t.index} className="text-sm font-semibold">
              <code className="rounded bg-muted px-1">{t.question.id}</code> · {tr(t.question.q)}
            </p>
          ))}
        </section>
      )}

      <details className="sticker p-4">
        <summary className="cursor-pointer font-display text-lg font-extrabold">{c.review}</summary>
        <ol className="mt-3 space-y-3">
          {s.history.map((t) => (
            <li key={t.index} className="text-sm">
              <p className="font-bold">
                {t.index}. {tr(t.question.q)}
              </p>
              <p className="font-semibold text-ink-soft">
                ✓ {t.question.correct !== null ? tr(t.question.options[t.question.correct]!) : ''}
                {' · '}
                {s.players.map((p) => `${p.name} ${(t.points?.[p.id] ?? 0) > 0 ? '✅' : '❌'}`).join('  ')}
              </p>
            </li>
          ))}
        </ol>
      </details>

      <div className="action-bar flex gap-3">
        <button
          className="btn btn-ghost"
          onClick={async () => {
            await leave();
            navigate('/aog');
          }}
        >
          {c.leave}
        </button>
        <button className="btn btn-pink flex-1" onClick={() => act('game:rematch')}>
          {c.rematch}
        </button>
      </div>
    </main>
  );
}
