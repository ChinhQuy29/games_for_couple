import { useState } from 'react';
import { MANUAL } from '../shared';

const SECTIONS = ['intro', 'wires', 'button', 'symbols', 'simon', 'password'] as const;
type Section = (typeof SECTIONS)[number];
const LABEL: Record<Section, string> = {
  intro: '📖 Read me first',
  wires: '〰️ Wires',
  button: '🔴 The Button',
  symbols: '🔣 Symbols',
  simon: '🟦 Simon Says',
  password: '🔤 Password',
};
const SWATCH = { red: '#ff4f4f', blue: '#3b82f6', yellow: '#ffc93c', white: '#f5f5f5', green: '#3ddc97' } as const;

/** The Expert's defusal manual. Tabs, because the Defuser will be yelling "BUTTON! THE BUTTON!" */
export default function Manual() {
  const [tab, setTab] = useState<Section>('intro');
  return (
    <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
      <nav className="flex flex-wrap gap-2 lg:flex-col">
        {SECTIONS.map((s) => (
          <button key={s} className="chip text-left" aria-pressed={tab === s} onClick={() => setTab(s)}>
            {LABEL[s]}
          </button>
        ))}
      </nav>
      <article className="sticker min-h-[420px] space-y-3 !bg-[#fdf6e3] p-6 font-semibold leading-relaxed text-[#2b2140]">
        {tab === 'intro' && (
          <>
            <h2 className="font-display text-2xl font-extrabold">Bomb Defusal Manual</h2>
            {MANUAL.intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <p>Ask your partner which modules they see, then open that tab.</p>
          </>
        )}
        {tab === 'wires' && (
          <>
            <h2 className="font-display text-2xl font-extrabold">{MANUAL.wires.title}</h2>
            <p>{MANUAL.wires.intro}</p>
            {([3, 4, 5, 6] as const).map((n) => (
              <div key={n}>
                <h3 className="font-display text-lg font-extrabold">{n} wires</h3>
                <ol className="list-inside list-decimal">
                  {MANUAL.wires.byCount[n].map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ol>
              </div>
            ))}
          </>
        )}
        {tab === 'button' && (
          <>
            <h2 className="font-display text-2xl font-extrabold">{MANUAL.button.title}</h2>
            <p>{MANUAL.button.intro}</p>
            <ol className="list-inside list-decimal">
              {MANUAL.button.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
            <p>{MANUAL.button.holdIntro}</p>
            <table className="border-collapse">
              <tbody>
                {MANUAL.button.strip.map(([c, d]) => (
                  <tr key={c}>
                    <td className="border-2 border-[#2b2140] px-3 py-1">
                      <span className="mr-2 inline-block h-3 w-3 rounded-full border border-[#2b2140]" style={{ background: SWATCH[c] }} />
                      {c} strip
                    </td>
                    <td className="border-2 border-[#2b2140] px-3 py-1">release on a {d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {tab === 'symbols' && (
          <>
            <h2 className="font-display text-2xl font-extrabold">{MANUAL.symbols.title}</h2>
            <p>{MANUAL.symbols.intro}</p>
            <div className="flex flex-wrap gap-3">
              {MANUAL.symbols.columns.map((col, i) => (
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
            <h2 className="font-display text-2xl font-extrabold">{MANUAL.simon.title}</h2>
            <p>{MANUAL.simon.intro}</p>
            <p>{MANUAL.simon.note}</p>
            {(['vowel', 'noVowel'] as const).map((k) => (
              <div key={k}>
                <h3 className="font-display text-lg font-extrabold">Serial number {k === 'vowel' ? 'HAS' : 'has NO'} vowel</h3>
                <table className="border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="border-2 border-[#2b2140] px-2">Flashed →</th>
                      {(['red', 'blue', 'green', 'yellow'] as const).map((c) => (
                        <th key={c} className="border-2 border-[#2b2140] px-2" style={{ color: c === 'yellow' ? '#a07800' : SWATCH[c] }}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MANUAL.simon.table[k].map((row, strikes) => (
                      <tr key={strikes}>
                        <td className="border-2 border-[#2b2140] px-2">{strikes} strike{strikes === 1 ? '' : 's'}</td>
                        {(['red', 'blue', 'green', 'yellow'] as const).map((c) => (
                          <td key={c} className="border-2 border-[#2b2140] px-2 font-extrabold">
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
            <h2 className="font-display text-2xl font-extrabold">{MANUAL.password.title}</h2>
            <p>{MANUAL.password.intro}</p>
            <div className="grid grid-cols-5 gap-x-4 gap-y-1 font-mono text-lg uppercase">
              {MANUAL.password.words.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
          </>
        )}
      </article>
    </div>
  );
}
