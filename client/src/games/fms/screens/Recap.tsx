import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { PublicSentence } from '@gfc/shared';
import { useFms, useRoom } from '../store';
import SentenceCard from '../components/SentenceCard';

interface Award {
  emoji: string;
  title: string;
  sentence: PublicSentence;
}

const sumReactions = (s: PublicSentence) => Object.values(s.reactions).reduce((a, b) => a + b, 0);

function best(list: PublicSentence[], score: (s: PublicSentence) => number): PublicSentence | null {
  let top: PublicSentence | null = null;
  let topScore = 0;
  for (const s of list) {
    const v = score(s);
    if (v > topScore || (v === topScore && v > 0 && Math.random() < 0.5)) {
      top = s;
      topScore = v;
    }
  }
  return top;
}

function computeAwards(list: PublicSentence[]): Award[] {
  const awards: Award[] = [];
  const line = best(list, (s) => s.ratingTotal ?? 0);
  if (line) awards.push({ emoji: '🏆', title: 'Line of the Night', sentence: line });
  const unhinged = best(list, sumReactions);
  if (unhinged) awards.push({ emoji: '🤡', title: 'Most Unhinged', sentence: unhinged });
  const romantic = best(list, (s) => s.reactions['❤️']);
  if (romantic) awards.push({ emoji: '💘', title: 'Accidentally Romantic', sentence: romantic });
  return awards;
}

export default function Recap() {
  const { act, leave } = useFms();
  const { s } = useRoom();
  const navigate = useNavigate();
  const nameOf = (id: string) => s.players.find((p) => p.id === id)?.name ?? '???';
  const awards = useMemo(() => computeAwards(s.sentences), [s.sentences]);

  return (
    <main className="flex flex-1 flex-col gap-6">
      <header className="text-center">
        <div className="wobble inline-block text-6xl">🎉</div>
        <h1 className="font-display text-4xl font-extrabold">That's a wrap!</h1>
        <p className="font-semibold text-ink-soft">{s.sentences.length} sentences of pure nonsense.</p>
      </header>

      {awards.map((a, i) => (
        <motion.section
          key={a.title}
          initial={{ x: i % 2 ? 80 : -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 + i * 0.5, type: 'spring' }}
          className="flex flex-col gap-2"
        >
          <h2 className="text-center font-display text-2xl font-extrabold">
            {a.emoji} {a.title}
          </h2>
          <SentenceCard
            sentence={a.sentence}
            authorName={nameOf(a.sentence.starterAuthorId)}
            finisherName={nameOf(a.sentence.finisherId)}
            mode={s.settings.mode}
          />
        </motion.section>
      ))}

      <section className="flex flex-col gap-5">
        <h2 className="font-display text-2xl font-extrabold">All the sentences</h2>
        {s.sentences.map((sentence) => (
          <SentenceCard
            key={sentence.id}
            sentence={sentence}
            authorName={nameOf(sentence.starterAuthorId)}
            finisherName={nameOf(sentence.finisherId)}
            mode={s.settings.mode}
          />
        ))}
      </section>

      <div className="action-bar flex gap-3">
        <button
          className="btn btn-ghost"
          onClick={async () => {
            await leave();
            navigate('/fms');
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
