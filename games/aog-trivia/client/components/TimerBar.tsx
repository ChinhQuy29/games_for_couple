import { useEffect, useRef, useState } from 'react';
import { useAog } from '../store';

/** Countdown bar for a writing phase. Calls onExpire once when it hits zero. */
export default function TimerBar({ total, onExpire }: { total: number | null; onExpire: () => void }) {
  const { state, clockOffset } = useAog();
  const deadline = state?.deadline ?? null;
  const [now, setNow] = useState(() => Date.now() + clockOffset);
  const fired = useRef<number | null>(null);
  const expire = useRef(onExpire);
  expire.current = onExpire;

  useEffect(() => {
    if (deadline === null) return;
    const id = setInterval(() => setNow(Date.now() + clockOffset), 200);
    return () => clearInterval(id);
  }, [deadline, clockOffset]);

  const left = deadline === null ? null : Math.max(0, deadline - now);

  useEffect(() => {
    if (left === 0 && deadline !== null && fired.current !== deadline) {
      fired.current = deadline;
      expire.current();
    }
  }, [left, deadline]);

  if (deadline === null || left === null || !total) return null;
  const secs = Math.ceil(left / 1000);
  const pct = Math.min(100, (left / (total * 1000)) * 100);
  const urgent = secs <= 10;

  return (
    <div className={`flex items-center gap-3 ${urgent ? 'jiggle' : ''}`} aria-label={`${secs} seconds left`}>
      <div className="h-5 flex-1 overflow-hidden rounded-full border-[3px] border-line bg-card">
        <div
          className={`h-full transition-[width] duration-200 ease-linear ${urgent ? 'bg-pink' : 'bg-mint'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`w-12 text-right font-display text-xl font-extrabold ${urgent ? 'text-pink' : ''}`}>{secs}s</span>
    </div>
  );
}
