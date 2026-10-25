import { motion, useReducedMotion } from 'framer-motion';
import { STREAKS } from '../../shared';
import { useAog, useRoom } from '../store';
import { useCopy, useT } from '../lib/i18n';
import Avatar from '../components/Avatar';
import QuestionHeader from '../components/QuestionHeader';
import Scoreboard from '../components/Scoreboard';

const COPY = {
  vi: {
    right: 'Chính xác!',
    wrong: 'Thua rồi 😭',
    noAnswer: 'Hết giờ ⏰',
    both: '🔥 Cả hai đều đúng!',
    none: '💀 Không ai đúng cả…',
    source: 'Nguồn',
    flag: '🚩 Báo sai câu này',
    flagged: '🚩 Đã báo sai (bấm để hủy)',
    next: 'Câu tiếp theo ▶',
    finish: 'Xem kết quả 🏆',
    waitNext: (n: string) => `Chờ ${n}…`,
  },
  en: {
    right: 'Correct!',
    wrong: 'Missed it 😭',
    noAnswer: "Time's up ⏰",
    both: '🔥 You both got it!',
    none: '💀 Nobody got it…',
    source: 'Source',
    flag: '🚩 Report this question',
    flagged: '🚩 Reported (tap to undo)',
    next: 'Next question ▶',
    finish: 'See the results 🏆',
    waitNext: (n: string) => `Waiting for ${n}…`,
  },
};

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function RevealPhase() {
  const { act } = useAog();
  const { s, me, partner } = useRoom();
  const c = useCopy(COPY);
  const tr = useT();
  const reduce = useReducedMotion();
  const turn = s.current!;
  const q = turn.question;
  const points = turn.points ?? {};
  const correctPlayers = s.players.filter((p) => (points[p.id] ?? 0) > 0);
  const iAmReady = s.readyForNext.includes(me.id);
  const isLast = s.index >= s.total;
  const myPts = points[me.id] ?? 0;
  const myStreak = s.streaks[me.id] ?? 0;
  const banner = myPts > 0 ? (STREAKS[Math.min(myStreak, 5)] ?? null) : null;

  return (
    <main className="flex flex-1 flex-col gap-4">
      <QuestionHeader turn={turn} />
      <Scoreboard gained={points} />

      <motion.h2
        initial={reduce ? false : { scale: 2.4, rotate: -10, opacity: 0 }}
        animate={{ scale: 1, rotate: -2, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 12 }}
        className={`sticker self-center px-6 py-2 text-center font-display text-3xl font-extrabold ${
          myPts > 0 ? '!bg-mint text-on-accent' : '!bg-pink text-white'
        }`}
      >
        {myPts > 0 ? `${c.right} +${myPts}` : turn.answers[me.id]?.choice == null ? c.noAnswer : c.wrong}
      </motion.h2>
      {banner && (
        <motion.p
          initial={reduce ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 10 }}
          className="self-center font-display text-4xl font-extrabold tracking-wide text-pink drop-shadow-[3px_3px_0_var(--line)]"
        >
          {banner}!
        </motion.p>
      )}

      <p className="sticker p-4 text-center font-display text-xl font-extrabold">{tr(q.q)}</p>

      <section className="flex flex-col gap-2">
        {q.options.map((o, i) => {
          const isCorrect = i === q.correct;
          const pickers = s.players.filter((p) => turn.answers[p.id]?.choice === i);
          return (
            <div
              key={i}
              className={`sticker flex items-center gap-3 px-4 py-3 font-display text-lg font-extrabold ${
                isCorrect ? '!bg-mint text-on-accent' : pickers.length ? '!bg-pink/70 text-white' : 'opacity-60'
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[3px] border-line bg-card text-ink">
                {isCorrect ? '✓' : LETTERS[i]}
              </span>
              <span className="flex-1">{tr(o)}</span>
              {pickers.map((p) => (
                <Avatar key={p.id} id={p.id} size="text-2xl" />
              ))}
            </div>
          );
        })}
      </section>

      <p className="text-center font-display font-extrabold">
        {correctPlayers.length === 2 ? c.both : correctPlayers.length === 0 ? c.none : ''}
      </p>

      {q.explain && (
        <section className="sticker space-y-2 p-4">
          <p className="font-semibold">{tr(q.explain)}</p>
          {q.source && (
            <a href={q.source} target="_blank" rel="noreferrer" className="text-sm font-bold text-ink-soft underline">
              {c.source} ↗
            </a>
          )}
        </section>
      )}

      <button className="chip self-center text-sm" aria-pressed={turn.flagged} onClick={() => act('question:flag', { index: turn.index })}>
        {turn.flagged ? c.flagged : c.flag}
      </button>

      <div className="action-bar mt-auto">
        <button className="btn btn-mint w-full" disabled={iAmReady} onClick={() => act('round:ready')}>
          {iAmReady ? c.waitNext(partner?.name ?? '…') : isLast ? c.finish : c.next}
        </button>
      </div>
    </main>
  );
}
