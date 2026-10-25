import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HOUSES, ITEMS, type Frame, type ItemKind } from '../shared';
import { kit } from './kit';
import { Stage, type Buffered } from './Stage';

const { useGame, useRoom, useFrame, LobbyShell, RecapActions, Choice } = kit;

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
const money = (n: number) => `$${n.toLocaleString('en-US')}`;

export function Lobby() {
  const { act } = useGame();
  const { s } = useRoom();
  return (
    <LobbyShell
      startLabel="Start the move 🚚"
      howTo={
        <>
          <h2 className="font-display text-xl font-extrabold">How it works</h2>
          <p>🏃 Each of you is a mover: <b>A/D</b> or <b>←/→</b> to walk, <b>W</b> or <b>Space</b> to jump.</p>
          <p>🤲 <b>E</b> picks up whatever is in reach, or puts it down. <b>F</b> throws small things (risky!).</p>
          <p>🎹 Big things (TV, piano, fish tank, sofa) need <b>both of you</b> holding on. Walk together: pull apart and you'll drop it. No jumping with heavy stuff.</p>
          <p>🚚 Put things down in the green truck zone. Bumps and drops cost money; fragile things break.</p>
        </>
      }
      settings={
        <>
          <Choice
            label="🏠 Start at"
            value={s.startHouse}
            options={HOUSES.map((_, i) => i)}
            onPick={(startHouse) => act('settings:update', { startHouse })}
            render={(i) => `${i + 1}. ${HOUSES[i]!.name}`}
          />
          <p className="font-semibold text-ink-soft">
            {HOUSES.length - s.startHouse} house{HOUSES.length - s.startHouse === 1 ? '' : 's'} to move, from {HOUSES[s.startHouse]!.name.replace(/^The /, 'the ')} on. Every dollar you deliver counts.
          </p>
        </>
      }
    />
  );
}

const KEYS: Record<string, 'left' | 'right' | 'jump' | 'grab' | 'throw'> = {
  a: 'left',
  arrowleft: 'left',
  d: 'right',
  arrowright: 'right',
  w: 'jump',
  arrowup: 'jump',
  ' ': 'jump',
  e: 'grab',
  f: 'throw',
};

function useHeldKeys() {
  const { send } = useGame();
  useEffect(() => {
    const held = { left: false, right: false, jump: false, grab: false, throw: false };
    const set = (e: KeyboardEvent, v: boolean) => {
      const what = KEYS[e.key.toLowerCase()];
      if (!what) return;
      e.preventDefault();
      if (held[what] === v) return;
      held[what] = v;
      send('input', { ...held });
    };
    const down = (e: KeyboardEvent) => set(e, true);
    const up = (e: KeyboardEvent) => set(e, false);
    const blur = () => {
      held.left = held.right = held.jump = held.grab = held.throw = false;
      send('input', { ...held });
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [send]);
}

export function Move() {
  const { clockOffset } = useGame();
  const { s } = useRoom();
  const reduce = useReducedMotion();
  const frames = useRef<Buffered>({ prev: null, last: s.frame, at: performance.now() });
  const [hud, setHud] = useState<Frame | null>(s.frame);
  const [now, setNow] = useState(Date.now());
  useHeldKeys();
  useFrame<Frame>((f) => {
    frames.current = { prev: frames.current.last, last: f, at: performance.now() };
  });
  useEffect(() => {
    const id = setInterval(() => {
      setHud(frames.current.last);
      setNow(Date.now());
    }, 200);
    return () => clearInterval(id);
  }, []);
  const kinds = useMemo(() => new Map<number, ItemKind>(s.items.map((i) => [i.id, i.kind])), [s.items]);
  const names = useMemo(() => s.players.map((p) => p.name), [s.players]);
  const house = HOUSES[s.house]!;
  const countdown = s.startsAt - (now + clockOffset);
  const left = hud?.left ?? house.timeS;

  return (
    <main className="relative flex flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="sticker px-3 py-1 font-display font-extrabold">
          🏠 {s.house + 1}/{HOUSES.length} · {house.name}
        </span>
        <span className={`rounded-xl border-[3px] border-line bg-[#1f1b2e] px-3 py-1 font-mono text-2xl font-bold ${left < 20 ? 'text-[#ff4f4f]' : 'text-white'}`}>⏱️ {fmt(left)}</span>
        <span className="sticker px-3 py-1 font-display font-extrabold">
          💰 {money(hud?.earned ?? s.earned)} <span className="text-sm text-ink-soft">/ {money(s.possible)}</span>
        </span>
        <span className="ml-auto text-sm font-bold text-ink-soft">A/D move · W jump · E grab/drop · F throw</span>
      </div>
      <p className="text-sm font-semibold text-ink-soft">💡 {house.hint}</p>
      <div className="relative">
        <Stage frames={frames} house={s.house} kinds={kinds} names={names} mySlot={s.mySlot} />
        <div className="pointer-events-none absolute right-3 top-3 flex flex-col items-end gap-1">
          <AnimatePresence>
            {s.feed.slice(-3).map((f) => (
              <motion.span
                key={f.id}
                initial={reduce ? false : { x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`sticker px-3 py-1 text-sm font-extrabold ${f.good ? '!bg-mint' : '!bg-[#ff4f4f] text-white'} text-[#2b2140]`}
              >
                {f.text}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
        {countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30">
            <span className="sticker px-10 py-6 font-display text-7xl font-extrabold">{Math.ceil(countdown / 1000)}</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 text-sm font-bold">
        {s.items.map((i) => (
          <span key={i.id} className={`rounded-full border-2 border-line px-2 py-0.5 ${i.state === 'delivered' ? 'bg-mint text-[#2b2140]' : i.state === 'broken' ? 'bg-[#ff4f4f] text-white line-through' : 'opacity-70'}`}>
            {i.state === 'delivered' ? '🚚' : i.state === 'broken' ? '💔' : ITEMS[i.kind].big ? '🫂' : '🤲'} {ITEMS[i.kind].name} · {money(ITEMS[i.kind].value)}
          </span>
        ))}
      </div>
    </main>
  );
}

export function Done() {
  const { act } = useGame();
  const { s, me, partner } = useRoom();
  const reduce = useReducedMotion();
  const last = s.results[s.results.length - 1];
  if (!last) return null;
  const iAmReady = s.readyForNext.includes(me.id);
  const pct = last.possible ? last.earned / last.possible : 0;
  const verdict = pct > 0.85 ? '⭐⭐⭐ Five-star movers!' : pct > 0.6 ? '⭐⭐ Mostly in one piece.' : pct > 0.3 ? '⭐ The customer is… concerned.' : '💸 We will be hearing from their lawyer.';
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5">
      <motion.h1
        initial={reduce ? false : { scale: 2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="sticker self-center !bg-yellow px-8 py-4 text-center font-display text-4xl font-extrabold text-[#2b2140]"
      >
        🚚 {HOUSES[last.house]!.name}: moved!
      </motion.h1>
      <section className="sticker space-y-1 p-5 text-center font-semibold">
        <p className="font-display text-3xl font-extrabold">
          {money(last.earned)} <span className="text-lg text-ink-soft">of {money(last.possible)}</span>
        </p>
        <p>
          🚚 {last.delivered} delivered · 💔 {last.broken} broken
        </p>
        <p className="font-display text-xl font-extrabold">{verdict}</p>
      </section>
      <button className="btn btn-mint w-full" disabled={iAmReady} onClick={() => act('round:ready')}>
        {iAmReady ? `Waiting for ${partner?.name ?? '…'}…` : last.house + 1 >= HOUSES.length ? 'See the total 🏆' : `Next: ${HOUSES[last.house + 1]!.name} →`}
      </button>
      {me.isHost && <RecapActions />}
    </main>
  );
}

export function Finish() {
  const { s, me } = useRoom();
  const earned = s.results.reduce((a, r) => a + r.earned, 0);
  const possible = s.results.reduce((a, r) => a + r.possible, 0);
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5">
      <h1 className="sticker self-center !bg-mint px-8 py-4 text-center font-display text-4xl font-extrabold text-[#2b2140]">🏆 Moving day is over!</h1>
      <section className="sticker space-y-2 p-5 font-semibold">
        <p className="text-center font-display text-3xl font-extrabold">
          {money(earned)} <span className="text-lg text-ink-soft">of {money(possible)}</span>
        </p>
        <ol className="space-y-1">
          {s.results.map((r) => (
            <li key={r.house} className="flex justify-between">
              <span>🏠 {HOUSES[r.house]!.name}</span>
              <span>
                {money(r.earned)} · 💔 {r.broken}
              </span>
            </li>
          ))}
        </ol>
      </section>
      {me.isHost ? <RecapActions /> : <p className="text-center text-ink-soft">The host can start again.</p>}
    </main>
  );
}
