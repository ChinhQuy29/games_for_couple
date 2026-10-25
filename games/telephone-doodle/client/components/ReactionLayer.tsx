import { AnimatePresence, motion } from 'framer-motion';
import { useDoodle } from '../store';

/** Emoji that float up the screen when either player reacts. */
export default function ReactionLayer() {
  const { reactions } = useDoodle();
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      <AnimatePresence>
        {reactions.map((r) => {
          // Partner's float up the right, mine up the left, with some wiggle.
          const base = r.fromPartner ? 62 : 8;
          const left = base + ((r.key * 37) % 30);
          return (
            <motion.span
              key={r.key}
              className="absolute bottom-0 text-5xl"
              style={{ left: `${left}%` }}
              initial={{ y: 40, opacity: 0, scale: 0.6 }}
              animate={{ y: -window.innerHeight * 0.8, opacity: [0, 1, 1, 0], scale: 1.2, rotate: (r.key % 2 ? 1 : -1) * 25 }}
              transition={{ duration: 2.4, ease: 'easeOut' }}
            >
              {r.emoji}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
