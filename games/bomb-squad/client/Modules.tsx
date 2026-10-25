import { useEffect, useState } from 'react';
import type { BombAct, Module, SimonColor } from '../shared';

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
        {index + 1} · {TITLES[mod.kind]}
      </p>
      {mod.kind === 'wires' && <Wires mod={mod} index={index} send={send} />}
      {mod.kind === 'button' && <BigButton mod={mod} index={index} send={send} timerText={timerText} />}
      {mod.kind === 'symbols' && <Symbols mod={mod} index={index} send={send} />}
      {mod.kind === 'simon' && <Simon mod={mod} index={index} send={send} />}
      {mod.kind === 'password' && <Password mod={mod} index={index} send={send} />}
    </div>
  );
}

const TITLES = { wires: 'Wires', button: 'The Button', symbols: 'Symbols', simon: 'Simon Says', password: 'Password' } as const;

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
