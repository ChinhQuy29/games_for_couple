import { useEffect, useState } from 'react';
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import type { Mode, PublicSentence } from '@gfc/shared';
import ModifierSticker from './ModifierSticker';

// Sentences that already played their reveal on this device (survives re-renders and remounts).
const played = new Set<string>();

type Step = 'typing' | 'pause' | 'slam' | 'done';

const TYPE_MS = 35;
const PAUSE_MS = 900;

interface Props {
  sentence: PublicSentence;
  authorName: string;
  finisherName: string;
  mode: Mode;
  /** Play the dramatic reveal (only the first time this device sees it). */
  dramatic?: boolean;
}

export default function SentenceCard({ sentence, authorName, finisherName, mode, dramatic = false }: Props) {
  const reduce = useReducedMotion();
  const starter = sentence.starter ?? '';
  const shouldPlay = dramatic && !reduce && !played.has(sentence.id);
  const [step, setStep] = useState<Step>(shouldPlay ? 'typing' : 'done');
  const [typed, setTyped] = useState(shouldPlay ? 0 : starter.length);
  const shake = useAnimationControls();
  const tilt = sentence.id.endsWith('0') ? -1.5 : 1.5;

  useEffect(() => {
    if (!shouldPlay) return;
    played.add(sentence.id);
    let i = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const tick = setInterval(() => {
      i += 1;
      setTyped(i);
      if (i >= starter.length) {
        clearInterval(tick);
        setStep('pause');
        timers.push(
          setTimeout(() => {
            setStep('slam');
            void shake.start({ x: [0, -10, 9, -6, 4, 0], transition: { duration: 0.35 } });
            timers.push(setTimeout(() => setStep('done'), 700));
          }, PAUSE_MS),
        );
      }
    }, TYPE_MS);
    return () => {
      clearInterval(tick);
      timers.forEach(clearTimeout);
    };
    // Runs once per sentence id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentence.id]);

  const showEnding = step === 'slam' || step === 'done';
  const visibleStarter = starter.replace(/…$/, '').slice(0, typed);

  return (
    <motion.div animate={shake} className="flex flex-col gap-3">
      <motion.article
        initial={shouldPlay ? { y: 120, opacity: 0, rotate: tilt * 3 } : false}
        animate={{ y: 0, opacity: 1, rotate: tilt }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="sticker relative p-5"
      >
        {mode !== 'classic' && showEnding && (
          <motion.span
            initial={shouldPlay ? { scale: 3, opacity: 0, rotate: 20 } : false}
            animate={{ scale: 1, opacity: 1, rotate: 8 }}
            transition={{ delay: shouldPlay ? 0.5 : 0, type: 'spring', stiffness: 300, damping: 12 }}
            className="absolute -right-2 -top-4 rounded-lg border-[3px] border-line bg-mint px-2 font-display text-sm font-extrabold text-on-accent"
          >
            {mode === 'blind' ? 'BLIND MODE 🙈' : 'PEEK MODE 🫣'}
          </motion.span>
        )}
        <p className="font-display text-2xl font-bold leading-snug sm:text-3xl">
          {visibleStarter}
          {step === 'pause' ? (
            <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.45, repeat: Infinity }}>
              …
            </motion.span>
          ) : (
            <span className="text-ink-soft">…</span>
          )}{' '}
          {showEnding && (
            <motion.span
              initial={step === 'slam' ? { scale: 2.4, opacity: 0, display: 'inline-block' } : false}
              animate={{ scale: 1, opacity: 1, display: 'inline-block' }}
              transition={{ type: 'spring', stiffness: 420, damping: 13 }}
              className={`${sentence.endingWasAfk ? 'text-ink-soft italic' : 'text-pink'}`}
            >
              {sentence.ending}
            </motion.span>
          )}
        </p>
        <p className="mt-3 text-sm font-bold text-ink-soft">
          started by {authorName}
          {sentence.starterFromDeck && ' 🎲'} · finished by {finisherName}
        </p>
      </motion.article>
      {showEnding && sentence.modifier && (
        <div className="flex justify-center">
          <ModifierSticker modifier={sentence.modifier} passed={sentence.modifierPassed} />
        </div>
      )}
    </motion.div>
  );
}
