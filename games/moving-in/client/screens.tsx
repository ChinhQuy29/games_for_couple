import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ROOMS } from '../shared';
import { kit } from './kit';
import { RoomView } from './RoomView';
import { SolvedScene } from './Scene';

const { useGame, useRoom, LobbyShell, Choice, RecapActions } = kit;

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function Lobby() {
  const { act } = useGame();
  const { s } = useRoom();
  const [a, b] = s.players.map((p) => p.name);
  return (
    <LobbyShell
      startLabel="Start unpacking 📦"
      howTo={
        <>
          <h2 className="font-display text-xl font-extrabold">How it works</h2>
          <p>📦 You each have your own box. Click it to take the next thing out.</p>
          <p>🖐️ Drag things where they belong. <b>Every item has one exact spot</b> (two mugs can swap). Once something's out, either of you can move it.</p>
          <p>🔴 When both boxes are empty, anything in the wrong place glows red.</p>
          <p>💡 Stuck? 3 hints per room show where one thing goes. Six rooms, one story.</p>
        </>
      }
      settings={
        <>
          <Choice
            label="Start at room"
            value={s.startRoom}
            options={ROOMS.map((_, i) => i)}
            onPick={(startRoom) => act('settings:update', { startRoom })}
            render={(i) => `${i + 1}. ${ROOMS[i]!.name}`}
          />
          {b && (
            <Choice
              label="Whose stuff is whose?"
              value={s.swapBoxes}
              options={[false, true]}
              onPick={(swapBoxes) => act('settings:update', { swapBoxes })}
              render={(swap) => (swap ? `${a} gets the plushies 🧸` : `${b} gets the plushies 🧸`)}
            />
          )}
        </>
      }
    />
  );
}

export function Unpack() {
  const { act, clockOffset } = useGame();
  const { s } = useRoom();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  const def = ROOMS[s.room]!;
  const placedOut = s.items.filter((i) => !i.inBox).length;
  return (
    <main className="flex flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="sticker px-3 py-1 font-display font-extrabold">
          Room {s.room + 1}/6 · {def.name}
        </span>
        <span className="font-semibold italic text-ink-soft">{def.caption}</span>
        <span className="ml-auto flex items-center gap-2 font-display font-extrabold">
          <span className="sticker px-3 py-1">⏱️ {fmt(now + clockOffset - s.startedAt)}</span>
          <span className="sticker px-3 py-1">
            📦 {placedOut}/{s.items.length} out
          </span>
          <button className="chip !min-h-0 !py-1" disabled={s.hintsLeft === 0} onClick={() => act('hint')}>
            💡 Hint ({s.hintsLeft})
          </button>
        </span>
      </div>
      {s.wrong.length > 0 && (
        <p className="text-center font-display font-extrabold text-[#ff4f4f]">
          Boxes empty, but {s.wrong.length} thing{s.wrong.length === 1 ? ' is' : 's are'} in the wrong place 🔴
        </p>
      )}
      <RoomView />
    </main>
  );
}

function Polaroid({ room, caption, tilt = 0 }: { room: number; caption: string; tilt?: number }) {
  return (
    <figure className="rounded-md border-[3px] border-line bg-white p-3 pb-2 shadow-[6px_6px_0_var(--line)]" style={{ transform: `rotate(${tilt}deg)` }}>
      <SolvedScene room={room} className="block w-full rounded-sm" />
      <figcaption className="pt-2 text-center font-display font-extrabold text-[#2b2140]">{caption}</figcaption>
    </figure>
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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4">
      <h1 className="text-center font-display text-3xl font-extrabold">📸 {ROOMS[last.room]!.name}</h1>
      <motion.div initial={reduce ? false : { scale: 0.7, rotate: -10, opacity: 0 }} animate={{ scale: 1, rotate: -1.5, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 14 }}>
        <Polaroid room={last.room} caption={ROOMS[last.room]!.caption} />
      </motion.div>
      <p className="text-center font-semibold">
        ⏱️ {fmt(last.ms)} · 💡 {last.hints} hint{last.hints === 1 ? '' : 's'}
      </p>
      <button className="btn btn-mint w-full" disabled={iAmReady} onClick={() => act('round:ready')}>
        {iAmReady ? `Waiting for ${partner?.name ?? '…'}…` : isLast ? 'Open our photo album 📖' : `Next: ${ROOMS[last.room + 1]!.name} →`}
      </button>
      {me.isHost && <RecapActions />}
    </main>
  );
}

export function Finish() {
  const { s, me } = useRoom();
  const total = s.results.reduce((a, r) => a + r.ms, 0);
  const [a, b] = s.players.map((p) => p.name);
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5">
      <h1 className="text-center font-display text-4xl font-extrabold">
        🏠 {a} & {b}: moved in
      </h1>
      <p className="text-center font-semibold text-ink-soft">
        {s.results.length} rooms · ⏱️ {fmt(total)} together
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {s.results.map((r, i) => (
          <Polaroid key={r.room} room={r.room} caption={`${r.room + 1}. ${ROOMS[r.room]!.name}`} tilt={[-2, 1.5, -1, 2, -1.5, 1][i % 6]} />
        ))}
      </div>
      {me.isHost ? <RecapActions /> : <p className="text-center text-ink-soft">The host can start again.</p>}
    </main>
  );
}
