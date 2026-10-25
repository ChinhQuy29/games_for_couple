import { REACTIONS, type PublicSentence, type Rating } from '../../shared';
import { useFms, useRoom } from '../store';
import RoundHeader from '../components/RoundHeader';
import SentenceCard from '../components/SentenceCard';
import WaitingBlob from '../components/WaitingBlob';

const COPY = {
  title: 'The Big Reveal 🥁',
  revealMine: 'Reveal yours 🥁',
  waitReveal: (name: string) => `${name} is about to reveal…`,
  rate: 'How hard did you laugh?',
  next: 'Next round ▶',
  finish: 'See the recap 🏆',
  waitNext: (name: string) => `Waiting for ${name}…`,
};

export default function Reveal() {
  const { act } = useFms();
  const { s, me, partner } = useRoom();
  const current = s.sentences.filter((x) => x.round === s.round);
  const revealed = current.filter((x) => x.revealed);
  const next = current.find((x) => !x.revealed);
  const nameOf = (id: string) => s.players.find((p) => p.id === id)?.name ?? '???';
  const allRevealed = !next;
  const iAmReady = s.readyForNext.includes(me.id);
  const isLast = s.round >= s.settings.rounds;

  // The starter's author reveals; if they dropped off, the partner can.
  const nextAuthor = next ? s.players.find((p) => p.id === next.starterAuthorId) : undefined;
  const canReveal = next && (next.starterAuthorId === me.id || !nextAuthor?.connected);

  return (
    <main className="flex flex-1 flex-col gap-6">
      <RoundHeader title={COPY.title} />

      {revealed.map((sentence) => (
        <div key={sentence.id} className="flex flex-col gap-3">
          <SentenceCard
            sentence={sentence}
            authorName={nameOf(sentence.starterAuthorId)}
            finisherName={nameOf(sentence.finisherId)}
            mode={s.settings.mode}
            dramatic
          />
          <ReactBar sentence={sentence} />
        </div>
      ))}

      {next &&
        (canReveal ? (
          <button className="btn btn-pink wobble self-center !px-10 !text-2xl" onClick={() => act('reveal:next')}>
            {COPY.revealMine}
          </button>
        ) : (
          <WaitingBlob label={COPY.waitReveal(nameOf(next.starterAuthorId))} sub="Prepare your face 😬" />
        ))}

      {allRevealed && (
        <div className="action-bar mt-auto">
          <button className="btn btn-mint w-full" disabled={iAmReady} onClick={() => act('round:ready')}>
            {iAmReady ? COPY.waitNext(partner?.name ?? 'your partner') : isLast ? COPY.finish : COPY.next}
          </button>
        </div>
      )}
    </main>
  );
}

function ReactBar({ sentence }: { sentence: PublicSentence }) {
  const { act } = useFms();
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            className="chip !min-h-12 !px-3 text-2xl transition-transform active:scale-125"
            onClick={() => act('reaction:send', { sentenceId: sentence.id, emoji })}
            aria-label={`React ${emoji}`}
          >
            {emoji}
            {sentence.reactions[emoji] > 0 && (
              <span className="ml-1 align-middle text-sm font-bold">{sentence.reactions[emoji]}</span>
            )}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <span className="mr-1 text-sm font-bold text-ink-soft">{COPY.rate}</span>
        {([1, 2, 3, 4, 5] as Rating[]).map((v) => (
          <button
            key={v}
            className={`text-2xl transition-transform hover:scale-125 ${sentence.myRating && v <= sentence.myRating ? '' : 'opacity-25 grayscale'}`}
            onClick={() => act('rating:submit', { sentenceId: sentence.id, value: v })}
            aria-label={`${v} out of 5`}
          >
            😂
          </button>
        ))}
      </div>
    </div>
  );
}
