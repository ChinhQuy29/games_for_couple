import { GAMES } from '@gfc/shared';
import GameCard from './GameCard';

export default function PortalHome() {
  const playable = GAMES.filter((g) => g.status === 'playable');
  const soon = GAMES.filter((g) => g.status === 'coming-soon');

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16 pt-10">
      <header className="mb-10 text-center">
        <div className="wobble mb-2 inline-block text-6xl" aria-hidden>
          💞
        </div>
        <h1 className="font-display text-5xl font-extrabold leading-none sm:text-6xl">
          Games for <span className="text-pink">Two</span>
        </h1>
        <p className="mt-3 text-lg font-semibold text-ink-soft">
          Silly little games for when you're far apart but still want to laugh together.
        </p>
        <p className="mt-1 text-sm text-ink-soft">Best played on a call 📞 — each of you on your own screen.</p>
      </header>

      <section aria-label="Games you can play">
        <div className={playable.length === 1 ? 'mx-auto max-w-md' : 'grid gap-6 sm:grid-cols-2'}>
          {playable.map((g, i) => (
            <GameCard key={g.id} game={g} tilt={i % 2 ? 1.5 : -1.5} />
          ))}
        </div>
      </section>

      {soon.length > 0 && (
        <section className="mt-12" aria-label="Coming soon">
          <h2 className="mb-4 font-display text-2xl font-extrabold">Coming soon™</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {soon.map((g, i) => (
              <GameCard key={g.id} game={g} tilt={i % 2 ? -1 : 1} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
