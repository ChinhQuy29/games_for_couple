import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CLUE_TIME_BONUS_SEC, POINTS } from '../../shared';
import { useAog, useRoom } from '../store';
import { useCopy, useT } from '../lib/i18n';
import QuestionHeader from '../components/QuestionHeader';
import Scoreboard from '../components/Scoreboard';
import TimerBar from '../components/TimerBar';

const COPY = {
  vi: {
    locked: 'Đã chốt! 🔒',
    waiting: (n: string) => `Chờ ${n} trả lời…`,
    partnerDone: (n: string) => `${n} đã chốt đáp án 👀`,
    clue: (i: number) => `Gợi ý ${i}`,
    hidden: '🔒 sắp hiện…',
    worth: (p: number) => `Trả lời bây giờ: ${p} điểm`,
  },
  en: {
    locked: 'Locked in! 🔒',
    waiting: (n: string) => `Waiting for ${n}…`,
    partnerDone: (n: string) => `${n} has locked in 👀`,
    clue: (i: number) => `Clue ${i}`,
    hidden: '🔒 coming up…',
    worth: (p: number) => `Answer now: ${p} points`,
  },
};

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const COLORS = ['!bg-pink text-white', '!bg-sky text-on-accent', '!bg-yellow text-on-accent', '!bg-mint text-on-accent'];

export default function QuestionPhase() {
  const { s } = useRoom();
  // Fresh state (and a fresh stopwatch) for every question.
  return <Question key={s.index} />;
}

function Question() {
  const { act } = useAog();
  const { s, me, partner } = useRoom();
  const c = useCopy(COPY);
  const tr = useT();
  const reduce = useReducedMotion();
  const turn = s.current!;
  const q = turn.question;
  // The speed bonus is timed on this device, from the moment the question appeared.
  const shownAt = useRef(performance.now());
  const [picked, setPicked] = useState<number | null>(null);
  const mine = turn.answers[me.id];
  const chosen = mine?.choice ?? picked;
  const limit = s.settings.timeSec + (q.type === 'clues' ? CLUE_TIME_BONUS_SEC : 0);

  async function pick(i: number) {
    if (chosen !== null) return;
    setPicked(i);
    const ok = await act('answer:submit', { choice: i, elapsedMs: Math.round(performance.now() - shownAt.current) });
    if (!ok) setPicked(null);
  }

  const cluePoints = POINTS.clue[Math.min(q.clues.length, POINTS.clue.length) - 1] ?? 0;

  return (
    <main className="flex flex-1 flex-col gap-4">
      <QuestionHeader turn={turn} />
      <Scoreboard />
      <TimerBar total={limit} onExpire={() => {}} />

      <motion.h1
        initial={reduce ? false : { y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticker p-5 text-center font-display text-2xl font-extrabold leading-snug"
      >
        {tr(q.q)}
      </motion.h1>

      {q.type === 'clues' && (
        <section className="flex flex-col gap-2">
          {Array.from({ length: q.clueTotal }, (_, i) => {
            const clue = q.clues[i];
            return (
              <motion.div
                key={i}
                initial={clue && !reduce ? { x: -30, opacity: 0 } : false}
                animate={{ x: 0, opacity: 1 }}
                className={`sticker px-4 py-3 font-semibold ${clue ? '' : 'opacity-50'}`}
              >
                <span className="mr-2 font-display font-extrabold text-pink">{c.clue(i + 1)}</span>
                {clue ? tr(clue) : c.hidden}
              </motion.div>
            );
          })}
          {chosen === null && <p className="text-center text-sm font-bold text-ink-soft">{c.worth(cluePoints * (turn.finale ? 2 : 1))}</p>}
        </section>
      )}

      <section className={`grid gap-3 ${q.options.length === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {q.options.map((o, i) => {
          const isMine = chosen === i;
          const dimmed = chosen !== null && !isMine;
          return (
            <button
              key={i}
              className={`sticker flex min-h-16 items-center gap-3 px-4 py-3 text-left font-display text-lg font-extrabold transition-transform active:scale-95 ${COLORS[i % COLORS.length]} ${
                isMine ? 'scale-[1.03] ring-4 ring-ink' : ''
              } ${dimmed ? 'opacity-40' : ''}`}
              disabled={chosen !== null}
              onClick={() => pick(i)}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[3px] border-line bg-card text-ink">
                {LETTERS[i]}
              </span>
              {tr(o)}
            </button>
          );
        })}
      </section>

      <p className="h-6 text-center font-bold text-ink-soft">
        {chosen !== null
          ? partner && turn.done.includes(partner.id)
            ? '…'
            : `${c.locked} ${c.waiting(partner?.name ?? '…')}`
          : partner && turn.done.includes(partner.id)
            ? c.partnerDone(partner.name)
            : ''}
      </p>
    </main>
  );
}
