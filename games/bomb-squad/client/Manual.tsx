import { useState } from 'react';
import {
  LED_COLORS,
  MODULE_INFO,
  MORSE,
  buttonRuleText,
  memoryStepText,
  switchRuleText,
  wireOtherwiseText,
  wireRuleText,
  type Edition,
  type MazeDef,
  type ModuleKind,
} from '../shared';

const SWATCH: Record<string, string> = { red: '#ff4f4f', blue: '#3b82f6', yellow: '#ffc93c', white: '#f5f5f5', green: '#3ddc97' };
const H2 = 'font-display text-2xl font-extrabold';
const H3 = 'font-display text-lg font-extrabold';
const cell = 'border-2 border-[#2b2140] px-2 py-0.5';

function MazeMap({ m, n }: { m: MazeDef; n: number }) {
  const b = (on: boolean) => (on ? '3px solid #2b2140' : '1px dotted rgba(43,33,64,0.25)');
  return (
    <div>
      <p className="text-center text-sm font-extrabold">Maze {n + 1}</p>
      <div className="grid w-36 grid-cols-6">
        {m.walls.map((w, i) => {
          const x = i % 6;
          const y = Math.floor(i / 6);
          const marker = m.markers.some(([mx, my]) => mx === x && my === y);
          return (
            <div key={i} className="flex aspect-square items-center justify-center" style={{ borderTop: b(!!(w & 1)), borderRight: b(!!(w & 2)), borderBottom: b(!!(w & 4)), borderLeft: b(!!(w & 8)) }}>
              {marker && <span className="h-3 w-3 rounded-full border-2 border-[#2b2140] bg-mint" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** The Expert's defusal manual, for this bomb's edition. Tabs only for modules on the bomb. */
export default function Manual({ ed, kinds }: { ed: Edition; kinds: ModuleKind[] }) {
  const present = [...new Set(kinds)];
  const [tab, setTab] = useState<ModuleKind | 'intro'>('intro');
  return (
    <div className="grid gap-4 lg:grid-cols-[210px_1fr]">
      <nav className="flex flex-wrap gap-2 lg:flex-col">
        <button className="chip text-left" aria-pressed={tab === 'intro'} onClick={() => setTab('intro')}>
          📖 Read me first
        </button>
        {present.map((k) => (
          <button key={k} className="chip text-left" aria-pressed={tab === k} onClick={() => setTab(k)}>
            {MODULE_INFO[k].emoji} {MODULE_INFO[k].title}
          </button>
        ))}
      </nav>
      <article className="sticker max-h-[calc(100dvh-220px)] min-h-[420px] space-y-3 overflow-y-auto !bg-[#fdf6e3] p-6 font-semibold leading-relaxed text-[#2b2140]">
        <p className="inline-block rounded-full border-2 border-[#2b2140] px-3 text-sm font-extrabold">Manual edition #{ed.id}</p>
        {tab === 'intro' && (
          <>
            <h2 className={H2}>Bomb Defusal Manual</h2>
            <p>Your partner is looking at a bomb. You are looking at this manual. Neither of you can see what the other sees: talk!</p>
            <p>⚠️ The rules change with every bomb. Make sure the edition number above matches the one on your partner's bomb.</p>
            <p>Every bomb has a serial number and some batteries. Many rules depend on them, so ask your partner to read them out.</p>
            <p>Three mistakes (strikes) and the bomb explodes. So does running out of time. This bomb has: {present.map((k) => `${MODULE_INFO[k].emoji} ${MODULE_INFO[k].title}`).join(', ')}.</p>
          </>
        )}
        {tab === 'wires' && (
          <>
            <h2 className={H2}>Wires</h2>
            <p>A module has 3 to 6 colored wires. Cut exactly one. Count wires from the top. Use the first rule that applies.</p>
            {([3, 4, 5, 6] as const).map((n) => (
              <div key={n}>
                <h3 className={H3}>{n} wires</h3>
                <ol className="list-inside list-decimal">
                  {ed.wires[n].rules.map((r, i) => (
                    <li key={i}>{wireRuleText(r, i === 0)}</li>
                  ))}
                  <li>{wireOtherwiseText(ed.wires[n].otherwise)}</li>
                </ol>
              </div>
            ))}
          </>
        )}
        {tab === 'button' && (
          <>
            <h2 className={H2}>The Button</h2>
            <p>A big button with a color and a word. TAP it (press and let go) or HOLD it. Use the first rule that applies.</p>
            <ol className="list-inside list-decimal">
              {ed.button.rules.map((r, i) => (
                <li key={i}>{buttonRuleText(r, i === 0)}</li>
              ))}
              <li>Otherwise, {ed.button.otherwise} it.</li>
            </ol>
            <p>When you hold it, a strip lights up. Let go when the countdown timer shows this digit anywhere:</p>
            <table className="border-collapse">
              <tbody>
                {(Object.entries(ed.button.strip) as [string, string][]).map(([c, d]) => (
                  <tr key={c}>
                    <td className={cell}>
                      <span className="mr-2 inline-block h-3 w-3 rounded-full border border-[#2b2140]" style={{ background: SWATCH[c] }} />
                      {c} strip
                    </td>
                    <td className={cell}>release on a {d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {tab === 'symbols' && (
          <>
            <h2 className={H2}>Symbols</h2>
            <p>Four buttons with strange symbols. Exactly one column below has all four. Press them in that column's order, top to bottom.</p>
            <div className="flex flex-wrap gap-3">
              {ed.symbols.map((col, i) => (
                <div key={i} className="flex flex-col items-center rounded-xl border-2 border-[#2b2140] px-3 py-2">
                  {col.map((s) => (
                    <span key={s} className="text-3xl leading-tight">
                      {s}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
        {tab === 'simon' && (
          <>
            <h2 className={H2}>Simon Says</h2>
            <p>Pads flash a sequence. Do NOT press the color that flashed: press the one this table says. Each right answer adds one flash; repeat the whole sequence every time. The table depends on whether the serial has a vowel, and on how many strikes you have right now.</p>
            {(['vowel', 'noVowel'] as const).map((k) => (
              <div key={k}>
                <h3 className={H3}>Serial number {k === 'vowel' ? 'HAS' : 'has NO'} vowel</h3>
                <table className="border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className={cell}>Flashed →</th>
                      {(['red', 'blue', 'green', 'yellow'] as const).map((c) => (
                        <th key={c} className={cell} style={{ color: c === 'yellow' ? '#a07800' : SWATCH[c] }}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ed.simon[k].map((row, strikes) => (
                      <tr key={strikes}>
                        <td className={cell}>
                          {strikes} strike{strikes === 1 ? '' : 's'}
                        </td>
                        {(['red', 'blue', 'green', 'yellow'] as const).map((c) => (
                          <td key={c} className={`${cell} font-extrabold`}>
                            press {row[c]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </>
        )}
        {tab === 'password' && (
          <>
            <h2 className={H2}>Password</h2>
            <p>Five letter wheels. Only one word from this list can be spelled with them. Spell it and press SUBMIT.</p>
            <div className="grid grid-cols-5 gap-x-4 gap-y-1 font-mono text-lg uppercase">
              {ed.passwords.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
          </>
        )}
        {tab === 'morse' && (
          <>
            <h2 className={H2}>Morse Code</h2>
            <p>A light blinks a word in Morse code, over and over (a long pause marks the start). Work out the word, find its frequency below, have your partner tune to it and press TX.</p>
            <table className="border-collapse">
              <tbody>
                {ed.morse.map((m) => (
                  <tr key={m.word}>
                    <td className={`${cell} font-mono uppercase`}>{m.word}</td>
                    <td className={`${cell} font-mono`}>{m.freq} MHz</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 className={H3}>Morse alphabet (· short, — long)</h3>
            <div className="grid grid-cols-4 gap-x-4 font-mono sm:grid-cols-6">
              {Object.entries(MORSE).map(([ch, code]) => (
                <span key={ch}>
                  <b className="uppercase">{ch}</b> {code.replace(/\./g, '·').replace(/-/g, '—')}
                </span>
              ))}
            </div>
          </>
        )}
        {tab === 'maze' && (
          <>
            <h2 className={H2}>Maze</h2>
            <p>Your partner sees a 6×6 grid with two green circles, a white light (them) and a red triangle (the goal), but no walls. Find the maze with the circles in the same places, then guide them. Walking into a wall is a strike.</p>
            <div className="flex flex-wrap gap-4">
              {ed.mazes.map((m, i) => (
                <MazeMap key={i} m={m} n={i} />
              ))}
            </div>
          </>
        )}
        {tab === 'memory' && (
          <>
            <h2 className={H2}>Memory</h2>
            <p>A big display shows a number (1–4) and four buttons are labeled 1–4 in some order. There are 5 stages; remember what was pressed in each (its position and its label). A mistake resets it to stage 1.</p>
            {ed.memory.map((stage, s) => (
              <div key={s}>
                <h3 className={H3}>Stage {s + 1}</h3>
                <ul className="list-inside list-disc">
                  {stage.map((step, d) => (
                    <li key={d}>
                      Display shows <b>{d + 1}</b>: {memoryStepText(step)}.
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}
        {tab === 'switches' && (
          <>
            <h2 className={H2}>Switches</h2>
            <p>Five switches, each with a little colored light above it. Set every switch the way its light's rule says, then press CHECK.</p>
            <ul className="list-inside list-disc">
              {LED_COLORS.map((led) => (
                <li key={led}>
                  <span className="mr-1 inline-block h-3 w-3 rounded-full border border-[#2b2140]" style={{ background: SWATCH[led] }} />
                  {switchRuleText(led, ed.switches[led])}
                </li>
              ))}
            </ul>
          </>
        )}
      </article>
    </div>
  );
}
