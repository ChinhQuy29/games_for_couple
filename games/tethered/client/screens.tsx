import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CHECKPOINTS, type Frame, type Input } from '../shared';
import { kit } from './kit';
import { Tower, type Buffered } from './Tower';

const { useGame, useRoom, useFrame, LobbyShell, RecapActions } = kit;

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function Lobby() {
  return (
    <LobbyShell
      startLabel="Start climbing ⛓️"
      howTo={
        <>
          <h2 className="font-display text-xl font-extrabold">How it works</h2>
          <p>🧗 You each control your own climber: <b>A/D</b> or <b>←/→</b> to move, <b>W</b>, <b>↑</b> or <b>Space</b> to jump.</p>
          <p>⛓️ You're chained together, 3.5 tiles apart. Jump too far ahead and you yank your partner off the ledge.</p>
          <p>✊ Hold <b>S</b>, <b>↓</b> or <b>Shift</b> to grab the floor or a wall and become an anchor. It uses stamina. Jump off a wall while grabbing to climb.</p>
          <p>🚩 Flags are checkpoints. Wooden planks you can jump through, cracked blocks crumble, blue platforms move, spikes hurt. Reach the 🏁.</p>
        </>
      }
      settings={<p className="font-semibold text-ink-soft">One tower, three camps. Fewest falls wins bragging rights.</p>}
    />
  );
}

const KEYS: Record<string, keyof Input> = {
  a: 'left',
  arrowleft: 'left',
  d: 'right',
  arrowright: 'right',
  w: 'jump',
  arrowup: 'jump',
  ' ': 'jump',
  s: 'grab',
  arrowdown: 'grab',
  shift: 'grab',
};

/** Sends held keys to the server whenever they change. */
function useInputKeys() {
  const { send } = useGame();
  useEffect(() => {
    const held: Input = { left: false, right: false, jump: false, grab: false };
    const set = (k: string, v: boolean, e: KeyboardEvent) => {
      const what = KEYS[k];
      if (!what) return;
      e.preventDefault();
      if (held[what] === v) return;
      held[what] = v;
      send('input', { ...held });
    };
    const down = (e: KeyboardEvent) => set(e.key.toLowerCase(), true, e);
    const up = (e: KeyboardEvent) => set(e.key.toLowerCase(), false, e);
    const blur = () => {
      held.left = held.right = held.jump = held.grab = false;
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

export function Climb() {
  const { s } = useRoom();
  const { clockOffset } = useGame();
  const reduce = useReducedMotion();
  const frames = useRef<Buffered>({ prev: null, last: s.frame, at: performance.now() });
  const [hud, setHud] = useState<Frame | null>(s.frame);
  const [now, setNow] = useState(Date.now());
  useInputKeys();
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

  const countdown = s.startsAt - (now + clockOffset);
  const fellRecently = now + clockOffset - s.lastFallAt < 1800 && s.falls > 0;
  const names = useMemo(() => s.players.map((p) => p.name), [s.players]);
  const camp = CHECKPOINTS[hud?.checkpoint ?? s.checkpoint]!;

  return (
    <main className="relative flex flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-xl border-[3px] border-line bg-[#1f1b2e] px-4 py-1 font-mono text-2xl font-bold text-white">⏱️ {fmt((hud?.t ?? 0) * 1000)}</span>
        <span className="sticker px-3 py-1 font-display font-extrabold">🚩 {camp.name}</span>
        <span className="sticker px-3 py-1 font-display font-extrabold">💀 {hud?.falls ?? s.falls} falls</span>
        <span className="sticker px-3 py-1 font-display font-extrabold" title="Times the chain yanked someone hard">⛓️ {hud?.pulls ?? s.pulls} yanks</span>
        <span className="ml-auto text-sm font-bold text-ink-soft">A/D move · W/Space jump · S/Shift grab</span>
      </div>
      <div className="relative">
        <Tower frames={frames} mySlot={s.mySlot} names={names} />
        {fellRecently && (
          <motion.div
            key={s.lastFallAt}
            initial={reduce ? false : { scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <span className="sticker !bg-[#ff4f4f] px-6 py-3 font-display text-3xl font-extrabold text-white">AAAAH! Back to {camp.name} 😵</span>
          </motion.div>
        )}
        {countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30">
            <span className="sticker px-10 py-6 font-display text-7xl font-extrabold">{Math.ceil(countdown / 1000)}</span>
          </div>
        )}
      </div>
    </main>
  );
}

export function Summit() {
  const { act } = useGame();
  const { s, me, partner } = useRoom();
  const reduce = useReducedMotion();
  const last = s.results[s.results.length - 1];
  const iAmReady = s.readyForNext.includes(me.id);
  if (!last) return null;
  const best = Math.min(...s.results.map((r) => r.ms));
  const drama = last.falls === 0 ? '😇 Flawless. Suspiciously flawless.' : last.falls < 4 ? '😅 A few scares' : last.falls < 10 ? '😱 Lots of screaming' : '🎭 Pure drama. Who was holding who back?';
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5">
      <motion.h1
        initial={reduce ? false : { scale: 2.2, opacity: 0, rotate: -6 }}
        animate={{ scale: 1, opacity: 1, rotate: -2 }}
        transition={{ type: 'spring', stiffness: 240, damping: 12 }}
        className="sticker self-center !bg-mint px-8 py-4 text-center font-display text-5xl font-extrabold text-[#2b2140]"
      >
        🏁 SUMMIT!
      </motion.h1>
      <section className="sticker space-y-2 p-5 text-center font-semibold">
        <p className="font-display text-3xl font-extrabold">⏱️ {fmt(last.ms)}</p>
        <p className="text-lg">
          💀 {last.falls} falls · ⛓️ {last.pulls} yanks
        </p>
        <p className="font-display text-xl font-extrabold">{drama}</p>
        {s.results.length > 1 && <p className="text-ink-soft">Best time together: {fmt(best)}</p>}
      </section>
      <button className="btn btn-mint w-full" disabled={iAmReady} onClick={() => act('round:ready')}>
        {iAmReady ? `Waiting for ${partner?.name ?? '…'}…` : 'Climb again 🧗'}
      </button>
      {me.isHost && <RecapActions />}
    </main>
  );
}
