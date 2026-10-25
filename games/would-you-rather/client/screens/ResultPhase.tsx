import { motion, useReducedMotion } from 'framer-motion';
import { computeStats, REACTIONS } from '../../shared';
import { useWyr, useRoom } from '../store';
import Avatar from '../components/Avatar';
import Options from '../components/Options';
import RoundHeader from '../components/RoundHeader';
import { votersOf } from './DebatePhase';

const COPY = {
  match: '🤝 Same brain!',
  split: '⚔️ Divided!',
  guessed: (who: string, them: string, right: boolean) => `${who} ${right ? 'knew' : 'thought'} ${them} would pick that ${right ? '✅' : '❌'}`,
  auto: (name: string) => `🎲 ${name} ran out of time, so the game picked`,
  score: (m: number, t: number) => `${m} of ${t} matched so far`,
  next: 'Next question ▶',
  finish: 'See how compatible you are 💘',
  waitNext: (name: string) => `Waiting for ${name}…`,
};

export default function ResultPhase() {
  const { act } = useWyr();
  const { s, me, partner } = useRoom();
  const reduce = useReducedMotion();
  const turn = s.current!;
  const [a, b] = s.players;
  const matched = !!a && !!b && turn.picks[a.id] === turn.picks[b.id];
  const stats = computeStats([...s.history, turn], s.players.map((p) => p.id));
  const iAmReady = s.readyForNext.includes(me.id);
  const isLast = s.index >= s.settings.questions;

  return (
    <main className="flex flex-1 flex-col gap-4">
      <RoundHeader title="The verdict" />
      <motion.h2
        initial={reduce ? false : { scale: 3, rotate: -12, opacity: 0 }}
        animate={{ scale: 1, rotate: matched ? -2 : 2, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 12 }}
        className={`sticker self-center px-6 py-2 font-display text-4xl font-extrabold ${matched ? '!bg-mint' : '!bg-yellow'} text-on-accent`}
      >
        {matched ? COPY.match : COPY.split}
      </motion.h2>

      <Options question={turn.question} voters={votersOf(s.players, turn.picks)} />

      <section className="sticker space-y-2 p-4 font-semibold">
        {s.players.map((p) => {
          const other = s.players.find((x) => x.id !== p.id);
          if (!other) return null;
          if (turn.autoPicked.includes(p.id)) return <p key={p.id}>{COPY.auto(p.name)}</p>;
          const right = turn.predictions[p.id] === turn.picks[other.id];
          return <p key={p.id}>{COPY.guessed(p.name, other.name, right)}</p>;
        })}
      </section>

      {s.players.some((p) => turn.defenses[p.id]) && (
        <section className="flex flex-col gap-3">
          {s.players
            .filter((p) => turn.defenses[p.id])
            .map((p, i) => (
              <motion.div
                key={p.id}
                initial={reduce ? false : { x: i ? 60 : -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.4, type: 'spring' }}
                className={`sticker flex items-start gap-3 p-4 ${i ? 'ml-6 rotate-1' : 'mr-6 -rotate-1'}`}
              >
                <Avatar id={p.id} size="text-3xl" />
                <p className="font-display text-xl font-bold">
                  <span className="text-ink-soft">{p.name}:</span> “{turn.defenses[p.id]}”
                </p>
              </motion.div>
            ))}
        </section>
      )}

      <div className="flex justify-center gap-2">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            className="chip !min-h-12 !px-3 text-2xl transition-transform active:scale-125"
            onClick={() => act('reaction:send', { index: turn.index, emoji })}
            aria-label={`React ${emoji}`}
          >
            {emoji}
            {turn.reactions[emoji] > 0 && <span className="ml-1 align-middle text-sm font-bold">{turn.reactions[emoji]}</span>}
          </button>
        ))}
      </div>
      <p className="text-center text-sm font-bold text-ink-soft">{COPY.score(stats.matches, stats.total)}</p>

      <div className="action-bar mt-auto">
        <button className="btn btn-mint w-full" disabled={iAmReady} onClick={() => act('round:ready')}>
          {iAmReady ? COPY.waitNext(partner?.name ?? 'your partner') : isLast ? COPY.finish : COPY.next}
        </button>
      </div>
    </main>
  );
}
