# 💣 Bomb Squad

One of you is looking at a ticking bomb. The other has the defusal manual. Neither can see what the other sees, so the only way to win is to talk: "it's a BLUE button that says ABORT!", "how many batteries?!", "which symbol, the little trident?". Inspired by *Keep Talking and Nobody Explodes*. It's played at `/bomb` in the [Games for Two](../../README.md) portal. Play it on a call.

> **Who goes first:** in the lobby, the host picks who defuses the first bomb: 🎲 random, themselves, or their partner. Roles still swap after that.

## How to play

1. One of you opens **Bomb Squad** from the portal and creates a room. Send the code or link (`/bomb/CODE`).
2. The host picks a difficulty and arms the bomb. A coin flip decides who defuses first.
3. The **Defuser** sees the bomb: a timer, a strike counter, the serial number, the batteries and 3–5 modules. The **Expert** sees the manual, with one tab per module.
4. Defuse every module before the timer hits 0:00. Each mistake is a **strike** (the screen flashes red). Three strikes and it blows up.
5. After each bomb you both press **Next bomb** and the roles swap.

| Difficulty | Modules | Timer |
|---|---|---|
| 🟢 Easy | 3 | 5:00 |
| 🟡 Normal | 4 | 4:30 |
| 🔴 Hard | 6 | 5:30 |

### Nothing stays the same

- **A new manual every bomb.** Each bomb comes with a randomly generated **manual edition** (the number is on both screens). The wire rules, button rules, strip digits, symbol columns, Simon tables, password list, Morse frequencies, mazes, memory steps and switch rules all change. Last bomb's rules won't help you.
- **A different mix of modules.** There are 9 kinds. Each bomb draws its modules at random, preferring kinds the previous bomb didn't have, and the Expert's manual only has tabs for the ones on this bomb.

### The modules

- **〰️ Wires:** 3–6 colored wires. Cut exactly one, chosen by the first matching rule (colors, positions, batteries, the serial's last digit, vowels).
- **🔴 The Button:** tap or hold, by the first matching rule. While held, a strip lights up; its color says which digit to let go on.
- **🔣 Symbols:** four strange symbols. One manual column has all four; press them in that column's order.
- **🟦 Simon Says:** pads flash a growing sequence. Press the *mapped* color, which depends on the strike count and whether the serial has a vowel.
- **🔤 Password:** five letter wheels. Only one word from the manual's list can be spelled.
- **📡 Morse Code:** a light blinks a word. The Expert decodes it with the Morse alphabet, looks up its frequency, and the Defuser tunes to it and presses TX.
- **🌀 Maze:** the Defuser sees two green circles, a white light and a red triangle, but no walls. The circles identify one of the manual's six mazes; walking into a wall is a strike.
- **🧠 Memory:** a display number and four labeled buttons, over 5 stages. Later stages say things like "same position as stage 2". A mistake resets it to stage 1.
- **🎚️ Switches:** five switches with colored lights. Each light's rule says up or down, based on the serial, the batteries, or how many lights share its color.

The rules are generated for this game; none are copied from KTANE.

## Run it

From the repository root, `npm install`, then `npm run dev`. Open http://localhost:5173/bomb.

## Files

```
games/bomb-squad/           # @gfc/bomb, built on the shared kit (../../kit)
├─ shared/edition.ts        # manual editions: generated rules, their solvers, and their text
├─ shared/index.ts          # difficulties, module types, state, zod schemas
├─ server/game.ts           # bombs (edition + module mix), actions → ok / strike / solved, timer
├─ server/index.ts          # view + registerGame() wiring (namespace /bomb)
├─ server/__tests__/        # 10 unit tests
├─ client/                  # BombApp, screens, Modules (bomb panels), Manual (tabs)
└─ docs/spec.md
```

## Tests

```bash
npm test -w @gfc/bomb
```

The tests cover:
- editions: deterministic per id, different across ids, always playable (valid wire targets, distinct strip digits, identifiable mazes),
- generated symbols and passwords are unambiguous,
- the module mix avoids the last bomb's kinds,
- every one of the 9 module kinds defused by following the manual,
- strikes (a wrong wire, a maze wall, a wrong memory press) and exploding,
- a new edition and swapped roles for the next bomb,
- only the Expert gets the manual, only the Defuser gets the bomb; the "who goes first" choice.
