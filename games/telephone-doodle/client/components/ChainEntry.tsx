import { motion, useReducedMotion } from 'framer-motion';
import type { Entry } from '../../shared';
import Avatar from './Avatar';
import ChaosSticker from './ChaosSticker';
import DrawingView from './DrawingView';

interface Props {
  entry: Entry;
  /** Stable id so drawings replay only once per device. */
  id: string;
  name: string;
  /** Animate in (used for the entry that was just revealed). */
  fresh?: boolean;
}

const LABEL = { prompt: 'started with', drawing: 'drew', guess: 'guessed' } as const;

export default function ChainEntry({ entry, id, name, fresh = false }: Props) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={fresh && !reduce ? { y: 60, opacity: 0, scale: 0.9 } : false}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className="flex flex-col gap-2"
    >
      <p className="flex items-center gap-2 font-display font-bold text-ink-soft">
        <Avatar id={entry.by} size="text-2xl" /> {name} {LABEL[entry.kind]}
        {entry.kind === 'prompt' && entry.fromDeck && ' 🎲'}
      </p>
      {entry.kind === 'drawing' ? (
        <>
          <DrawingView drawing={entry.drawing} replayId={fresh ? id : undefined} className="sticker overflow-hidden !p-0" />
          {entry.chaos && <ChaosSticker chaos={entry.chaos} small />}
        </>
      ) : (
        <div className={`sticker p-4 font-display text-2xl font-bold ${entry.kind === 'prompt' ? '!bg-sky text-on-accent' : ''}`}>
          <span className={entry.kind === 'guess' && entry.afk ? 'italic text-ink-soft' : ''}>“{entry.text}”</span>
        </div>
      )}
    </motion.div>
  );
}
