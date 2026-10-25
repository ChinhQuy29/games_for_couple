import { useCallback, useEffect, useRef } from 'react';
import { getSocket } from '../socket';

/** Tells the partner "💭 typing…" without ever sending the text. */
export function useTyping() {
  const last = useRef(0);
  const stopTimer = useRef<ReturnType<typeof setTimeout>>();

  const stop = useCallback(() => {
    clearTimeout(stopTimer.current);
    if (last.current) getSocket().emit('typing', { typing: false });
    last.current = 0;
  }, []);

  const ping = useCallback(() => {
    const now = Date.now();
    if (now - last.current > 1000) {
      getSocket().emit('typing', { typing: true });
      last.current = now;
    }
    clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(stop, 2500);
  }, [stop]);

  useEffect(() => stop, [stop]);
  return { ping, stop };
}
