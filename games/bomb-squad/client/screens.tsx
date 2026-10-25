import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { DIFFICULTIES, DIFFICULTY_IDS, MAX_STRIKES, formatTimer } from '../shared';
import { kit } from './kit';
import Manual from './Manual';
import { ModulePanel } from './Modules';

const { useGame, useRoom, LobbyShell, Choice, Avatar, RecapActions } = kit;

export function Lobby() {
  const { act } = useGame();
  const { s } = useRoom();
  return (
    <LobbyShell
      startLabel="Arm the bomb 💣"
      howTo={
        <>
          <h2 className="font-display text-xl font-extrabold">How it works</h2>
          <p>💣 One of you is the <b>Defuser</b> and sees the bomb, but not the manual.</p>
          <p>📖 The other is the <b>Expert</b> and has the manual, but can't see the bomb.</p>
          <p>🗣️ Describe what you see, follow instructions, and defuse every module before the timer hits 0:00.</p>
          <p>❌ Three mistakes and it blows up. You swap roles every bomb.</p>
        </>
      }
      settings={
        <Choice
          label="Difficulty"
          value={s.difficulty}
          options={DIFFICULTY_IDS}
          onPick={(difficulty) => act('settings:update', { difficulty })}
          render={(d) => `${DIFFICULTIES[d].label} · ${DIFFICULTIES[d].modules} modules · ${DIFFICULTIES[d].seconds / 60}:00`}
        />
      }
    />
  );
}

/** M:SS ticking down from the bomb's deadline, in sync with the server clock. */
function useTimerText() {
  const { state, clockOffset } = useGame();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);
  const deadline = state?.deadline;
  return deadline ? formatTimer(deadline - (now + clockOffset)) : '0:00';
}

function StatusBar() {
  const { s, partner } = useRoom();
  const timer = useTimerText();
  const urgent = timer < '0:31' && timer.length === 4;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className={`rounded-xl border-[3px] border-line bg-[#1f1b2e] px-4 py-1 font-mono text-4xl font-bold text-[#ff4f4f] ${urgent ? 'jiggle' : ''}`}>
        {timer}
      </span>
      <span className="sticker px-3 py-1 font-display text-2xl font-extrabold" aria-label={`${s.strikes} strikes`}>
        {Array.from({ length: MAX_STRIKES }, (_, i) => (
          <span key={i} className={i < s.strikes ? 'text-[#ff4f4f]' : 'opacity-20'}>
            ✖
          </span>
        ))}
      </span>
      <span className="sticker px-3 py-1 font-display font-extrabold">
        {s.modulesSolved}/{s.modulesTotal} modules defused
      </span>
      <span className="ml-auto font-display font-bold text-ink-soft">
        {s.role === 'defuser' ? `💣 You're defusing · ${partner?.name ?? 'your partner'} has the manual` : `📖 You're the Expert · ${partner?.name ?? 'your partner'} sees the bomb`}
      </span>
    </div>
  );
}

export function Armed() {
  const { s } = useRoom();
  const { act } = useGame();
  const timer = useTimerText();
  const reduce = useReducedMotion();
  const [flash, setFlash] = useState(0);

  async function send(a: Parameters<typeof act>[1]) {
    const res = await act<{ result: 'ok' | 'strike' | 'solved' }>('bomb:act', a);
    if (res.ok && res.result === 'strike') setFlash((f) => f + 1);
  }

  return (
    <main className="flex flex-1 flex-col gap-4">
      <StatusBar />
      {flash > 0 && !reduce && (
        <motion.div key={flash} initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.6 }} className="pointer-events-none fixed inset-0 z-40 bg-[#ff4f4f]" />
      )}
      {s.role === 'defuser' && s.bomb ? (
        <section className="rounded-3xl border-[4px] border-line bg-[#585e6b] p-4 shadow-[6px_6px_0_var(--line)]">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="rounded-lg border-2 border-line bg-white px-3 py-1 font-mono text-lg font-bold text-[#2b2140]">
              SERIAL # <b>{s.bomb.serial}</b>
            </span>
            <span className="rounded-lg border-2 border-line bg-[#2b2140] px-3 py-1 font-bold text-white">
              {s.bomb.batteries === 0 ? 'no batteries' : '🔋'.repeat(s.bomb.batteries)}
              {s.bomb.batteries > 0 && <span className="ml-2 text-sm opacity-70">×{s.bomb.batteries}</span>}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {s.bomb.modules.map((m, i) => (
              <ModulePanel key={i} mod={m} index={i} send={(a) => void send(a)} timerText={timer} />
            ))}
          </div>
        </section>
      ) : (
        <Manual />
      )}
    </main>
  );
}

export function Result() {
  const { act } = useGame();
  const { s, me, partner } = useRoom();
  const reduce = useReducedMotion();
  const last = s.results[s.results.length - 1];
  const defused = last?.outcome === 'defused';
  const defuser = s.players.find((p) => p.id === last?.defuserId);
  const iAmReady = s.readyForNext.includes(me.id);
  const total = s.results.filter((r) => r.outcome === 'defused').length;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5">
      <motion.h1
        initial={reduce ? false : { scale: 2.5, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: -2 }}
        transition={{ type: 'spring', stiffness: 260, damping: 12 }}
        className={`sticker self-center px-8 py-4 text-center font-display text-5xl font-extrabold ${defused ? '!bg-mint' : '!bg-[#ff4f4f] text-white'} text-on-accent`}
      >
        {defused ? '😮‍💨 DEFUSED!' : '💥 BOOM!'}
      </motion.h1>
      {last && (
        <section className="sticker space-y-1 p-5 text-center font-semibold">
          <p>
            {defuser?.name} defused {defused ? 'it' : 'nothing'} with {last.strikes} strike{last.strikes === 1 ? '' : 's'}
            {defused ? ` and ${formatTimer(last.timeLeftMs)} to spare.` : last.cause === 'time' ? ': the timer ran out.' : ': three strikes.'}
          </p>
          <p className="text-ink-soft">
            Team record: {total} defused out of {s.results.length} bomb{s.results.length === 1 ? '' : 's'}
          </p>
        </section>
      )}
      <section className="sticker p-4">
        <h2 className="mb-2 font-display text-lg font-extrabold">Every bomb</h2>
        <ol className="space-y-1 font-semibold">
          {s.results.map((r) => {
            const p = s.players.find((x) => x.id === r.defuserId);
            return (
              <li key={r.n} className="flex items-center gap-2">
                {p && <Avatar id={p.id} size="text-xl" />} {r.outcome === 'defused' ? '✅' : '💥'} {DIFFICULTIES[r.difficulty].label} · {p?.name} defusing ·{' '}
                {r.outcome === 'defused' ? `${formatTimer(r.timeLeftMs)} left` : r.cause === 'time' ? 'out of time' : '3 strikes'}
              </li>
            );
          })}
        </ol>
      </section>
      <button className="btn btn-mint w-full" disabled={iAmReady} onClick={() => act('round:ready')}>
        {iAmReady ? `Waiting for ${partner?.name ?? '…'}…` : 'Next bomb (swap roles) 💣'}
      </button>
      {me.isHost && <RecapActions />}
    </main>
  );
}
