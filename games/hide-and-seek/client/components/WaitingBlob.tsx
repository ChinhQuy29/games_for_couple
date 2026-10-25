import { motion, useReducedMotion } from 'framer-motion';

/** A bouncing, blinking blob for "waiting for your partner" moments. */
export default function WaitingBlob({ label, sub }: { label: string; sub?: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <motion.svg
        width="110"
        height="100"
        viewBox="0 0 110 100"
        animate={reduce ? undefined : { y: [0, -18, 0], scaleX: [1, 0.92, 1.08, 1], scaleY: [1, 1.08, 0.9, 1] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      >
        <path
          d="M55 8c26 0 47 18 47 46 0 26-20 40-47 40S8 80 8 54C8 26 29 8 55 8z"
          fill="var(--pink)"
          stroke="var(--line)"
          strokeWidth="4"
        />
        <g className="blink">
          <ellipse cx="40" cy="48" rx="6" ry="9" fill="var(--line)" />
          <ellipse cx="70" cy="48" rx="6" ry="9" fill="var(--line)" />
        </g>
        <path d="M44 68q11 9 22 0" stroke="var(--line)" strokeWidth="4" fill="none" strokeLinecap="round" />
        <ellipse cx="30" cy="62" rx="7" ry="4" fill="#fff" opacity="0.5" />
        <ellipse cx="80" cy="62" rx="7" ry="4" fill="#fff" opacity="0.5" />
      </motion.svg>
      <p className="font-display text-2xl font-extrabold">{label}</p>
      {sub && <p className="font-semibold opacity-80">{sub}</p>}
    </div>
  );
}
