import { motion, useReducedMotion } from 'framer-motion';
import type { Choice, PublicPlayer, Question } from '../../shared';
import Avatar from './Avatar';

interface Props {
  question: Question;
  /** Highlights this side (your pick while answering). */
  selected?: Choice | null;
  onPick?: (c: Choice) => void;
  /** Who picked each side, shown as avatars under it. */
  voters?: Record<Choice, PublicPlayer[]>;
  disabled?: boolean;
}

const STYLE: Record<Choice, string> = { a: '!bg-pink text-white', b: '!bg-sky text-on-accent' };

/** The two options of a question, stacked with a big "OR" between them. */
export default function Options({ question, selected = null, onPick, voters, disabled }: Props) {
  const reduce = useReducedMotion();
  const side = (c: Choice) => {
    const isSelected = selected === c;
    const dimmed = selected !== null && !isSelected;
    const content = (
      <>
        <span className="font-display text-sm font-extrabold uppercase opacity-80">{c === 'a' ? 'Option A' : 'Option B'}</span>
        <span className="font-display text-2xl font-extrabold leading-tight">{question[c]}</span>
        {voters && voters[c].length > 0 && (
          <span className="mt-2 flex gap-2">
            {voters[c].map((p) => (
              <motion.span
                key={p.id}
                initial={reduce ? false : { scale: 0, rotate: -40 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 12, delay: 0.2 }}
                className="flex items-center gap-1 rounded-full border-[3px] border-line bg-card px-2 py-0.5 text-base font-bold text-ink"
              >
                <Avatar id={p.id} size="text-xl" /> {p.name}
              </motion.span>
            ))}
          </span>
        )}
      </>
    );
    const cls = `sticker flex w-full flex-col items-center gap-1 p-5 text-center transition-transform ${STYLE[c]} ${
      isSelected ? 'scale-[1.03] ring-4 ring-yellow' : ''
    } ${dimmed ? 'opacity-50' : ''} ${c === 'a' ? '-rotate-1' : 'rotate-1'}`;
    return onPick ? (
      <button type="button" className={`${cls} active:scale-95`} onClick={() => onPick(c)} disabled={disabled} aria-pressed={isSelected}>
        {content}
      </button>
    ) : (
      <div className={cls}>{content}</div>
    );
  };

  return (
    <div className="flex flex-col items-stretch gap-2">
      {side('a')}
      <span className="wobble self-center font-display text-3xl font-extrabold text-ink-soft" aria-hidden>
        OR
      </span>
      {side('b')}
    </div>
  );
}
