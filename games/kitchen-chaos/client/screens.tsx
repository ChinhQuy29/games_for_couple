import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  INGREDIENTS,
  LEVELS,
  LEVEL_IDS,
  RECIPES,
  TIMING,
  isPlate,
  starsFor,
  stoveState,
  type Order,
  type Side,
  type Station,
} from '../shared';
import { kit } from './kit';
import { HeldIcon, RecipeParts } from './Food';

const { useGame, useRoom, LobbyShell, Choice, Avatar, RecapActions } = kit;

/** Server time, refreshed often enough for smooth bars. */
function useNow(ms = 100) {
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
  return (
    <LobbyShell
      startLabel="Open the kitchen 🍳"
      howTo={
        <>
          <h2 className="font-display text-xl font-extrabold">How it works</h2>
          <p>🔪 One of you <b>preps</b>: grab ingredients from the crates and chop them.</p>
          <p>🔥 The other <b>cooks</b>: stoves, plates and the serving window.</p>
          <p>🍽️ The only way across is the <b>pass</b> in the middle. Click a station to put down or pick up; click a chopping board to chop.</p>
          <p>🧾 Serve what's on the tickets before customers walk out. Don't burn anything. You swap sides every shift.</p>
        </>
      }
      settings={
        <>
          <Choice
            label="Level"
            value={s.level}
            options={LEVEL_IDS}
            onPick={(level) => act('settings:update', { level })}
            render={(l) => `${'🍳'.repeat(l)} ${LEVELS[l].name}`}
          />
          <p className="text-sm font-semibold text-ink-soft">
            Menu: {LEVELS[s.level].recipes.map((r) => RECIPES[r].emoji).join(' ')} · 3-minute shift
          </p>
        </>
      }
    />
  );
}

function Ticket({ order, now }: { order: Order; now: number }) {
  const left = (order.expiresAt - now) / (order.expiresAt - order.placedAt);
  const r = RECIPES[order.recipe];
  const color = left > 0.5 ? 'var(--mint, #3ddc97)' : left > 0.25 ? '#ffc93c' : '#ff4f4f';
  return (
    <motion.div
      layout
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1, rotate: left < 0.2 ? [0, -2, 2, 0] : 0 }}
      exit={{ scale: 0.6, opacity: 0 }}
      transition={left < 0.2 ? { rotate: { repeat: Infinity, duration: 0.4 } } : undefined}
      className="sticker flex w-44 shrink-0 flex-col gap-1 !bg-[#fdf6e3] p-2 text-[#2b2140]"
    >
      <div className="flex items-center gap-2">
        <span className="text-3xl">{r.emoji}</span>
        <span className="font-display text-sm font-extrabold leading-tight">{r.name}</span>
      </div>
      <RecipeParts recipe={order.recipe} />
      <div className="h-2 overflow-hidden rounded-full border-2 border-[#2b2140] bg-white">
        <div className="h-full" style={{ width: `${Math.max(0, left) * 100}%`, background: color }} />
      </div>
    </motion.div>
  );
}

const KIND_ICON: Record<Station['kind'], string> = {
  crate: '',
  board: '🪵',
  pass: '',
  stove: '🍳',
  plates: '🍽️',
  counter: '',
  serve: '🛎️',
  trash: '🗑️',
};
const KIND_LABEL: Record<Station['kind'], string> = {
  crate: '',
  board: 'Chop',
  pass: 'Pass',
  stove: 'Stove',
  plates: 'Plates',
  counter: 'Counter',
  serve: 'Serve',
  trash: 'Trash',
};

function StationTile({ st, mine, now, onClick }: { st: Station; mine: boolean; now: number; onClick: () => void }) {
  const content = st.content;
  const cooking = st.kind === 'stove' && content && !isPlate(content) && !content.burnt ? stoveState(st, now) : null;
  const burntNow = cooking === 'burnt' || (content && !isPlate(content) && content.burnt);
  const cookPct = cooking === 'cooking' ? (now - st.cookStart) / TIMING.cookMs : 1;
  const burnPct = cooking === 'done' ? (now - st.cookStart - TIMING.cookMs) / TIMING.burnMs : 0;
  const label = st.kind === 'crate' ? INGREDIENTS[st.ing!].name : KIND_LABEL[st.kind];
  const bg =
    st.kind === 'crate'
      ? 'bg-[#c98b4f]'
      : st.kind === 'stove'
        ? 'bg-[#4a4f5c]'
        : st.kind === 'serve'
          ? 'bg-yellow'
          : st.kind === 'pass'
            ? 'bg-[#e8dcc4]'
            : st.kind === 'trash'
              ? 'bg-[#9aa0aa]'
              : 'bg-[#efe6d2]';
  return (
    <button
      onClick={onClick}
      disabled={!mine}
      aria-label={`${label}${content ? ', has something' : ''}`}
      className={`@container relative flex aspect-square w-full flex-col items-center justify-center rounded-2xl border-[3px] border-line ${bg} shadow-[0_4px_0_var(--line)] transition-transform ${
        mine ? 'hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none' : 'cursor-not-allowed opacity-55'
      } ${cooking === 'done' && burnPct > 0.5 ? 'jiggle' : ''}`}
    >
      {st.kind === 'crate' ? (
        <span className="-mt-[12cqw] text-[42cqw] leading-none">{INGREDIENTS[st.ing!].emoji}</span>
      ) : content ? (
        <span className="-mt-[12cqw] flex">
          <HeldIcon held={burntNow && !isPlate(content) ? { ...content, burnt: true, cooked: true } : cooking === 'done' && !isPlate(content) ? { ...content, cooked: true } : content} size="text-[38cqw]" />
        </span>
      ) : (
        <span className="-mt-[12cqw] text-[34cqw] leading-none opacity-50">{KIND_ICON[st.kind]}</span>
      )}
      <span className="absolute bottom-[4cqw] text-[12cqw] font-extrabold uppercase leading-none text-[#2b2140]/70">{label}</span>
      {st.kind === 'board' && content && !isPlate(content) && !content.chopped && (
        <span className="absolute top-1 flex gap-0.5">
          {Array.from({ length: TIMING.chopClicks }, (_, i) => (
            <span key={i} className={`h-2 w-2 rounded-full border border-line ${i < st.chops ? 'bg-pink' : 'bg-white'}`} />
          ))}
        </span>
      )}
      {cooking && cooking !== 'burnt' && (
        <span className="absolute left-2 right-2 top-1.5 h-2 overflow-hidden rounded-full border border-line bg-white">
          <span
            className="block h-full"
            style={{
              width: `${(cooking === 'cooking' ? cookPct : 1 - burnPct) * 100}%`,
              background: cooking === 'cooking' ? '#3ddc97' : burnPct > 0.5 ? '#ff4f4f' : '#ff9f43',
            }}
          />
        </span>
      )}
      {cooking === 'done' && <span className="absolute -top-3 rounded-full border-2 border-line bg-mint px-2 text-xs font-extrabold text-[#2b2140]">ready!</span>}
      {burntNow && <span className="absolute -top-3 text-2xl">💨</span>}
    </button>
  );
}

function SideLabel({ side, playerId }: { side: Side; playerId: string }) {
  const { s, me } = useRoom();
  const p = s.players.find((x) => x.id === playerId);
  const hand = s.hands[playerId] ?? null;
  return (
    <div className="mb-2 flex items-center gap-2">
      {p && <Avatar id={p.id} size="text-2xl" />}
      <span className="font-display font-extrabold">
        {side === 'prep' ? '🔪 Prep' : '🔥 Cook'} · {p?.id === me.id ? 'you' : p?.name}
      </span>
      <span className="ml-auto flex h-12 min-w-12 items-center justify-center rounded-xl border-[3px] border-dashed border-line bg-white/60 px-2" title="In hand">
        {hand ? <HeldIcon held={hand} size="text-3xl" /> : <span className="text-xs font-bold text-[#2b2140]/50">empty hands</span>}
      </span>
    </div>
  );
}

export function Shift() {
  const { act } = useGame();
  const { s } = useRoom();
  const now = useNow();
  const reduce = useReducedMotion();
  const click = (id: string) => void act('kitchen:click', { station: id });
  const by = (side: Station['side']) => s.stations.filter((st) => st.side === side);
  const mine = (st: Station) => st.side === 'both' || st.side === s.mySide;
  const countdown = s.startsAt - now;
  const left = s.endsAt - now;
  const stars = starsFor(s.level, s.coins);
  const goal = LEVELS[s.level].stars;
  const prep = by('prep');
  const cook = by('cook');

  return (
    <main className="relative flex flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-xl border-[3px] border-line bg-[#1f1b2e] px-4 py-1 font-mono text-3xl font-bold ${left < 30_000 ? 'text-[#ff4f4f]' : 'text-white'}`}>{fmt(Math.min(left, TIMING.shiftMs))}</span>
        <span className="sticker px-3 py-1 font-display text-xl font-extrabold">🪙 {s.coins}</span>
        <span className="sticker px-3 py-1 font-display text-xl font-extrabold" title={`Stars at ${goal.join(' / ')} coins`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={i < stars ? '' : 'opacity-25 grayscale'}>
              ⭐
            </span>
          ))}
          <span className="ml-2 text-sm font-bold text-ink-soft">{stars < 3 ? `next at ${goal[stars]}` : 'max!'}</span>
        </span>
        <span className="ml-auto font-display font-bold text-ink-soft">
          You {s.mySide === 'prep' ? 'prep 🔪' : 'cook 🔥'} · {LEVELS[s.level].name}
        </span>
      </div>

      <div className="flex min-h-[9.5rem] gap-3 overflow-x-auto pb-1">
        <AnimatePresence>
          {s.orders.map((o) => (
            <Ticket key={o.id} order={o} now={now} />
          ))}
        </AnimatePresence>
        {s.orders.length === 0 && <p className="self-center font-bold text-ink-soft">No orders yet… enjoy the calm 😌</p>}
      </div>

      <div className="grid grid-cols-[1fr_96px_1fr] gap-3">
        <section className={`rounded-3xl border-[3px] border-line bg-[#f6d9a9] p-3 ${s.mySide === 'prep' ? 'ring-4 ring-pink' : ''}`}>
          <SideLabel side="prep" playerId={s.sides!.prep} />
          <div className="grid grid-cols-5 gap-2">
            {prep.map((st) => (
              <StationTile key={st.id} st={st} mine={mine(st)} now={now} onClick={() => click(st.id)} />
            ))}
          </div>
        </section>
        <section className="flex flex-col items-stretch justify-center gap-2 rounded-3xl border-[3px] border-line bg-[#b98a5a] p-2">
          <p className="text-center font-display text-xs font-extrabold uppercase text-white">The pass</p>
          {by('both').map((st) => (
            <StationTile key={st.id} st={st} mine={mine(st)} now={now} onClick={() => click(st.id)} />
          ))}
        </section>
        <section className={`rounded-3xl border-[3px] border-line bg-[#cfe3f0] p-3 ${s.mySide === 'cook' ? 'ring-4 ring-pink' : ''}`}>
          <SideLabel side="cook" playerId={s.sides!.cook} />
          <div className="grid grid-cols-4 gap-2">
            {cook.map((st) => (
              <StationTile key={st.id} st={st} mine={mine(st)} now={now} onClick={() => click(st.id)} />
            ))}
          </div>
        </section>
      </div>

      <div className="pointer-events-none fixed right-4 top-20 z-30 flex flex-col items-end gap-2">
        <AnimatePresence>
          {s.feed
            .filter((f) => now - f.at < 3500)
            .map((f) => (
              <motion.div
                key={f.id}
                initial={reduce ? false : { x: 80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`sticker px-3 py-1 font-display font-extrabold ${f.good ? '!bg-mint' : '!bg-[#ff4f4f] text-white'} text-[#2b2140]`}
              >
                {f.text}
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {countdown > 0 && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <motion.span key={Math.ceil(countdown / 1000)} initial={reduce ? false : { scale: 2.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="sticker px-10 py-6 font-display text-7xl font-extrabold">
            {Math.ceil(countdown / 1000)}
          </motion.span>
        </div>
      )}
    </main>
  );
}

export function Summary() {
  const { act } = useGame();
  const { s, me, partner } = useRoom();
  const reduce = useReducedMotion();
  const last = s.results[s.results.length - 1];
  const iAmReady = s.readyForNext.includes(me.id);
  if (!last) return null;
  const verdict = ['😬 The health inspector is on their way', '🙂 Not bad, chefs!', '😋 The customers are happy!', '👑 Michelin stars incoming!'][last.stars];
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5">
      <motion.h1
        initial={reduce ? false : { scale: 2.2, opacity: 0, rotate: -6 }}
        animate={{ scale: 1, opacity: 1, rotate: -2 }}
        transition={{ type: 'spring', stiffness: 240, damping: 12 }}
        className="sticker self-center px-8 py-4 text-center font-display text-5xl font-extrabold"
      >
        {[0, 1, 2].map((i) => (
          <span key={i} className={i < last.stars ? '' : 'opacity-25 grayscale'}>
            ⭐
          </span>
        ))}
      </motion.h1>
      <section className="sticker space-y-2 p-5 text-center font-semibold">
        <p className="font-display text-2xl font-extrabold">{verdict}</p>
        <p className="text-lg">
          🪙 {last.coins} coins · 🍽️ {last.served} served · 😤 {last.expired} walked out · 🔥 {last.burnt} burnt
        </p>
      </section>
      <section className="sticker p-4">
        <h2 className="mb-2 font-display text-lg font-extrabold">Every shift</h2>
        <ol className="space-y-1 font-semibold">
          {s.results.map((r) => {
            const p = s.players.find((x) => x.id === r.sides.prep);
            const c = s.players.find((x) => x.id === r.sides.cook);
            return (
              <li key={r.n}>
                {'⭐'.repeat(r.stars) || '—'} · {LEVELS[r.level].name} · 🪙 {r.coins} · 🔪 {p?.name} / 🔥 {c?.name}
              </li>
            );
          })}
        </ol>
      </section>
      <button className="btn btn-mint w-full" disabled={iAmReady} onClick={() => act('round:ready')}>
        {iAmReady ? `Waiting for ${partner?.name ?? '…'}…` : 'Next shift (swap sides) 🔁'}
      </button>
      {me.isHost && <RecapActions />}
    </main>
  );
}
