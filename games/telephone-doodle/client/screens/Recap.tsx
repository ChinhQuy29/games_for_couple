import { useNavigate } from 'react-router-dom';
import type { PublicChain } from '../../shared';
import { useDoodle, useRoom } from '../store';
import ChainEntry from '../components/ChainEntry';

const COPY = {
  title: 'The Gallery 🖼️',
  sub: (n: number) => `${n} chains of beautiful miscommunication.`,
  chain: (name: string, round: number) => `${name}'s chain · round ${round}`,
  drift: 'Most lost in translation',
};

const reactionsOf = (c: PublicChain) => Object.values(c.reactions).reduce((a, b) => a + b, 0);

export default function Recap() {
  const { act, leave } = useDoodle();
  const { s } = useRoom();
  const navigate = useNavigate();
  const nameOf = (id: string) => s.players.find((p) => p.id === id)?.name ?? '???';
  const chains = [...s.chains].sort((a, b) => a.round - b.round || a.owner - b.owner);
  const favorite = chains.reduce<PublicChain | null>((best, c) => (reactionsOf(c) > (best ? reactionsOf(best) : 0) ? c : best), null);

  return (
    <main className="flex flex-1 flex-col gap-8">
      <header className="text-center">
        <div className="wobble inline-block text-6xl">🎨</div>
        <h1 className="font-display text-4xl font-extrabold">{COPY.title}</h1>
        <p className="font-semibold text-ink-soft">{COPY.sub(chains.length)}</p>
      </header>

      {chains.map((chain) => (
        <section key={chain.id} className="flex flex-col gap-4">
          <h2 className="font-display text-2xl font-extrabold">
            {chain === favorite && '🏆 '}
            {COPY.chain(s.players[chain.owner]?.name ?? '???', chain.round)}
          </h2>
          {chain === favorite && <p className="-mt-3 font-bold text-ink-soft">{COPY.drift}</p>}
          {chain.entries.map((entry, i) => (
            <ChainEntry key={i} id={`${chain.id}-${i}`} entry={entry} name={nameOf(entry.by)} />
          ))}
        </section>
      ))}

      <div className="action-bar flex gap-3">
        <button
          className="btn btn-ghost"
          onClick={async () => {
            await leave();
            navigate('/doodle');
          }}
        >
          🏠 Leave
        </button>
        <button className="btn btn-pink flex-1" onClick={() => act('game:rematch')}>
          🔁 Rematch
        </button>
      </div>
    </main>
  );
}
