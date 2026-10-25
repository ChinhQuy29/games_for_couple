import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { TRIPS, type Frame } from '../shared';
import { kit } from './kit';
import { Road, type Buffered } from './Road';

const { useGame, useRoom, useFrame, LobbyShell, Avatar, RecapActions, FirstChoice } = kit;

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function Lobby() {
  return (
    <LobbyShell
      startLabel="Hit the road 🚐"
      howTo={
        <>
          <h2 className="font-display text-xl font-extrabold">How it works</h2>
          <p>🛞 The <b>Driver</b> steers: <b>A/D</b> or <b>←/→</b>. That's all they can do.</p>
          <p>🦶 The <b>Co-pilot</b> has the pedals (<b>W/↑</b> gas, <b>S/↓</b> brake) and the <b>map</b>: only they know which town to follow at each fork.</p>
          <p>🐄 Dodge cows, potholes and rocks, grab ⛽ before you run dry, and don't drive on the grass. Wrong fork = U-turn.</p>
          <p>🔁 Three trips; you swap seats every trip.</p>
        </>
      }
      settings={
        <>
          <FirstChoice label="🛞 Who drives first?" />
          <p className="font-semibold text-ink-soft">🏖️ To the beach · ⛰️ Mountain pass · 🌙 Night drive</p>
        </>
      }
    />
  );
}

const KEYS: Record<string, 'left' | 'right' | 'gas' | 'brake'> = {
  a: 'left',
  arrowleft: 'left',
  d: 'right',
  arrowright: 'right',
  w: 'gas',
  arrowup: 'gas',
  s: 'brake',
  arrowdown: 'brake',
};

function useHeldKeys() {
  const { send } = useGame();
  useEffect(() => {
    const held = { left: false, right: false, gas: false, brake: false };
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
      held.left = held.right = held.gas = held.brake = false;
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

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-extrabold uppercase">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full border-2 border-line bg-white">
        <div className="h-full transition-all" style={{ width: `${Math.max(0, value)}%`, background: value < 25 ? '#ff4f4f' : color }} />
      </div>
    </div>
  );
}

export function Drive() {
  const { clockOffset } = useGame();
  const { s, partner } = useRoom();
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
    }, 150);
    return () => clearInterval(id);
  }, []);
  const trip = TRIPS[s.trip]!;
  const countdown = s.startsAt - (now + clockOffset);
  const d = hud?.d ?? 0;
  const nextFork = s.junctions.find((j) => !j.passed);
  const forkIndex = nextFork ? s.junctions.indexOf(nextFork) : -1;

  return (
    <main className="relative grid flex-1 gap-3 lg:grid-cols-[1fr_300px]">
      <div className="relative min-h-[520px]" style={{ height: 'calc(100dvh - 140px)' }}>
        <Road frames={frames} s={s} />
        <div className="pointer-events-none absolute right-3 top-3 flex flex-col items-end gap-1">
          <AnimatePresence>
            {s.feed.slice(-3).map((f) => (
              <motion.span key={f.id} initial={reduce ? false : { x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ opacity: 0 }} className={`sticker px-3 py-1 text-sm font-extrabold ${f.good ? '!bg-mint' : '!bg-[#ff4f4f] text-white'} text-[#2b2140]`}>
                {f.text}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
        {countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30">
            <span className="sticker px-10 py-6 text-center font-display text-7xl font-extrabold">
              {Math.ceil(countdown / 1000)}
              <span className="mt-1 block text-xl">{s.myRole === 'driver' ? '🛞 You steer' : '🦶 You drive the pedals + 🗺️ map'}</span>
            </span>
          </div>
        )}
      </div>
      <aside className="flex flex-col gap-3">
        <div className={`sticker p-3 font-display font-extrabold ${s.myRole === 'driver' ? '!bg-pink' : '!bg-sky'} text-[#2b2140]`}>
          {s.myRole === 'driver' ? '🛞 You steer · A/D ←/→' : '🦶 Pedals · W gas / S brake'}
          <p className="text-sm font-bold">{partner?.name} {s.myRole === 'driver' ? 'has the pedals and the map' : 'is steering'}</p>
        </div>
        <div className="sticker space-y-2 p-3">
          <p className="font-display font-extrabold">
            {trip.emoji} {trip.name}
          </p>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold">{Math.round((hud?.speed ?? 0) * 8)}</span>
            <span className="text-sm font-bold text-ink-soft">km/h · ⏱️ {fmt((hud?.t ?? 0) * 1000)}</span>
          </div>
          <Meter label="⛽ Fuel" value={hud?.fuel ?? 100} color="#ffc93c" />
          <Meter label="🔧 Van" value={hud?.hp ?? 100} color="#3ddc97" />
          <div>
            <div className="relative h-3 rounded-full border-2 border-line bg-white">
              <div className="h-full rounded-full bg-pink" style={{ width: `${Math.min(100, (d / trip.length) * 100)}%` }} />
              {s.junctions.map((j, i) => (
                <span key={i} className="absolute -top-1 h-4 w-1 bg-[#2b2140]" style={{ left: `${(j.d / trip.length) * 100}%` }} />
              ))}
            </div>
            <p className="mt-1 text-xs font-bold text-ink-soft">{Math.max(0, Math.round(trip.length - d))} m to go</p>
          </div>
        </div>
        <div className="sticker !bg-[#fff8c7] p-3 text-[#2b2140]">
          <p className="font-display font-extrabold">🗺️ The map</p>
          {s.route ? (
            <ol className="mt-1 space-y-1 font-bold">
              {s.route.map((town, i) => (
                <li key={i} className={i < forkIndex || forkIndex === -1 ? 'line-through opacity-50' : i === forkIndex ? 'text-lg text-pink' : ''}>
                  {i === forkIndex ? '👉 ' : ''}Fork {i + 1}: follow <b>{town}</b>
                  {i === forkIndex && nextFork ? ` · in ${Math.max(0, Math.round(nextFork.d - d))} m` : ''}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-1 text-sm font-bold">Only {partner?.name ?? 'your co-pilot'} can see it. Ask which way at every fork!</p>
          )}
        </div>
      </aside>
    </main>
  );
}

const OUTCOME = {
  arrived: { title: '🎉 We made it!', good: true },
  'broke-down': { title: '💥 Broke down', good: false },
  'out-of-gas': { title: '⛽ Out of gas', good: false },
} as const;

export function Arrived() {
  const { act } = useGame();
  const { s, me, partner } = useRoom();
  const reduce = useReducedMotion();
  const last = s.results[s.results.length - 1];
  if (!last) return null;
  const trip = TRIPS[last.trip]!;
  const o = OUTCOME[last.outcome];
  const iAmReady = s.readyForNext.includes(me.id);
  const driver = s.players.find((p) => p.id === last.driverId);
  const stars = last.outcome !== 'arrived' ? 0 : 1 + Number(last.ms / 1000 <= trip.par) + Number(last.hp >= 70 && last.wrongTurns === 0);
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5">
      <motion.h1
        initial={reduce ? false : { scale: 2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`sticker self-center px-8 py-4 text-center font-display text-4xl font-extrabold ${o.good ? '!bg-mint' : '!bg-[#ff4f4f] text-white'} text-[#2b2140]`}
      >
        {o.title}
      </motion.h1>
      <section className="sticker space-y-1 p-5 text-center font-semibold">
        <p className="font-display text-2xl font-extrabold">
          {trip.emoji} {trip.name} {stars > 0 ? '⭐'.repeat(stars) : ''}
        </p>
        <p>
          ⏱️ {fmt(last.ms)} (par {fmt(trip.par * 1000)}) · 🔧 {last.hp}% · 🔁 {last.wrongTurns} wrong turn{last.wrongTurns === 1 ? '' : 's'}
        </p>
        <p className="flex items-center justify-center gap-2 text-ink-soft">
          {driver && <Avatar id={driver.id} size="text-xl" />} {driver?.name} steered
        </p>
      </section>
      <button className="btn btn-mint w-full" disabled={iAmReady} onClick={() => act('round:ready')}>
        {iAmReady ? `Waiting for ${partner?.name ?? '…'}…` : last.trip + 1 >= TRIPS.length ? 'Trip summary 🏆' : `Next: ${TRIPS[last.trip + 1]!.emoji} ${TRIPS[last.trip + 1]!.name} (swap seats)`}
      </button>
      {me.isHost && <RecapActions />}
    </main>
  );
}

export function Finish() {
  const { s, me } = useRoom();
  const arrived = s.results.filter((r) => r.outcome === 'arrived').length;
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5">
      <h1 className="sticker self-center !bg-yellow px-8 py-4 text-center font-display text-4xl font-extrabold text-[#2b2140]">🗺️ Road trip over!</h1>
      <section className="sticker space-y-2 p-5 font-semibold">
        <p className="text-center font-display text-2xl font-extrabold">
          {arrived}/{s.results.length} trips made it
        </p>
        <ol className="space-y-1">
          {s.results.map((r) => (
            <li key={r.trip} className="flex justify-between">
              <span>
                {TRIPS[r.trip]!.emoji} {TRIPS[r.trip]!.name}
              </span>
              <span>
                {OUTCOME[r.outcome].title.split(' ')[0]} {fmt(r.ms)} · 🔧 {r.hp}%
              </span>
            </li>
          ))}
        </ol>
      </section>
      {me.isHost ? <RecapActions /> : <p className="text-center text-ink-soft">The host can start again.</p>}
    </main>
  );
}
