import { useEffect, useState } from 'react';
import { COLORS, SYMBOLS, WALL, type Act, type Card, type Color, type Dir } from '../shared';

// One component per puzzle side. "clue" cards are things to describe; "actor" cards have controls.

export type Send = (a: Act) => void;

const COLOR_HEX: Record<Color, string> = { red: '#ff4f4f', blue: '#3b82f6', green: '#3ddc97', yellow: '#ffc93c' };
const panel = 'rounded-2xl border-[3px] border-line p-5';

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-bold opacity-75">{children}</p>;
}

export function CardView({ card, send }: { card: Card; send: Send }) {
  switch (card.kind) {
    case 'dial':
      return card.role === 'clue' ? (
        <div className={`${panel} bg-[#e8dcc4] text-[#2b2140]`}>
          <Hint>🖼️ A faded mural on your wall. Four symbols, left to right:</Hint>
          <div className="mt-3 flex justify-center gap-4">
            {card.mural.map((s, i) => (
              <span key={i} className="flex h-20 w-20 items-center justify-center rounded-xl border-[3px] border-[#2b2140] bg-[#fff8e7] text-5xl">
                {SYMBOLS[s]}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className={`${panel} bg-[#3a3f4b] text-white`}>
          <Hint>🔒 A lock with four symbol dials. Your partner knows the order.</Hint>
          <div className="mt-3 flex justify-center gap-4">
            {card.dials.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <button className="chip !min-h-0 !py-0" onClick={() => send({ op: 'spin', dial: i, dir: -1 })} aria-label="Previous symbol">▲</button>
                <span className="flex h-20 w-20 items-center justify-center rounded-xl border-[3px] border-line bg-[#fff8e7] text-5xl text-[#2b2140]">{SYMBOLS[s]}</span>
                <button className="chip !min-h-0 !py-0" onClick={() => send({ op: 'spin', dial: i, dir: 1 })} aria-label="Next symbol">▼</button>
              </div>
            ))}
          </div>
          <button className="btn btn-mint mx-auto mt-4 block" onClick={() => send({ op: 'tryDial' })}>Try the lock 🔓</button>
        </div>
      );
    case 'code':
      return card.role === 'clue' ? (
        <div className={`${panel} -rotate-1 bg-[#fff8c7] font-semibold text-[#2b2140]`}>
          <Hint>📜 A crumpled note:</Hint>
          <p className="mt-2 font-display text-xl">“The code is how many of these you can see, in this order:”</p>
          <div className="mt-3 flex justify-center gap-4 text-5xl">
            {card.order.map((o, i) => (
              <span key={i} className="flex flex-col items-center">
                {o}
                <span className="text-base font-extrabold">#{i + 1}</span>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <CodeActor card={card} send={send} />
      );
    case 'colors':
      return card.role === 'clue' ? (
        <div className={`${panel} bg-[#2b2140] text-white`}>
          <Hint>🪟 A stained-glass window, left to right:</Hint>
          <div className="mt-3 flex justify-center gap-2">
            {card.window.map((c, i) => (
              <span key={i} className="h-28 w-14 rounded-t-full border-[3px] border-[#0d0d12]" style={{ background: COLOR_HEX[c], boxShadow: `0 0 18px ${COLOR_HEX[c]}66` }} />
            ))}
          </div>
        </div>
      ) : (
        <div className={`${panel} bg-[#3a3f4b] text-white`}>
          <Hint>🎛️ Four buttons. Press them in the right order ({card.length} presses). A wrong one resets it.</Hint>
          <div className="mt-2 flex justify-center gap-1">
            {Array.from({ length: card.length }, (_, i) => (
              <span key={i} className={`h-3 w-3 rounded-full border-2 border-line ${i < card.progress ? 'bg-mint' : 'bg-[#1f1b2e]'}`} />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {COLORS.map((c) => (
              <button key={c} onClick={() => send({ op: 'color', color: c })} className="h-20 rounded-2xl border-[3px] border-line shadow-[0_5px_0_var(--line)] active:translate-y-1 active:shadow-none" style={{ background: COLOR_HEX[c] }} aria-label={c} />
            ))}
          </div>
        </div>
      );
    case 'levers':
      return card.role === 'clue' ? (
        <div className={`${panel} bg-[#2f3a2f] text-[#e8f5e8]`}>
          <Hint>🖍️ Chalk marks scratched on the wall:</Hint>
          <div className="mt-3 flex justify-center gap-3 font-display text-5xl">
            {card.pattern.map((s, i) => (
              <span key={i}>{s}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className={`${panel} bg-[#3a3f4b] text-white`}>
          <Hint>
            ⚙️ Six levers. A plaque reads: <b className="text-2xl">{card.legend.up}</b> = up · <b className="text-2xl">{card.legend.down}</b> = down
          </Hint>
          <div className="mt-3 flex justify-center gap-4">
            {card.state.map((up, i) => (
              <button key={i} onClick={() => send({ op: 'lever', lever: i })} className="flex h-28 w-12 flex-col items-center rounded-xl border-[3px] border-line bg-[#1f1b2e] p-1" aria-label={`Lever ${i + 1}, ${up ? 'up' : 'down'}`}>
                <span className={`h-10 w-6 rounded-full border-2 border-line bg-yellow transition-all ${up ? 'mt-0' : 'mt-14'}`} />
              </button>
            ))}
          </div>
          <button className="btn btn-mint mx-auto mt-4 block" onClick={() => send({ op: 'tryLevers' })}>Pull the big lever 🔓</button>
        </div>
      );
    case 'maze':
      return card.role === 'clue' ? <MazeClue card={card} /> : <MazeActor card={card} send={send} />;
  }
}

function CodeActor({ card, send }: { card: Extract<Card, { kind: 'code'; role: 'actor' }>; send: Send }) {
  const [code, setCode] = useState('');
  return (
    <div className={`${panel} bg-[#c98b4f] text-[#2b2140]`}>
      <Hint>🗄️ A cluttered shelf, and a keypad with {card.length} digits.</Hint>
      <div className="relative mt-3 aspect-[2/1] w-full rounded-xl border-[3px] border-line bg-[#e8c99a]">
        {card.shelf.map((s, i) => (
          <span key={i} className="absolute text-3xl" style={{ left: `${s.x}%`, top: `${s.y}%`, transform: `rotate(${s.r}deg)` }}>
            {s.obj}
          </span>
        ))}
      </div>
      <form
        className="mt-3 flex justify-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.length === card.length) send({ op: 'code', code });
          setCode('');
        }}
      >
        <input
          className="w-40 rounded-xl border-[3px] border-line bg-white px-3 py-2 text-center font-mono text-3xl tracking-[0.3em]"
          value={code}
          inputMode="numeric"
          maxLength={card.length}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder={'•'.repeat(card.length)}
          aria-label="Code"
        />
        <button className="btn btn-mint" disabled={code.length !== card.length}>Enter</button>
      </form>
    </div>
  );
}

function Grid({ size, children }: { size: number; children: (x: number, y: number) => React.ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-[360px] gap-0" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
      {Array.from({ length: size * size }, (_, i) => children(i % size, Math.floor(i / size)))}
    </div>
  );
}

function MazeClue({ card }: { card: Extract<Card, { kind: 'maze'; role: 'clue' }> }) {
  const b = (on: boolean) => (on ? '4px solid #2b2140' : '1px dashed rgba(43,33,64,0.2)');
  return (
    <div className={`${panel} bg-[#fff8e7] text-[#2b2140]`}>
      <Hint>🗺️ A map of the crawlspace. Your partner is the 🔦, in the dark. Guide them to the 🚪.</Hint>
      <div className="mt-3">
        <Grid size={card.size}>
          {(x, y) => {
            const w = card.walls[y * card.size + x]!;
            const here = card.pos[0] === x && card.pos[1] === y;
            const exit = card.exit[0] === x && card.exit[1] === y;
            return (
              <div
                key={`${x},${y}`}
                className="flex aspect-square items-center justify-center text-2xl"
                style={{ borderTop: b(!!(w & WALL.up)), borderRight: b(!!(w & WALL.right)), borderBottom: b(!!(w & WALL.down)), borderLeft: b(!!(w & WALL.left)) }}
              >
                {here ? '🔦' : exit ? '🚪' : ''}
              </div>
            );
          }}
        </Grid>
      </div>
    </div>
  );
}

function MazeActor({ card, send }: { card: Extract<Card, { kind: 'maze'; role: 'actor' }>; send: Send }) {
  useEffect(() => {
    const keys: Record<string, Dir> = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' };
    const on = (e: KeyboardEvent) => {
      const dir = keys[e.key.toLowerCase()];
      if (!dir || e.repeat || (e.target instanceof Element && e.target.closest('input'))) return;
      e.preventDefault();
      send({ op: 'move', dir });
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [send]);
  const trail = new Set(card.trail.map(([x, y]) => `${x},${y}`));
  return (
    <div className={`${panel} bg-[#0d0d12] text-white`}>
      <Hint>🔦 Pitch dark. You can't see the walls. Bump into one and you're back at the start. Arrow keys or WASD.</Hint>
      <div className="mt-3">
        <Grid size={card.size}>
          {(x, y) => {
            const here = card.pos[0] === x && card.pos[1] === y;
            return (
              <div key={`${x},${y}`} className="flex aspect-square items-center justify-center border border-white/10 text-2xl" style={{ background: trail.has(`${x},${y}`) ? 'rgba(255,224,138,0.18)' : 'transparent' }}>
                {here ? '🔦' : ''}
              </div>
            );
          }}
        </Grid>
      </div>
      <div className="mx-auto mt-3 grid w-40 grid-cols-3 gap-1">
        <span />
        <button className="chip justify-center" onClick={() => send({ op: 'move', dir: 'up' })} aria-label="Up">↑</button>
        <span />
        <button className="chip justify-center" onClick={() => send({ op: 'move', dir: 'left' })} aria-label="Left">←</button>
        <button className="chip justify-center" onClick={() => send({ op: 'move', dir: 'down' })} aria-label="Down">↓</button>
        <button className="chip justify-center" onClick={() => send({ op: 'move', dir: 'right' })} aria-label="Right">→</button>
      </div>
    </div>
  );
}
