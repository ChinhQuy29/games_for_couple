import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PLAYER_COLORS } from '@gfc/kit/client';
import { COUNT_OPTIONS, ORDER_OPTIONS, STYLE_OPTIONS } from '../shared';
import { kit } from './kit';
import Board from './Board';

const { useGame, useRoom, LobbyShell, Choice, Scores, RecapActions, Avatar } = kit;

const ORDER_LABEL = { asc: '⬆️ 1 → 100', desc: '⬇️ 100 → 1', random: '🎲 Random' } as const;

export function Lobby() {
  const { act } = useGame();
  const { s } = useRoom();
  const set = (patch: object) => act('settings:update', patch);
  return (
    <LobbyShell
      startLabel="Ready, set, find! 🔢"
      howTo={
        <>
          <h2 className="font-display text-xl font-extrabold">How it works</h2>
          <p>🔢 Every number is on the board at once. You both hunt for the same one.</p>
          <p>⚡ Whoever clicks it first gets the point (timed on your own screen, so lag doesn't matter).</p>
          <p>🔒 Wrong click = locked out for 1.5 seconds. No spam-clicking!</p>
          <p>🏆 Most numbers when the board is empty wins.</p>
        </>
      }
      settings={
        <>
          <Choice label="How many numbers" value={s.settings.count} options={COUNT_OPTIONS} onPick={(count) => set({ count })} />
          <Choice label="Order" value={s.settings.order} options={ORDER_OPTIONS} onPick={(order) => set({ order })} render={(o) => ORDER_LABEL[o]} />
          <Choice
            label="Board style"
            value={s.settings.style}
            options={STYLE_OPTIONS}
            onPick={(style) => set({ style })}
            render={(st) => (st === 'calm' ? '😌 Calm' : '🌀 Chaos (sizes, angles, colors)')}
          />
        </>
      }
    />
  );
}

export function Play() {
  const { act, clockOffset } = useGame();
  const { s, seat } = useRoom();
  const reduce = useReducedMotion();
  const target = s.target;
  // Reaction time is measured on this device, from when this target first appeared here.
  const shownAt = useRef(0);
  const [now, setNow] = useState(Date.now());
  const [shake, setShake] = useState(0);
  const lastFind = s.finds[s.finds.length - 1];

  const startsAtLocal = s.startsAt - clockOffset;
  useEffect(() => {
    shownAt.current = Math.max(Date.now(), startsAtLocal);
  }, [target, startsAtLocal]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  const countdown = Math.ceil((startsAtLocal - now) / 1000);
  const lockLeft = s.myLockUntil - clockOffset - now;
  const locked = lockLeft > 0;

  async function pick(n: number) {
    if (countdown > 0 || locked) return;
    const res = await act<{ result: 'wrong' | 'claimed' | 'late' }>('pick', { n, ms: Math.max(0, Math.round(Date.now() - shownAt.current)) });
    if (res.ok && res.result === 'wrong') setShake((x) => x + 1);
  }

  const finder = lastFind ? s.players.find((p) => p.id === lastFind.by) : undefined;

  return (
    <main className="flex flex-1 flex-col gap-3">
      <div className="grid items-center gap-3 lg:grid-cols-[1fr_auto_1fr]">
        <Scores scores={s.scores} />
        <motion.div
          key={`${target}-${shake}`}
          initial={reduce || shake ? false : { scale: 1.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, x: shake && !reduce ? [-14, 14, -10, 10, 0] : 0 }}
          transition={{ duration: 0.35 }}
          className={`sticker px-8 py-2 text-center ${locked ? '!bg-muted' : '!bg-yellow'} text-on-accent`}
        >
          <p className="font-display text-sm font-extrabold uppercase">{locked ? '🔒 locked' : 'Find'}</p>
          <p className="font-display text-6xl font-extrabold leading-none">{target ?? '…'}</p>
        </motion.div>
        <div className="text-center font-display font-extrabold lg:text-right">
          <p className="text-ink-soft">
            {s.found}/{s.total} found
          </p>
          {lastFind && finder && (
            <p key={lastFind.n} className="text-lg" style={{ color: PLAYER_COLORS[seat(finder.id)] }}>
              {finder.id === s.you ? 'You' : finder.name} got {lastFind.n}! ({(lastFind.ms / 1000).toFixed(2)}s)
            </p>
          )}
        </div>
      </div>

      <div className="relative">
        <Board board={s.board} claimed={s.claimed} seatOf={seat} onPick={pick} locked={locked || countdown > 0} />
        {countdown > 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <motion.p
              key={countdown}
              initial={reduce ? false : { scale: 2.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-display text-[10rem] font-extrabold text-pink drop-shadow-[6px_6px_0_var(--line)]"
            >
              {countdown}
            </motion.p>
          </div>
        )}
        {locked && (
          <p className="pointer-events-none absolute inset-x-0 top-6 text-center font-display text-3xl font-extrabold text-pink drop-shadow-[3px_3px_0_var(--line)]">
            🔒 Oops! {Math.ceil(lockLeft / 100) / 10}s
          </p>
        )}
      </div>
    </main>
  );
}

export function Recap() {
  const { s, seat } = useRoom();
  const [a, b] = s.players;
  const sa = a ? (s.scores[a.id] ?? 0) : 0;
  const sb = b ? (s.scores[b.id] ?? 0) : 0;
  const winner = sa === sb ? null : sa > sb ? a : b;
  const statsFor = (id: string) => {
    const mine = s.finds.filter((f) => f.by === id);
    const fastest = [...mine].sort((x, y) => x.ms - y.ms)[0];
    const avg = mine.length ? mine.reduce((t, f) => t + f.ms, 0) / mine.length : 0;
    let streak = 0;
    let best = 0;
    for (const f of s.finds) {
      streak = f.by === id ? streak + 1 : 0;
      best = Math.max(best, streak);
    }
    return { count: mine.length, fastest, avg, best };
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5">
      <h1 className="text-center font-display text-4xl font-extrabold">{winner ? `🏆 ${winner.name} wins!` : "🤝 It's a tie!"}</h1>
      <section className="grid grid-cols-2 gap-4">
        {s.players.map((p) => {
          const st = statsFor(p.id);
          return (
            <div key={p.id} className={`sticker flex flex-col items-center gap-1 p-4 text-center ${p === winner ? '!bg-yellow text-on-accent' : ''}`}>
              <Avatar id={p.id} size="text-5xl" />
              <p className="font-display text-2xl font-extrabold" style={{ color: p === winner ? undefined : PLAYER_COLORS[seat(p.id)] }}>
                {p.name}
              </p>
              <p className="font-display text-4xl font-extrabold">{st.count}</p>
              <p className="font-semibold">⚡ fastest: {st.fastest ? `${st.fastest.n} in ${(st.fastest.ms / 1000).toFixed(2)}s` : '–'}</p>
              <p className="font-semibold">⏱️ average: {(st.avg / 1000).toFixed(2)}s</p>
              <p className="font-semibold">🔥 best streak: {st.best}</p>
            </div>
          );
        })}
      </section>
      <p className="text-center font-display font-bold text-ink-soft">Who found what:</p>
      <Board board={s.board} claimed={s.claimed} seatOf={seat} />
      <RecapActions />
    </main>
  );
}
