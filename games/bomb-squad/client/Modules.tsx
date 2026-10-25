import { useEffect, useState } from 'react';
import { MODULE_INFO, morseFor, type BombAct, type LedColor, type Module, type SimonColor } from '../shared';

// The Defuser's module panels. Each sends a BombAct; the server decides right or wrong.

export type Send = (a: BombAct) => void;

const WIRE_HEX = { red: '#ff4f4f', blue: '#3b82f6', yellow: '#ffc93c', white: '#f5f5f5', black: '#1f1b2e' } as const;
const PAD_HEX: Record<SimonColor, string> = { red: '#ff4f4f', blue: '#3b82f6', green: '#3ddc97', yellow: '#ffc93c' };
const BUTTON_HEX = { red: '#ff4f4f', blue: '#3b82f6', yellow: '#ffc93c', white: '#f5f5f5' } as const;

export function ModulePanel({ mod, index, send, timerText }: { mod: Module; index: number; send: Send; timerText: string }) {
  return (
    <div className={`relative rounded-2xl border-[3px] border-line bg-[#3a3f4b] p-4 text-white ${mod.solved ? 'opacity-90' : ''}`}>
      <span
        className={`absolute right-3 top-3 h-4 w-4 rounded-full border-2 border-line ${mod.solved ? 'bg-mint shadow-[0_0_10px_#3ddc97]' : 'bg-[#5b1d1d]'}`}
        aria-label={mod.solved ? 'Solved' : 'Not solved'}
      />
      <p className="mb-2 font-display text-sm font-extrabold uppercase tracking-wider opacity-70">
        {index + 1} · {MODULE_INFO[mod.kind].title}
      </p>
      {mod.kind === 'wires' && <Wires mod={mod} index={index} send={send} />}
      {mod.kind === 'button' && <BigButton mod={mod} index={index} send={send} timerText={timerText} />}
      {mod.kind === 'symbols' && <Symbols mod={mod} index={index} send={send} />}
      {mod.kind === 'simon' && <Simon mod={mod} index={index} send={send} />}
      {mod.kind === 'password' && <Password mod={mod} index={index} send={send} />}
      {mod.kind === 'morse' && <Morse mod={mod} index={index} send={send} />}
      {mod.kind === 'maze' && <Maze mod={mod} index={index} send={send} />}
      {mod.kind === 'memory' && <Memory mod={mod} index={index} send={send} />}
      {mod.kind === 'switches' && <Switches mod={mod} index={index} send={send} />}
    </div>
  );
}


function Wires({ mod, index, send }: { mod: Extract<Module, { kind: 'wires' }>; index: number; send: Send }) {
  return (
    <div className="flex flex-col gap-3 py-1">
      {mod.wires.map((c, i) => {
        const cut = mod.cut.includes(i);
        return (
          <button
            key={i}
            disabled={mod.solved || cut}
            onClick={() => send({ op: 'cut', module: index, wire: i })}
            className="group relative h-6 w-full"
            aria-label={`Wire ${i + 1}, ${c}${cut ? ', cut' : ''}`}
          >
            <span className="absolute left-0 top-1/2 h-3 w-full -translate-y-1/2 rounded-full border-2 border-line" style={{ background: WIRE_HEX[c] }} />
            {cut && <span className="absolute left-1/2 top-0 h-6 w-6 -translate-x-1/2 rounded bg-[#3a3f4b]" />}
            {!cut && !mod.solved && <span className="absolute inset-0 rounded opacity-0 ring-4 ring-yellow group-hover:opacity-100" />}
          </button>
        );
      })}
      <p className="text-xs opacity-60">Click a wire to cut it.</p>
    </div>
  );
}

function BigButton({ mod, index, send, timerText }: { mod: Extract<Module, { kind: 'button' }>; index: number; send: Send; timerText: string }) {
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <button
        disabled={mod.solved}
        onPointerDown={() => send({ op: 'press', module: index })}
        onPointerUp={() => send({ op: 'release', module: index, shown: timerText })}
        className="h-28 w-28 rounded-full border-4 border-line font-display text-lg font-extrabold shadow-[0_6px_0_var(--line)] active:translate-y-1 active:shadow-[0_2px_0_var(--line)]"
        style={{ background: BUTTON_HEX[mod.color], color: mod.color === 'white' || mod.color === 'yellow' ? '#2b2140' : '#fff' }}
      >
        {mod.label}
      </button>
      <div
        className="h-28 w-5 rounded-full border-2 border-line transition-colors"
        style={{ background: mod.holding ? BUTTON_HEX[mod.holding.strip] : '#1f1b2e', boxShadow: mod.holding ? `0 0 14px ${BUTTON_HEX[mod.holding.strip]}` : 'none' }}
        aria-label={mod.holding ? `Strip: ${mod.holding.strip}` : 'Strip off'}
      />
    </div>
  );
}

function Symbols({ mod, index, send }: { mod: Extract<Module, { kind: 'symbols' }>; index: number; send: Send }) {
  return (
    <div className="grid grid-cols-2 gap-3 py-1">
      {mod.symbols.map((s) => {
        const done = mod.pressed.includes(s);
        return (
          <button
            key={s}
            disabled={mod.solved || done}
            onClick={() => send({ op: 'symbol', module: index, symbol: s })}
            className={`h-16 rounded-xl border-[3px] border-line text-4xl font-bold ${done ? 'bg-mint text-[#2b2140]' : 'bg-[#f3efe6] text-[#2b2140] hover:bg-yellow'}`}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

function Simon({ mod, index, send }: { mod: Extract<Module, { kind: 'simon' }>; index: number; send: Send }) {
  // Replay the first `stage` flashes, pause, repeat.
  const [lit, setLit] = useState<SimonColor | null>(null);
  useEffect(() => {
    if (mod.solved) return;
    let cancelled = false;
    const seq = mod.flashes.slice(0, mod.stage);
    const run = async () => {
      while (!cancelled) {
        for (const c of seq) {
          if (cancelled) return;
          setLit(c);
          await new Promise((r) => setTimeout(r, 450));
          setLit(null);
          await new Promise((r) => setTimeout(r, 250));
        }
        await new Promise((r) => setTimeout(r, 1800));
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [mod.flashes, mod.stage, mod.solved]);

  return (
    <div className="grid grid-cols-2 gap-3 py-1">
      {(['red', 'blue', 'green', 'yellow'] as SimonColor[]).map((c) => (
        <button
          key={c}
          disabled={mod.solved}
          onClick={() => send({ op: 'simon', module: index, color: c })}
          className="h-14 rounded-xl border-[3px] border-line transition-all active:scale-95"
          style={{ background: PAD_HEX[c], opacity: lit === c ? 1 : 0.4, boxShadow: lit === c ? `0 0 24px ${PAD_HEX[c]}` : 'none' }}
          aria-label={c}
        />
      ))}
      <p className="col-span-2 text-xs opacity-60">
        Stage {mod.stage}/{mod.flashes.length} · input {mod.input.length}/{mod.stage}
      </p>
    </div>
  );
}

function Password({ mod, index, send }: { mod: Extract<Module, { kind: 'password' }>; index: number; send: Send }) {
  return (
    <div className="flex flex-col items-center gap-3 py-1">
      <div className="flex gap-2">
        {mod.columns.map((col, i) => (
          <div key={i} className="flex flex-col items-center">
            <button disabled={mod.solved} className="text-lg opacity-80 hover:opacity-100" onClick={() => send({ op: 'spin', module: index, column: i, dir: -1 })} aria-label="Up">
              ▲
            </button>
            <span className="flex h-12 w-10 items-center justify-center rounded-lg border-[3px] border-line bg-[#cfe9c6] font-display text-2xl font-extrabold uppercase text-[#2b2140]">
              {col[mod.positions[i]!]}
            </span>
            <button disabled={mod.solved} className="text-lg opacity-80 hover:opacity-100" onClick={() => send({ op: 'spin', module: index, column: i, dir: 1 })} aria-label="Down">
              ▼
            </button>
          </div>
        ))}
      </div>
      <button disabled={mod.solved} className="chip !min-h-0 !bg-yellow !py-1 text-sm !text-[#2b2140]" onClick={() => send({ op: 'submit', module: index })}>
        SUBMIT
      </button>
    </div>
  );
}

function Morse({ mod, index, send }: { mod: Extract<Module, { kind: 'morse' }>; index: number; send: Send }) {
  // Blink the word: dot 250ms, dash 750ms, a short gap between symbols, a longer one between letters, 2s at the end.
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (mod.solved) return;
    let cancelled = false;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const run = async () => {
      while (!cancelled) {
        for (const letter of morseFor(mod.word).split(' ')) {
          for (const sym of letter) {
            if (cancelled) return;
            setOn(true);
            await wait(sym === '.' ? 250 : 750);
            setOn(false);
            await wait(250);
          }
          await wait(500);
        }
        await wait(2000);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [mod.word, mod.solved]);
  return (
    <div className="flex flex-col items-center gap-3 py-1">
      <span className="h-10 w-10 rounded-full border-[3px] border-line transition-colors" style={{ background: on ? '#ffc93c' : '#3a3020', boxShadow: on ? '0 0 20px #ffc93c' : 'none' }} aria-label={on ? 'Light on' : 'Light off'} />
      <div className="flex items-center gap-2">
        <button disabled={mod.solved} className="chip !min-h-0 !py-1" onClick={() => send({ op: 'tune', module: index, dir: -1 })} aria-label="Lower frequency">
          ◀
        </button>
        <span className="rounded-lg border-[3px] border-line bg-[#1f1b2e] px-3 py-1 font-mono text-xl text-[#7dff9a]">{mod.freqs[mod.index]} MHz</span>
        <button disabled={mod.solved} className="chip !min-h-0 !py-1" onClick={() => send({ op: 'tune', module: index, dir: 1 })} aria-label="Higher frequency">
          ▶
        </button>
      </div>
      <button disabled={mod.solved} className="chip !min-h-0 !bg-yellow !py-1 text-sm !text-[#2b2140]" onClick={() => send({ op: 'transmit', module: index })}>
        TX
      </button>
    </div>
  );
}

function Maze({ mod, index, send }: { mod: Extract<Module, { kind: 'maze' }>; index: number; send: Send }) {
  const isAt = (p: [number, number], x: number, y: number) => p[0] === x && p[1] === y;
  const arrow = (dir: 'up' | 'down' | 'left' | 'right', label: string) => (
    <button disabled={mod.solved} className="chip !min-h-0 justify-center !py-0" onClick={() => send({ op: 'move', module: index, dir })} aria-label={dir}>
      {label}
    </button>
  );
  return (
    <div className="flex flex-col items-center gap-2 py-1">
      <div className="grid w-40 grid-cols-6 gap-0.5 rounded-lg bg-[#1f1b2e] p-1">
        {Array.from({ length: 36 }, (_, i) => {
          const x = i % 6;
          const y = Math.floor(i / 6);
          return (
            <span key={i} className="flex aspect-square items-center justify-center rounded-sm bg-[#2b2f38] text-xs">
              {isAt(mod.pos, x, y) ? (
                <span className="h-3 w-3 rounded-full bg-white shadow-[0_0_6px_#fff]" />
              ) : isAt(mod.goal, x, y) ? (
                <span className="text-[#ff4f4f]">▲</span>
              ) : mod.markers.some((m) => isAt(m, x, y)) ? (
                <span className="h-3 w-3 rounded-full border-2 border-mint" />
              ) : (
                <span className="h-1 w-1 rounded-full bg-white/20" />
              )}
            </span>
          );
        })}
      </div>
      <div className="grid w-28 grid-cols-3 gap-1">
        <span />
        {arrow('up', '▲')}
        <span />
        {arrow('left', '◀')}
        {arrow('down', '▼')}
        {arrow('right', '▶')}
      </div>
    </div>
  );
}

function Memory({ mod, index, send }: { mod: Extract<Module, { kind: 'memory' }>; index: number; send: Send }) {
  return (
    <div className="flex flex-col items-center gap-3 py-1">
      <span className="flex h-16 w-24 items-center justify-center rounded-xl border-[3px] border-line bg-[#1f1b2e] font-mono text-5xl text-[#7dff9a]">{mod.solved ? '✓' : mod.display}</span>
      <div className="flex gap-2">
        {mod.labels.map((l, pos) => (
          <button
            key={pos}
            disabled={mod.solved}
            onClick={() => send({ op: 'memory', module: index, pos })}
            className="h-14 w-11 rounded-lg border-[3px] border-line bg-[#f3efe6] font-display text-2xl font-extrabold text-[#2b2140] hover:bg-yellow"
          >
            {l}
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, s) => (
          <span key={s} className={`h-2 w-4 rounded-sm border border-line ${s < mod.history.length || mod.solved ? 'bg-mint' : 'bg-[#1f1b2e]'}`} />
        ))}
      </div>
    </div>
  );
}

const LED_HEX: Record<LedColor, string> = { red: '#ff4f4f', green: '#3ddc97', blue: '#3b82f6', yellow: '#ffc93c' };

function Switches({ mod, index, send }: { mod: Extract<Module, { kind: 'switches' }>; index: number; send: Send }) {
  return (
    <div className="flex flex-col items-center gap-3 py-1">
      <div className="flex gap-3">
        {mod.leds.map((led, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="h-4 w-4 rounded-full border-2 border-line" style={{ background: LED_HEX[led], boxShadow: `0 0 8px ${LED_HEX[led]}` }} aria-label={`${led} light`} />
            <button
              disabled={mod.solved}
              onClick={() => send({ op: 'flip', module: index, i })}
              className="flex h-16 w-8 flex-col rounded-lg border-[3px] border-line bg-[#1f1b2e] p-0.5"
              aria-label={`Switch ${i + 1}, ${mod.up[i] ? 'up' : 'down'}`}
            >
              <span className={`h-7 w-full rounded-md bg-[#c9c9d6] transition-all ${mod.up[i] ? '' : 'mt-auto'}`} />
            </button>
          </div>
        ))}
      </div>
      <button disabled={mod.solved} className="chip !min-h-0 !bg-yellow !py-1 text-sm !text-[#2b2140]" onClick={() => send({ op: 'check', module: index })}>
        CHECK
      </button>
    </div>
  );
}
