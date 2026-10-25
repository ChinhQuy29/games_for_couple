import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { PLAYER_COLORS } from '@gfc/kit/client';
import { LEVELS, type Frame } from '../shared';
import { kit } from './kit';
import { Stage, type Buffered } from './Stage';

const { useGame, useRoom, useFrame, LobbyShell, Choice, RecapActions } = kit;

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function Lobby() {
  const { act } = useGame();
  const { s } = useRoom();
  return (
    <LobbyShell
      startLabel="Become one 🕹️"
      howTo={
        <>
          <h2 className="font-display text-xl font-extrabold">How it works</h2>
          <p>🕹️ You both control the <b>same character</b>.</p>
          <p>👟 The <b>Walker</b> moves left and right (A/D or ←/→). 🦘 The <b>Jumper</b> jumps (W, ↑ or Space; hold for higher).</p>
          <p>⇄ Swap pads trade your jobs mid-level. 🔑 opens doors, 🔘 opens gates for 5 seconds, spikes send you back to the start.</p>
          <p>🗣️ Count it out loud: "three, two, one, JUMP!" Press R to restart a level if you get stuck.</p>
        </>
      }
      settings={
        <Choice
          label="Start at level"
          value={s.startLevel}
          options={LEVELS.map((_, i) => i)}
          onPick={(startLevel) => act('settings:update', { startLevel })}
          render={(i) => `${i + 1}. ${LEVELS[i]!.name}`}
        />
      }
    />
  );
}

const KEYS: Record<string, 'left' | 'right' | 'jump'> = {
  a: 'left',
  arrowleft: 'left',
  d: 'right',
  arrowright: 'right',
  w: 'jump',
  arrowup: 'jump',
  ' ': 'jump',
};

function useHeldKeys(onRetry: () => void) {
  const { send } = useGame();
  const retry = useRef(onRetry);
  retry.current = onRetry;
  useEffect(() => {
    const held = { left: false, right: false, jump: false };
    const set = (e: KeyboardEvent, v: boolean) => {
      const k = e.key.toLowerCase();
      if (k === 'r' && v && !e.repeat) return retry.current();
      const what = KEYS[k];
      if (!what) return;
      e.preventDefault();
      if (held[what] === v) return;
      held[what] = v;
      send('input', { ...held });
    };
    const down = (e: KeyboardEvent) => set(e, true);
    const up = (e: KeyboardEvent) => set(e, false);
    const blur = () => {
      held.left = held.right = held.jump = false;
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

export function Play() {
  const { act, clockOffset } = useGame();
  const { s, partner, seat } = useRoom();
  const reduce = useReducedMotion();
  const frames = useRef<Buffered>({ prev: null, last: s.frame, at: performance.now() });
  const [hud, setHud] = useState<Frame | null>(s.frame);
  const [now, setNow] = useState(Date.now());
  useHeldKeys(() => void act('level:retry'));
  useFrame<Frame>((f) => {
    frames.current = { prev: frames.current.last, last: f, at: performance.now() };
  });
  useEffect(() => {
    const id = setInterval(() => {
      setHud(frames.current.last);
      setNow(Date.now());
    }, 150);
    return () => clearInterval(id);
  }, []);

  const level = LEVELS[s.level]!;
  const walkerId = hud?.walker ?? s.walkerId;
  const iWalk = walkerId === s.you;
  const jumperId = s.players.find((p) => p.id !== walkerId)?.id ?? '';
  const countdown = s.startsAt - (now + clockOffset);
  const died = now + clockOffset - s.lastDeathAt < 1200 && s.deaths > 0;

  return (
    <main className="relative flex flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="sticker px-3 py-1 font-display font-extrabold">
          Level {s.level + 1}/6 · {level.name}
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={walkerId}
            initial={reduce ? false : { scale: 1.6, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            className={`rounded-xl border-[3px] border-line px-4 py-1 font-display text-xl font-extrabold text-[#2b2140] ${iWalk ? 'bg-pink' : 'bg-sky'}`}
          >
            {iWalk ? '👟 You WALK · A/D ←/→' : '🦘 You JUMP · W/Space'}
          </motion.span>
        </AnimatePresence>
        <span className="font-bold text-ink-soft">{partner?.name} {iWalk ? 'jumps' : 'walks'}</span>
        <span className="ml-auto flex items-center gap-2 font-display font-extrabold">
          <span className="sticker px-3 py-1">⏱️ {fmt((hud?.t ?? 0) * 1000)}</span>
          <span className="sticker px-3 py-1">💀 {hud?.deaths ?? s.deaths}</span>
          {hud?.key && <span className="sticker px-3 py-1">🔑</span>}
          {hud && hud.gate > 0 && <span className="sticker !bg-mint px-3 py-1 text-[#2b2140]">🚪 {Math.ceil(hud.gate)}s</span>}
          <button className="chip !min-h-0 !py-1 text-sm" onClick={() => act('level:retry')}>
            ↺ Retry (R)
          </button>
        </span>
      </div>
      <p className="text-sm font-semibold text-ink-soft">💡 {level.hint}</p>
      <div className="relative">
        <Stage frames={frames} level={s.level} walkerColor={PLAYER_COLORS[seat(walkerId ?? '')]!} jumperColor={PLAYER_COLORS[seat(jumperId)]!} />
        {died && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="sticker !bg-[#ff4f4f] px-6 py-3 font-display text-3xl font-extrabold text-white">OOPS 💀</span>
          </div>
        )}
        {countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
            <span className="sticker px-10 py-6 text-center font-display text-5xl font-extrabold">
              {Math.ceil(countdown / 1000)}
              <span className="mt-2 block text-xl">{iWalk ? 'You walk 👟' : 'You jump 🦘'}</span>
            </span>
          </div>
        )}
      </div>
    </main>
  );
}

export function Clear() {
  const { act } = useGame();
  const { s, me, partner } = useRoom();
  const reduce = useReducedMotion();
  const last = s.results[s.results.length - 1];
  const iAmReady = s.readyForNext.includes(me.id);
  if (!last) return null;
  const isLast = last.level === LEVELS.length - 1;
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5">
      <motion.h1
        initial={reduce ? false : { scale: 2.2, opacity: 0, rotate: -6 }}
        animate={{ scale: 1, opacity: 1, rotate: -2 }}
        transition={{ type: 'spring', stiffness: 240, damping: 12 }}
        className="sticker self-center !bg-mint px-8 py-4 text-center font-display text-4xl font-extrabold text-[#2b2140]"
      >
        ⭐ Level {last.level + 1} cleared!
      </motion.h1>
      <section className="sticker space-y-1 p-5 text-center font-semibold">
        <p className="font-display text-2xl font-extrabold">{LEVELS[last.level]!.name}</p>
        <p className="text-lg">
          ⏱️ {fmt(last.ms)} · 💀 {last.deaths} deaths · ⇄ {last.swaps} swaps
        </p>
        <p className="text-ink-soft">{last.deaths === 0 ? 'Perfectly in sync. Are you sure you are two people?' : last.deaths < 5 ? 'Mostly in sync.' : 'Who said "now"?! 😂'}</p>
      </section>
      <button className="btn btn-mint w-full" disabled={iAmReady} onClick={() => act('round:ready')}>
        {iAmReady ? `Waiting for ${partner?.name ?? '…'}…` : isLast ? 'See the results 🏆' : `Next level → ${LEVELS[last.level + 1]!.name}`}
      </button>
      {me.isHost && <RecapActions />}
    </main>
  );
}

export function Finish() {
  const { s, me } = useRoom();
  const total = s.results.reduce((a, r) => a + r.ms, 0);
  const deaths = s.results.reduce((a, r) => a + r.deaths, 0);
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5">
      <h1 className="sticker self-center !bg-yellow px-8 py-4 text-center font-display text-4xl font-extrabold text-[#2b2140]">🏆 You solved the two-body problem!</h1>
      <section className="sticker p-5 font-semibold">
        <p className="mb-2 text-center font-display text-2xl font-extrabold">
          ⏱️ {fmt(total)} · 💀 {deaths} deaths
        </p>
        <ol className="space-y-1">
          {s.results.map((r) => (
            <li key={r.level} className="flex justify-between">
              <span>
                {r.level + 1}. {LEVELS[r.level]!.name}
              </span>
              <span>
                {fmt(r.ms)} · 💀 {r.deaths}
              </span>
            </li>
          ))}
        </ol>
      </section>
      {me.isHost ? <RecapActions /> : <p className="text-center text-ink-soft">The host can start again.</p>}
    </main>
  );
}
