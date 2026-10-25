# 💣 Bomb Squad

One of you is looking at a ticking bomb. The other has the defusal manual. Neither can see what the other sees, so the only way to win is to talk: "it's a BLUE button that says ABORT!", "how many batteries?!", "which symbol, the little trident?". Inspired by *Keep Talking and Nobody Explodes*. It's played at `/bomb` in the [Games for Two](../../README.md) portal. Play it on a call.

## How to play

1. One of you opens **Bomb Squad** from the portal and creates a room. Send the code or link (`/bomb/CODE`).
2. The host picks a difficulty and arms the bomb. A coin flip decides who defuses first.
3. The **Defuser** sees the bomb: a timer, a strike counter, the serial number, the batteries and 3–5 modules. The **Expert** sees the manual, with one tab per module.
4. Defuse every module before the timer hits 0:00. Each mistake is a **strike** (the screen flashes red). Three strikes and it blows up.
5. After each bomb you both press **Next bomb** and the roles swap.

| Difficulty | Modules | Timer |
|---|---|---|
| 🟢 Easy | 3 | 5:00 |
| 🟡 Normal | 4 | 4:00 |
| 🔴 Hard | 5 | 3:00 |

### The modules

- **〰️ Wires:** 3–6 colored wires. Cut exactly one. Which one depends on the colors, the count, the batteries and the serial's last digit.
- **🔴 The Button:** tap it or hold it, depending on its color, its word, the batteries and the serial. When held, a strip lights up, and its color says which digit to let go on.
- **🔣 Symbols:** four strange symbols. One manual column has all four; press them in that column's order.
- **🟦 Simon Says:** pads flash a growing sequence. Press the *mapped* color, not the one that flashed. The map changes with the strike count and whether the serial has a vowel.
- **🔤 Password:** five letter wheels. Only one word from the list of 35 can be spelled. Spell it and submit.

The manual was written for this game; its rules are not copied from KTANE.

## Run it

From the repository root, `npm install`, then `npm run dev`. Open http://localhost:5173/bomb.

## Files

```
games/bomb-squad/           # @gfc/bomb, built on the shared kit (../../kit)
├─ shared/manual.ts         # the manual text and tables (what the Expert reads)
├─ shared/rules.ts          # solvers that implement exactly those rules
├─ shared/index.ts          # difficulties, module types, state, zod schemas
├─ server/game.ts           # bomb generation, actions → ok / strike / solved, timer
├─ server/index.ts          # view + registerGame() wiring (namespace /bomb)
├─ server/__tests__/        # 14 unit tests
├─ client/                  # BombApp, screens, Modules (bomb panels), Manual (tabs)
└─ docs/spec.md
```

## Tests

```bash
npm test -w @gfc/bomb
```

The tests cover:
- every solver (wires by count, button tap/hold and release digits, symbol columns, Simon maps, spellable passwords),
- bomb generation (unique symbol columns, exactly one spellable password),
- strikes, explosions on 3 strikes and on time, a full defuse,
- role swaps between bombs,
- the view (the Expert never receives the armed bomb).
