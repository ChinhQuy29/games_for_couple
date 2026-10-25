import { motion, useReducedMotion } from 'framer-motion';
import type { Modifier } from '../../shared';

export default function ModifierSticker({ modifier, passed }: { modifier: Modifier; passed?: boolean | null }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { scale: 2.2, rotate: -14, opacity: 0 }}
      animate={{ scale: 1, rotate: -3, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 14 }}
      className="sticker inline-flex items-center gap-2 self-center !bg-yellow px-4 py-2 font-display text-lg font-extrabold text-on-accent"
    >
      <span className="text-2xl">{modifier.emoji}</span>
      {modifier.text}
      {passed === true && <span title="Nailed it">✅</span>}
      {passed === false && <span title="Did not follow the rule">❌</span>}
    </motion.div>
  );
}
