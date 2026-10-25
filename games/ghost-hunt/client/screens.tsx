import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  EVIDENCE,
  EVIDENCE_IDS,
  GHOSTS,
  GHOST_IDS,
  HOUSES,
  houseOf,
  possibleGhosts,
  roomById,
  type Evidence,
  type ExplorerView,
  type NavigatorView,
} from '../shared';
import { kit } from './kit';
import { ExplorerMap, NavigatorMap, useMovementKeys } from './Maps';

const { useGame, useRoom, LobbyShell, Avatar, RecapActions, FirstChoice, Choice } = kit;

function useNow(ms = 250) {
  const { clockOffset } = useGame();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now + clockOffset;
}

const fmt = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function Lobby() {
  const { act } = useGame();
  const { s } = useRoom();
  const picked = s.houseChoice >= 0 ? houseOf(s.houseChoice) : null;
  return (
    <LobbyShell
      startLabel="Enter the house 🏚️"
      howTo={
        <>
          <h2 className="font-display text-xl font-extrabold">How it works</h2>
          <p>🔦 The <b>Explorer</b> walks the dark house (WASD or arrows) and only sees what the flashlight hits.</p>
          <p>🗺️ The <b>Navigator</b> sees the floor plan, the cameras, and the EMF and temperature readings for the Explorer's room. Never the ghost.</p>
          <p>🔎 Find 3 pieces of evidence, name the ghost in the journal, and walk out the front door.</p>
          <p>👻 When the lights flicker, it's about to <b>hunt</b>. Hide in a closet 🚪 or run. Roles swap every game.</p>
        </>
      }
      settings={
        <>
          <Choice
            label="🏚️ House"
            value={s.houseChoice}
            options={[-1, ...HOUSES.map((h) => h.id)]}
            onPick={(house) => act('settings:update', { house })}
            render={(id) => (id < 0 ? '🎲 Random' : `${houseOf(id).emoji} ${houseOf(id).name}`)}
          />
          <p className="text-sm font-semibold text-ink-soft">{picked ? picked.blurb : 'A different house every game.'}</p>
          <FirstChoice label="🔦 Who explores first?" />
          <p className="font-semibold text-ink-soft">{HOUSES.length} houses, 8 kinds of ghost, 10 minutes before sunrise.</p>
        </>
      }
    />
  );
}

function Status() {
  const { s } = useRoom();
  const now = useNow();
  const left = (s.deadline ?? now) - now;
  return (
    <div className="sticker space-y-2 p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-2xl font-bold">🌙 {fmt(left)}</span>
        <span
          className={`rounded-full border-2 border-line px-3 py-0.5 font-display text-sm font-extrabold ${
            s.hunt === 'hunt' ? 'animate-pulse bg-[#ff4f4f] text-white' : s.hunt === 'warning' ? 'bg-yellow text-[#2b2140]' : 'bg-mint text-[#2b2140]'
          }`}
        >
          {s.hunt === 'hunt' ? '👻 HUNTING' : s.hunt === 'warning' ? '💡 flickering…' : 'quiet'}
        </span>
      </div>
      <div>
        <div className="flex justify-between text-sm font-bold">
          <span>🧠 Explorer's sanity</span>
          <span>{s.sanity}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full border-2 border-line bg-white">
          <div className="h-full transition-all" style={{ width: `${s.sanity}%`, background: s.sanity > 50 ? '#3ddc97' : s.sanity > 25 ? '#ffc93c' : '#ff4f4f' }} />
        </div>
      </div>
    </div>
  );
}

function Journal() {
  const { act } = useGame();
  const { s } = useRoom();
  const { marks, guess } = s.journal;
  const left = possibleGhosts(marks);
  const cycle = (e: Evidence) => act('journal', { mark: { evidence: e, value: marks[e] === null ? 'yes' : marks[e] === 'yes' ? 'no' : null } });
  return (
    <div className="sticker space-y-2 !bg-[#fdf6e3] p-3 text-[#2b2140]">
      <h3 className="font-display font-extrabold">📓 Journal <span className="text-xs font-bold opacity-60">(shared · click to mark ✔ / ✘)</span></h3>
      <div className="grid grid-cols-2 gap-1">
        {EVIDENCE_IDS.map((e) => (
          <button
            key={e}
            onClick={() => cycle(e)}
            title={EVIDENCE[e].how}
            className={`rounded-lg border-2 border-[#2b2140] px-2 py-1 text-left text-sm font-bold ${marks[e] === 'yes' ? 'bg-mint' : marks[e] === 'no' ? 'bg-[#ffb3b3] line-through' : 'bg-white'}`}
          >
            {marks[e] === 'yes' ? '✔' : marks[e] === 'no' ? '✘' : '·'} {EVIDENCE[e].emoji} {EVIDENCE[e].name}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {GHOST_IDS.map((g) => {
          const possible = left.includes(g);
          return (
            <button
              key={g}
              onClick={() => act('journal', { guess: guess === g ? null : g })}
              title={`${GHOSTS[g].evidence.map((e) => EVIDENCE[e].emoji).join(' ')} · ${GHOSTS[g].trait}`}
              className={`rounded-full border-2 border-[#2b2140] px-2 py-0.5 text-xs font-extrabold ${guess === g ? 'bg-pink text-white' : possible ? 'bg-white' : 'bg-white opacity-30 line-through'}`}
            >
              {GHOSTS[g].name}
            </button>
          );
        })}
      </div>
      <p className="text-xs font-bold">{guess ? `Our guess: ${GHOSTS[guess].name}. Now get to the EXIT.` : 'Pick a guess before you leave.'}</p>
    </div>
  );
}

function Feed() {
  const { s } = useRoom();
  return (
    <div className="sticker max-h-40 space-y-1 overflow-y-auto p-3 text-sm font-semibold">
      {[...s.feed].reverse().map((f) => (
        <p key={f.id}>{f.text}</p>
      ))}
    </div>
  );
}

function ExplorerPanel({ v }: { v: ExplorerView }) {
  const { act } = useGame();
  const { s } = useRoom();
  const now = useNow(200);
  const tool = (t: string) => void act('tool', { tool: t });
  useMovementKeys(
    (dir) => void act('move', { dir }),
    (k) => {
      const map: Record<string, string> = { f: 'uv', q: 'spiritbox', b: 'book', c: 'camera', ' ': 'hide', e: 'hide' };
      if (map[k]) tool(map[k]!);
    },
    true,
  );
  const sbReady = now >= s.spiritboxReadyAt;
  const btn = 'chip justify-between text-sm';
  return (
    <div className="sticker space-y-2 p-3">
      <h3 className="font-display font-extrabold">🎒 Your tools</h3>
      <div className="grid grid-cols-1 gap-1">
        <button className={btn} aria-pressed={v.uv} onClick={() => tool('uv')}>
          <span>{v.uv ? '🟣 UV light on' : '🔦 Flashlight'}</span> <kbd>F</kbd>
        </button>
        <button className={btn} disabled={!sbReady} onClick={() => tool('spiritbox')}>
          <span>📻 Spirit box{sbReady ? '' : '…'}</span> <kbd>Q</kbd>
        </button>
        <button className={btn} onClick={() => tool('book')}>
          <span>📓 {v.book ? 'Move the book here' : 'Put a book down'}</span> <kbd>B</kbd>
        </button>
        <button className={btn} onClick={() => tool('camera')}>
          <span>📹 Camera here ({s.camerasLeft} left)</span> <kbd>C</kbd>
        </button>
        <button className={btn} aria-pressed={v.hidden} onClick={() => tool('hide')}>
          <span>🚪 {v.hidden ? 'Come out' : 'Hide (in a closet)'}</span> <kbd>Space</kbd>
        </button>
      </div>
      <p className="text-xs font-bold text-ink-soft">Move with WASD or the arrow keys. Ask your Navigator where you are!</p>
    </div>
  );
}

function EmfMeter({ level }: { level: number }) {
  const colors = ['#3ddc97', '#a6e35b', '#ffc93c', '#ff9f43', '#ff4f4f'];
  return (
    <div className="flex items-end gap-1">
      {colors.map((c, i) => (
        <span key={i} className="w-5 rounded-sm border-2 border-line" style={{ height: 10 + i * 6, background: i < level ? c : '#2b2140', boxShadow: i < level && level === 5 ? `0 0 10px ${c}` : 'none' }} />
      ))}
      <span className="ml-2 font-mono text-2xl font-bold">{level}</span>
    </div>
  );
}

function NavigatorPanel({ v }: { v: NavigatorView }) {
  const { s, partner } = useRoom();
  const house = houseOf(s.house);
  const room = v.readings.room ? roomById(house, v.readings.room).name : '—';
  return (
    <div className="sticker space-y-3 p-3">
      <h3 className="font-display font-extrabold">📡 Readings · {partner?.name ?? 'Explorer'} is in the <span className="text-pink">{room}</span></h3>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase opacity-70">EMF</p>
          <EmfMeter level={v.readings.emf} />
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase opacity-70">Temperature</p>
          <p className={`font-mono text-3xl font-bold ${v.readings.temp < 0 ? 'text-sky' : ''}`}>{v.readings.temp.toFixed(1)}°C</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[0, 1].map((k) => {
          const cam = v.cameras[k];
          return (
            <div key={k} className="relative h-24 overflow-hidden rounded-xl border-[3px] border-line bg-[#0d0d12] p-1 text-xs font-bold text-[#7dff9a]">
              <span>CAM {k + 1} {cam ? `· ${roomById(house, cam.room).name}` : ''}</span>
              {!cam && <p className="mt-6 text-center text-white/40">no signal</p>}
              {cam?.orbs && (
                <>
                  <span className="absolute left-6 top-10 h-2 w-2 animate-ping rounded-full bg-white" />
                  <span className="absolute right-8 top-14 h-1.5 w-1.5 animate-ping rounded-full bg-white [animation-delay:0.5s]" />
                </>
              )}
              {cam?.motion && <span className="absolute bottom-1 right-1 animate-pulse rounded bg-[#ff4f4f] px-1 text-white">● MOTION</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Hunt() {
  const { s } = useRoom();
  const v = s.view;
  if (!v) return null;
  return (
    <main className="grid flex-1 gap-3 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-2">
        <p className="font-display font-extrabold">
          {v.role === 'explorer' ? '🔦 You are the Explorer. Your partner has the map.' : '🗺️ You are the Navigator. Guide them, read the instruments, watch the cameras.'}
        </p>
        {v.role === 'explorer' ? <ExplorerMap v={v} hunt={s.hunt} gameKey={s.results.length} /> : <NavigatorMap v={v} hunt={s.hunt} house={houseOf(s.house)} />}
      </div>
      <aside className="flex flex-col gap-3">
        <Status />
        {v.role === 'explorer' ? <ExplorerPanel v={v} /> : <NavigatorPanel v={v} />}
        <Journal />
        <Feed />
      </aside>
    </main>
  );
}

const OUTCOME = {
  escaped: { title: '🏃‍♀️ ESCAPED!', text: 'You named the ghost and got out alive.', good: true },
  wrong: { title: '🤦 WRONG GHOST', text: 'You got out… but you named the wrong ghost.', good: false },
  caught: { title: '👻 CAUGHT', text: 'The ghost got the Explorer.', good: false },
  timeout: { title: '🌅 SUNRISE', text: 'You ran out of time.', good: false },
} as const;

export function Result() {
  const { act } = useGame();
  const { s, me, partner } = useRoom();
  const reduce = useReducedMotion();
  const last = s.results[s.results.length - 1];
  if (!last) return null;
  const o = OUTCOME[last.outcome];
  const g = GHOSTS[last.ghost];
  const iAmReady = s.readyForNext.includes(me.id);
  const explorer = s.players.find((p) => p.id === last.explorerId);
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5">
      <motion.h1
        initial={reduce ? false : { scale: 2.2, opacity: 0, rotate: -6 }}
        animate={{ scale: 1, opacity: 1, rotate: -2 }}
        transition={{ type: 'spring', stiffness: 240, damping: 12 }}
        className={`sticker self-center px-8 py-4 text-center font-display text-5xl font-extrabold ${o.good ? '!bg-mint' : '!bg-[#ff4f4f] text-white'} text-[#2b2140]`}
      >
        {o.title}
      </motion.h1>
      <section className="sticker space-y-2 p-5 text-center font-semibold">
        <p>{o.text}</p>
        <p className="font-display text-2xl font-extrabold">
          It was a {g.name} 👻 in the {roomById(houseOf(last.house), last.ghostRoom).name} ({houseOf(last.house).emoji} {houseOf(last.house).name})
        </p>
        <p>
          Evidence: {g.evidence.map((e) => `${EVIDENCE[e].emoji} ${EVIDENCE[e].name}`).join(' · ')}
        </p>
        <p className="text-ink-soft">{last.guess ? `You guessed: ${GHOSTS[last.guess].name}` : 'No guess in the journal.'} · {fmt(last.ms)} inside</p>
      </section>
      <section className="sticker p-4">
        <h2 className="mb-2 font-display text-lg font-extrabold">Every haunting</h2>
        <ol className="space-y-1 font-semibold">
          {s.results.map((r) => {
            const p = s.players.find((x) => x.id === r.explorerId);
            return (
              <li key={r.n} className="flex items-center gap-2">
                {p && <Avatar id={p.id} size="text-xl" />} {OUTCOME[r.outcome].title} · {GHOSTS[r.ghost].name} · {p?.name} exploring
              </li>
            );
          })}
        </ol>
      </section>
      <button className="btn btn-mint w-full" disabled={iAmReady} onClick={() => act('round:ready')}>
        {iAmReady ? `Waiting for ${partner?.name ?? '…'}…` : 'Next house (swap roles) 🏚️'}
      </button>
      {me.isHost && <RecapActions />}
      <p className="text-center text-sm text-ink-soft">{explorer?.name} explored this one.</p>
    </main>
  );
}
