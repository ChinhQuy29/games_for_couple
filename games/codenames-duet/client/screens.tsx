import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LANGUAGES, TURN_OPTIONS, type Mark, type PublicCard } from '../shared';
import { kit } from './kit';

const { useGame, useRoom, LobbyShell, Choice, RecapActions, FirstChoice } = kit;

export function Lobby() {
  const { act } = useGame();
  const { s } = useRoom();
  return (
    <LobbyShell
      startLabel="Deal the cards 🕵️"
      howTo={
        <>
          <h2 className="font-display text-xl font-extrabold">How it works</h2>
          <p>🃏 25 words. You each see a secret key: <b>green</b> cards are your agents, <b>black ☠</b> are assassins. Your partner's key is different.</p>
          <p>🗣️ Take turns: one gives a <b>one-word clue + a number</b> ("ocean 2"), the other taps cards. Cards are read with the <b>clue giver's</b> key.</p>
          <p>✅ An agent: keep going. 😐 A bystander: the turn ends. ☠ An assassin: you both lose.</p>
          <p>🎯 Find all 15 agents before the turns run out.</p>
        </>
      }
      settings={
        <>
          <FirstChoice label="🗣️ Who gives the first clue?" />
          <Choice label="Words" value={s.lang} options={['en', 'vi'] as const} onPick={(lang) => act('settings:update', { lang })} render={(l) => LANGUAGES[l].label} />
          <Choice
            label="Turns"
            value={s.turns}
            options={TURN_OPTIONS}
            onPick={(turns) => act('settings:update', { turns })}
            render={(t) => (t === 11 ? '😌 11 (easy)' : t === 9 ? '🙂 9 (normal)' : '😈 7 (hard)')}
          />
        </>
      }
    />
  );
}

const MARK_STYLE: Record<Mark, { bar: string; label: string }> = {
  agent: { bar: '#3ddc97', label: 'agent' },
  bystander: { bar: '#e8dcc4', label: 'bystander' },
  assassin: { bar: '#1f1b2e', label: 'assassin' },
};

function Card({ c, onClick, clickable }: { c: PublicCard; onClick: () => void; clickable: boolean }) {
  const mine = MARK_STYLE[c.mine];
  return (
    <button
      onClick={onClick}
      disabled={!clickable}
      aria-label={`${c.word}, ${c.found ? 'found agent' : `${mine.label} on your key`}`}
      className={`relative flex h-20 items-center justify-center overflow-hidden rounded-xl border-[3px] border-line px-2 text-center font-display font-extrabold uppercase leading-tight shadow-[0_4px_0_var(--line)] transition-transform ${
        c.found ? 'bg-mint text-[#2b2140]' : c.mine === 'agent' ? 'bg-[#e3f7ec] text-[#2b2140]' : c.mine === 'assassin' ? 'bg-[#dcd6e6] text-[#2b2140]' : 'bg-[#fff8e7] text-[#2b2140]'
      } ${clickable ? 'hover:-translate-y-0.5 hover:bg-yellow' : ''}`}
    >
      {/* My key: a stripe on the left. Their key (after the game): a stripe on the right. */}
      <span className="absolute inset-y-0 left-0 w-3" style={{ background: mine.bar }} />
      {c.mine === 'assassin' && <span className="absolute left-4 top-1 text-sm">☠</span>}
      {c.theirs && <span className="absolute inset-y-0 right-0 w-3" style={{ background: MARK_STYLE[c.theirs].bar }} />}
      <span className={c.found ? 'text-base' : 'text-sm sm:text-base'}>{c.found ? `🕵️ ${c.word}` : c.word}</span>
      <span className="absolute bottom-0.5 right-4 flex gap-0.5 text-xs">
        {c.bystanderMine && <span title="A bystander on your key">😐</span>}
        {c.bystanderTheirs && <span title="A bystander on your partner's key">🙂</span>}
      </span>
    </button>
  );
}

function ClueBox() {
  const { act } = useGame();
  const { s, partner } = useRoom();
  const [word, setWord] = useState('');
  const [count, setCount] = useState(1);
  const iGive = s.giver === s.mySeat;
  if (!s.clue) {
    return iGive ? (
      <form
        className="sticker flex flex-wrap items-center gap-2 p-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await act('clue', { word, count });
          if (res.ok) setWord('');
        }}
      >
        <span className="font-display font-extrabold">🗣️ Your clue:</span>
        <input className="w-48 rounded-xl border-[3px] border-line bg-white px-3 py-2 font-bold text-[#2b2140]" value={word} onChange={(e) => setWord(e.target.value)} placeholder="one word" maxLength={30} aria-label="Clue word" />
        <select className="rounded-xl border-[3px] border-line bg-white px-2 py-2 font-bold text-[#2b2140]" value={count} onChange={(e) => setCount(Number(e.target.value))} aria-label="How many cards">
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        <button className="btn btn-pink" disabled={!word.trim()}>Give clue</button>
        <span className="text-sm font-bold text-ink-soft">Point {partner?.name} at your green cards.</span>
      </form>
    ) : (
      <div className="sticker p-3 font-display font-extrabold">⏳ {partner?.name} is thinking of a clue…</div>
    );
  }
  return (
    <div className="sticker flex flex-wrap items-center gap-3 p-3">
      <span className="rounded-xl border-[3px] border-line bg-yellow px-4 py-1 font-display text-2xl font-extrabold uppercase text-[#2b2140]">
        {s.clue.word} · {s.clue.count}
      </span>
      {iGive ? (
        <span className="font-bold">{partner?.name} is guessing… ({s.clue.got.length} found so far). No hints with your face! 😶</span>
      ) : (
        <>
          <span className="font-bold">Tap the cards you think {partner?.name} means. ({s.clue.got.length} found)</span>
          <button className="btn btn-mint ml-auto" disabled={s.clue.got.length === 0} onClick={() => act('stop')}>
            Stop guessing ✋
          </button>
        </>
      )}
    </div>
  );
}

function Board({ interactive }: { interactive: boolean }) {
  const { act } = useGame();
  const { s } = useRoom();
  const guessing = interactive && !!s.clue && s.clue.by !== s.mySeat;
  return (
    <div className="grid grid-cols-5 gap-2">
      {s.cards.map((c, i) => (
        <Card key={i} c={c} clickable={guessing && !c.found} onClick={() => void act('guess', { card: i })} />
      ))}
    </div>
  );
}

function Status() {
  const { s, partner } = useRoom();
  return (
    <div className="flex flex-wrap items-center gap-2 font-display font-extrabold">
      <span className="sticker px-3 py-1" title="Turns left">
        ⏳ {s.turnsLeft} turn{s.turnsLeft === 1 ? '' : 's'}
      </span>
      <span className="sticker px-3 py-1">🕵️ {s.agentsLeft}/15 agents to find</span>
      <span className="text-sm text-ink-soft">
        Your key: {s.myAgentsLeft} left · {partner?.name}'s: {s.theirAgentsLeft} left
      </span>
      <span className="ml-auto text-sm text-ink-soft">
        🏆 {s.record.wins}/{s.record.games} won
      </span>
    </div>
  );
}

function Log() {
  const { s } = useRoom();
  if (!s.log.length) return null;
  return (
    <div className="sticker max-h-36 overflow-y-auto p-3 text-sm font-semibold">
      {[...s.log].reverse().map((l, i) => (
        <p key={i}>
          <b>{s.players[l.by]?.name}:</b> “{l.word} {l.count}” → {l.got.length ? l.got.join(', ') : 'nothing'}{' '}
          {l.ended === 'bystander' ? '😐' : l.ended === 'assassin' ? '☠' : l.ended === 'won' ? '🏆' : '✋'}
        </p>
      ))}
    </div>
  );
}

export function Play() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3">
      <Status />
      <ClueBox />
      <Board interactive />
      <p className="text-xs font-bold text-ink-soft">The stripe on the left of each card is YOUR key: 🟩 agent · ⬛ ☠ assassin · beige bystander. 😐 = known bystander on your key, 🙂 = on your partner's.</p>
      <Log />
    </main>
  );
}

export function Over() {
  const { act } = useGame();
  const { s, me, partner } = useRoom();
  const reduce = useReducedMotion();
  const o = s.outcome!;
  const iAmReady = s.readyForNext.includes(me.id);
  const title = o.won ? '🎉 All 15 agents found!' : o.why === 'assassin' ? '☠ The assassin got you' : '⌛ Out of turns';
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3">
      <motion.h1
        initial={reduce ? false : { scale: 1.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`sticker self-center px-8 py-3 text-center font-display text-3xl font-extrabold ${o.won ? '!bg-mint' : '!bg-[#ff4f4f] text-white'} text-[#2b2140]`}
      >
        {title}
      </motion.h1>
      {o.why === 'assassin' && o.card !== undefined && <p className="text-center font-bold">It was “{s.cards[o.card]?.word}” on {s.players[o.assassinBy ?? 0]?.name}'s key.</p>}
      <p className="text-center text-sm font-bold text-ink-soft">Both keys revealed: your key on the left of each card, {partner?.name}'s on the right.</p>
      <Board interactive={false} />
      <div className="flex gap-2">
        <button className="btn btn-mint flex-1" disabled={iAmReady} onClick={() => act('round:ready')}>
          {iAmReady ? `Waiting for ${partner?.name ?? '…'}…` : 'New board 🔁'}
        </button>
      </div>
      {me.isHost && <RecapActions />}
      <Log />
    </main>
  );
}
