import { useEffect, useRef } from 'react';
import { REACTIONS, type PublicChain } from '../../shared';
import { useDoodle, useRoom } from '../store';
import ChainEntry from '../components/ChainEntry';
import RoundHeader from '../components/RoundHeader';

const COPY = {
  title: 'The Big Reveal 🥁',
  next: 'Next ▶',
  nextChain: (name: string) => `On to ${name}'s chain ▶`,
  nextRound: 'Next round ▶',
  finish: 'See the gallery 🖼️',
  waitNext: (name: string) => `Waiting for ${name}…`,
  chainOf: (name: string) => `${name}'s chain`,
  from: 'Started as',
  to: 'Ended as',
};

export default function Reveal() {
  const { act } = useDoodle();
  const { s, me, partner } = useRoom();
  const current = s.chains.filter((c) => c.round === s.round).sort((a, b) => a.owner - b.owner);
  const nameOf = (id: string) => s.players.find((p) => p.id === id)?.name ?? '???';
  const showing = current[s.revealChain];
  const chainDone = !!showing && showing.entries.length >= showing.total;
  const allDone = chainDone && s.revealChain === current.length - 1;
  const iAmReady = s.readyForNext.includes(me.id);
  const isLast = s.round >= s.settings.rounds;
  const bottom = useRef<HTMLDivElement>(null);

  // Keep the newest entry in view as the chain grows.
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [s.revealChain, s.revealCount]);

  const nextOwner = current[s.revealChain + 1] ? s.players[current[s.revealChain + 1]!.owner] : undefined;

  return (
    <main className="flex flex-1 flex-col gap-6">
      <RoundHeader title={COPY.title} />

      {current
        .filter((c) => c.entries.length > 0)
        .map((chain) => (
          <ChainColumn
            key={chain.id}
            chain={chain}
            ownerName={s.players[chain.owner]?.name ?? '???'}
            nameOf={nameOf}
            live={chain === showing}
          />
        ))}
      <div ref={bottom} />

      <div className="action-bar mt-auto">
        {!allDone ? (
          <button className="btn btn-pink w-full" onClick={() => act('reveal:next')}>
            {chainDone && nextOwner ? COPY.nextChain(nextOwner.name) : COPY.next}
          </button>
        ) : (
          <button className="btn btn-mint w-full" disabled={iAmReady} onClick={() => act('round:ready')}>
            {iAmReady ? COPY.waitNext(partner?.name ?? 'your partner') : isLast ? COPY.finish : COPY.nextRound}
          </button>
        )}
      </div>
    </main>
  );
}

function ChainColumn({
  chain,
  ownerName,
  nameOf,
  live,
}: {
  chain: PublicChain;
  ownerName: string;
  nameOf: (id: string) => string;
  live: boolean;
}) {
  const { act } = useDoodle();
  const done = chain.entries.length >= chain.total;
  const first = chain.entries[0];
  const last = chain.entries[chain.entries.length - 1];

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-2xl font-extrabold">{COPY.chainOf(ownerName)}</h2>
      {chain.entries.map((entry, i) => (
        <ChainEntry
          key={i}
          id={`${chain.id}-${i}`}
          entry={entry}
          name={nameOf(entry.by)}
          fresh={live && i === chain.entries.length - 1 && i > 0}
        />
      ))}
      {done && first?.kind === 'prompt' && last?.kind === 'guess' && (
        <div className="sticker rotate-1 !bg-yellow p-4 text-center font-display text-on-accent">
          <p className="text-sm font-bold">{COPY.from}</p>
          <p className="text-xl font-extrabold">“{first.text}”</p>
          <p className="my-1 text-2xl">⬇️</p>
          <p className="text-sm font-bold">{COPY.to}</p>
          <p className="text-xl font-extrabold">“{last.text}”</p>
        </div>
      )}
      {done && (
        <div className="flex justify-center gap-2">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              className="chip !min-h-12 !px-3 text-2xl transition-transform active:scale-125"
              onClick={() => act('reaction:send', { chainId: chain.id, emoji })}
              aria-label={`React ${emoji}`}
            >
              {emoji}
              {chain.reactions[emoji] > 0 && <span className="ml-1 align-middle text-sm font-bold">{chain.reactions[emoji]}</span>}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
