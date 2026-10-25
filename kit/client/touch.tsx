/// <reference types="vite/client" />
// On-screen buttons for phones and tablets. Each button is held while a finger is on it;
// several can be held at once (run and jump). Shown only on touch screens (or with ?touch).

import { useEffect, useRef, useState } from 'react';
import arrow from './assets/touch/icon_arrow.png';
import jump from './assets/touch/icon_jump.png';
import hand from './assets/touch/icon_hand.png';
import pedal from './assets/touch/icon_pedal.png';
import brake from './assets/touch/icon_pedal_brake.png';
import fire from './assets/touch/icon_fire.png';
import buttonA from './assets/touch/icon_button_a.png';
import buttonB from './assets/touch/icon_button_b.png';

export type TouchIcon = 'left' | 'right' | 'up' | 'down' | 'jump' | 'grab' | 'gas' | 'brake' | 'throw' | 'a' | 'b';

const ICONS: Record<TouchIcon, { src: string; rot: number }> = {
  right: { src: arrow, rot: 0 },
  down: { src: arrow, rot: 90 },
  left: { src: arrow, rot: 180 },
  up: { src: arrow, rot: 270 },
  jump: { src: jump, rot: 0 },
  grab: { src: hand, rot: 0 },
  gas: { src: pedal, rot: 0 },
  brake: { src: brake, rot: 0 },
  throw: { src: fire, rot: 0 },
  a: { src: buttonA, rot: 0 },
  b: { src: buttonB, rot: 0 },
};

export interface TouchButton {
  /** The input name this button holds, e.g. 'left' or 'jump'. */
  id: string;
  icon: TouchIcon;
  side: 'left' | 'right';
  label?: string;
}

/** True on phones and tablets (a coarse pointer), or when the URL has ?touch. */
export function useIsTouch(): boolean {
  const [touch, setTouch] = useState(() => typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || new URLSearchParams(window.location.search).has('touch')));
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const on = () => setTouch(mq.matches || new URLSearchParams(window.location.search).has('touch'));
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return touch;
}

/**
 * Two clusters of round buttons: over the bottom corners of its (relative) parent in landscape,
 * or in a row below it in portrait.
 * `onChange` gets the full held map whenever a button goes down or up.
 */
export function TouchControls({ buttons, onChange }: { buttons: TouchButton[]; onChange: (held: Record<string, boolean>) => void }) {
  const touch = useIsTouch();
  const held = useRef<Record<string, boolean>>({});
  const [, redraw] = useState(0);
  const cb = useRef(onChange);
  cb.current = onChange;
  if (!touch) return null;

  const set = (id: string, v: boolean) => {
    if (!!held.current[id] === v) return;
    held.current = { ...held.current, [id]: v };
    cb.current(held.current);
    redraw((n) => n + 1);
  };
  const cluster = (side: 'left' | 'right') => (
    <div className={`pointer-events-auto absolute bottom-3 flex gap-3 portrait:static ${side === 'left' ? 'left-3' : 'right-3'}`}>
      {buttons
        .filter((b) => b.side === side)
        .map((b) => (
          <button
            key={b.id}
            aria-label={b.label ?? b.id}
            className={`flex h-16 w-16 touch-none select-none items-center justify-center rounded-full border-[3px] border-white/70 shadow-lg transition-transform sm:h-20 sm:w-20 ${
              held.current[b.id] ? 'scale-95 bg-pink/80' : 'bg-[#2b2140]/60'
            }`}
            onPointerDown={(e) => {
              e.preventDefault();
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                // Capture is a nicety (keeps the button held if the finger slides); never let it block the press.
              }
              set(b.id, true);
            }}
            onPointerUp={() => set(b.id, false)}
            onPointerCancel={() => set(b.id, false)}
            onLostPointerCapture={() => set(b.id, false)}
            onContextMenu={(e) => e.preventDefault()}
          >
            <img src={ICONS[b.icon].src} alt="" draggable={false} className="h-9 w-9" style={{ transform: `rotate(${ICONS[b.icon].rot}deg)` }} />
          </button>
        ))}
    </div>
  );
  return (
    // Landscape: over the bottom corners of the game. Portrait: a row underneath it.
    <div className="pointer-events-none absolute inset-0 z-30 portrait:pointer-events-auto portrait:static portrait:mt-4 portrait:flex portrait:justify-between">
      {cluster('left')}
      {cluster('right')}
    </div>
  );
}
