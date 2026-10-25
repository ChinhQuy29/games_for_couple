import { motion, useReducedMotion } from 'framer-motion';
import { CATEGORIES, type PublicTurn } from '../../shared';
import { useRoom } from '../store';
import { useCopy, useT } from '../lib/i18n';

const COPY = {
  vi: { q: (i: number, n: number) => `Câu ${i}/${n}`, finale: '👻 SGP SPECIAL · ×2 ĐIỂM' },
  en: { q: (i: number, n: number) => `Question ${i}/${n}`, finale: '👻 SGP SPECIAL · DOUBLE POINTS' },
};

export default function QuestionHeader({ turn }: { turn: PublicTurn }) {
  const { s } = useRoom();
  const c = useCopy(COPY);
  const tr = useT();
  const reduce = useReducedMotion();
  const cat = CATEGORIES.find((x) => x.id === turn.question.category);
  return (
    <header className="flex flex-col items-center gap-2 text-center">
      {turn.finale && (
        <motion.p
          initial={reduce ? false : { scale: 2, rotate: -8, opacity: 0 }}
          animate={{ scale: 1, rotate: -2, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 12 }}
          className="sticker !bg-ink px-4 py-1 font-display text-lg font-extrabold text-bg"
        >
          {c.finale}
        </motion.p>
      )}
      <p className="font-display font-bold text-ink-soft">
        {c.q(turn.index, s.total)} · {cat ? tr(cat.label) : ''} · {'🔥'.repeat(turn.question.difficulty)}
      </p>
    </header>
  );
}
