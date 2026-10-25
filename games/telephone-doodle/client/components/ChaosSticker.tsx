import { motion, useReducedMotion } from 'framer-motion';
import { CHAOS_RULES, type ChaosId } from '../../shared';

export default function ChaosSticker({ chaos, small = false }: { chaos: ChaosId; small?: boolean }) {
  const reduce = useReducedMotion();
  const rule = CHAOS_RULES[chaos];
  return (
    <motion.div
      initial={reduce || small ? false : { scale: 2.2, rotate: -14, opacity: 0 }}
      animate={{ scale: 1, rotate: -3, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 14 }}
      className={`sticker inline-flex items-center gap-2 self-center !bg-yellow font-display font-extrabold text-on-accent ${small ? 'px-3 py-1 text-sm' : 'px-4 py-2 text-lg'}`}
    >
      <span className={small ? 'text-base' : 'text-2xl'}>{rule.emoji}</span>
      {rule.text}
    </motion.div>
  );
}
