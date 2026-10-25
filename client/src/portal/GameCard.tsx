import { Link } from 'react-router-dom';
import type { GameInfo } from '@gfc/shared';

const ACCENT_BG: Record<GameInfo['accent'], string> = {
  pink: 'bg-pink',
  yellow: 'bg-yellow',
  mint: 'bg-mint',
  sky: 'bg-sky',
};

export default function GameCard({ game, tilt }: { game: GameInfo; tilt: number }) {
  const playable = game.status === 'playable';

  const body = (
    <article
      className={`sticker relative h-full overflow-hidden p-0 transition-transform ${playable ? 'hover:-translate-y-1 hover:rotate-0' : 'opacity-70'}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className={`${ACCENT_BG[game.accent]} flex items-center justify-center border-b-[3px] border-line ${playable ? 'h-36' : 'h-24'}`}>
        <span className={`${playable ? 'wobble text-7xl' : 'text-5xl grayscale'}`} aria-hidden>
          {game.emoji}
        </span>
      </div>
      <div className="p-5">
        <h3 className={`font-display font-extrabold leading-tight ${playable ? 'text-2xl' : 'text-lg'}`}>{game.title}</h3>
        <p className="mt-1 font-semibold text-ink-soft">{game.tagline}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-bold text-ink-soft">👫 2 players · {game.minutes}</span>
          {playable ? (
            <span className="btn btn-pink pointer-events-none flex items-center !text-base">Play ▶</span>
          ) : (
            <span className="chip !min-h-0 !cursor-default text-sm">Soon</span>
          )}
        </div>
      </div>
    </article>
  );

  return playable ? (
    <Link to={game.path} className="block h-full focus-visible:outline-4 focus-visible:outline-pink rounded-3xl">
      {body}
    </Link>
  ) : (
    <div aria-disabled className="h-full">
      {body}
    </div>
  );
}
