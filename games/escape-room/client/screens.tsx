import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MISTAKE_PENALTY_MS, ROOMS, type Act, type PuzzleKind } from '../shared';
import { kit } from './kit';
import { CardView } from './Cards';

const { useGame, useRoom, LobbyShell, RecapActions, FirstChoice } = kit;

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const KIND_LABEL: Record<PuzzleKind, string> = { dial: '🔣 Dial lock', code: '🔢 Keypad', colors: '🎨 Colors', levers: '⚙️ Levers', maze: '🌑 Dark maze' };

export function Lobby() {
  return (
    <LobbyShell
      startLabel="Lock us in 🔐"
      howTo={
        <>
          <h2 className="font-display text-xl font-extrabold">How it works</h2>
          <p>🔐 You're each locked in a different room, solving the same 4 puzzles in order.</p>
          <p>🗣️ For every puzzle, one of you sees the <b>clue</b> (a mural, a note, a window, a map) and the other has the <b>controls</b>. You can't see each other's screens: describe!</p>
          <p>⏱️ Three rooms. Your time counts, and every mistake adds 15 seconds.</p>
        </>
      }
      settings={
        <>
          <FirstChoice label="🎛️ Who has the controls first?" />
          <p className="font-semibold text-ink-soft">Puzzles are different every game: 🔣 dials, 🔢 keypads, 🎨 colors, ⚙️ levers and a 🌑 dark maze.</p>
        </>
      }
    />
  );
}

export function Play() {
  const { act, clockOffset } = useGame();
  const { s, partner } = useRoom();
  const reduce = useReducedMotion();
  const [now, setNow] = useState(Date.now());
  const [shownFlash, setShownFlash] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!s.flash) return;
    setShownFlash(s.flash.id);
    const t = setTimeout(() => setShownFlash(-1), 1600);
    return () => clearTimeout(t);
  }, [s.flash]);
  const def = ROOMS[s.room]!;
  const cur = s.puzzles[s.current];
  const iAct = cur?.actorSeat === s.mySeat;
  const send = (a: Act) => void act('puzzle:act', a);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="sticker px-3 py-1 font-display font-extrabold">
          {def.emoji} Room {s.room + 1}/3 · {def.name}
        </span>
        <span className="font-semibold italic text-ink-soft">{def.story}</span>
        <span className="ml-auto flex gap-2 font-display font-extrabold">
          <span className="sticker px-3 py-1">⏱️ {fmt(now + clockOffset - s.startedAt)}</span>
          <span className="sticker px-3 py-1">❌ {s.mistakes}</span>
        </span>
      </div>
      <ol className="grid grid-cols-4 gap-2">
        {s.puzzles.map((p, i) => (
          <li
            key={i}
            className={`rounded-xl border-[3px] border-line px-2 py-1 text-center text-sm font-extrabold ${p.solved ? 'bg-mint text-[#2b2140]' : i === s.current ? 'bg-yellow text-[#2b2140]' : 'opacity-50'}`}
          >
            {p.solved ? '✅' : i === s.current ? '👉' : '🔒'} {KIND_LABEL[p.kind]}
          </li>
        ))}
      </ol>
      {cur?.card && (
        <>
          <p className="text-center font-display text-xl font-extrabold">
            {iAct ? `🎛️ You have the controls. Ask ${partner?.name ?? 'your partner'} what they see!` : `🗣️ You have the clue. Describe it to ${partner?.name ?? 'your partner'}!`}
          </p>
          <motion.div key={`${s.room}-${s.current}`} initial={reduce ? false : { y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <CardView card={cur.card} send={send} />
          </motion.div>
        </>
      )}
      <AnimatePresence>
        {s.flash && shownFlash === s.flash.id && (
          <motion.div
            key={s.flash.id}
            initial={reduce ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-x-0 top-24 z-40 flex justify-center"
          >
            <span className={`sticker px-6 py-3 font-display text-2xl font-extrabold ${s.flash.good ? '!bg-mint' : '!bg-[#ff4f4f] text-white'} text-[#2b2140]`}>{s.flash.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export function Clear() {
  const { act } = useGame();
  const { s, me, partner } = useRoom();
  const reduce = useReducedMotion();
  const last = s.results[s.results.length - 1];
  if (!last) return null;
  const iAmReady = s.readyForNext.includes(me.id);
  const isLast = last.room === ROOMS.length - 1;
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5">
      <motion.h1
        initial={reduce ? false : { scale: 2, opacity: 0, rotate: -6 }}
        animate={{ scale: 1, opacity: 1, rotate: -2 }}
        className="sticker self-center !bg-mint px-8 py-4 text-center font-display text-4xl font-extrabold text-[#2b2140]"
      >
        🚪 Escaped {ROOMS[last.room]!.name}!
      </motion.h1>
      <section className="sticker p-5 text-center font-semibold">
        <p className="text-lg">
          ⏱️ {fmt(last.ms)} · ❌ {last.mistakes} mistake{last.mistakes === 1 ? '' : 's'} (+{(last.mistakes * MISTAKE_PENALTY_MS) / 1000}s)
        </p>
        <p className="font-display text-2xl font-extrabold">Score: {fmt(last.ms + last.mistakes * MISTAKE_PENALTY_MS)}</p>
      </section>
      <button className="btn btn-mint w-full" disabled={iAmReady} onClick={() => act('round:ready')}>
        {iAmReady ? `Waiting for ${partner?.name ?? '…'}…` : isLast ? 'See how we did 🏆' : `Next: ${ROOMS[last.room + 1]!.emoji} ${ROOMS[last.room + 1]!.name} →`}
      </button>
      {me.isHost && <RecapActions />}
    </main>
  );
}

export function Finish() {
  const { s, me } = useRoom();
  const total = s.results.reduce((a, r) => a + r.ms + r.mistakes * MISTAKE_PENALTY_MS, 0);
  const verdict = total < 6 * 60_000 ? '🧠 Escape artists. Suspiciously in sync.' : total < 12 * 60_000 ? '😎 Smooth teamwork!' : '😅 You got out. Eventually.';
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5">
      <h1 className="sticker self-center !bg-yellow px-8 py-4 text-center font-display text-4xl font-extrabold text-[#2b2140]">🏆 Free at last!</h1>
      <section className="sticker space-y-2 p-5 font-semibold">
        <p className="text-center font-display text-2xl font-extrabold">Total {fmt(total)}</p>
        <p className="text-center">{verdict}</p>
        <ol className="space-y-1">
          {s.results.map((r) => (
            <li key={r.room} className="flex justify-between">
              <span>
                {ROOMS[r.room]!.emoji} {ROOMS[r.room]!.name}
              </span>
              <span>
                {fmt(r.ms)} · ❌ {r.mistakes}
              </span>
            </li>
          ))}
        </ol>
      </section>
      {me.isHost ? <RecapActions /> : <p className="text-center text-ink-soft">The host can start again.</p>}
    </main>
  );
}
