# 🔐 Escape Room for Two

You're locked in two different rooms. For every puzzle, one of you sees the **clue** (a mural, a note, a stained-glass window, chalk marks, a map) and the other has the **controls** (a dial lock, a keypad, buttons, levers, a dark maze). Neither can see the other's screen, so the only way out is talking. Inspired by *We Were Here* and *Portal 2*'s co-op. It's played at `/escape` in the [Games for Two](../../README.md) portal. Play it on a call.

## How to play

1. One of you opens **Escape Room for Two** from the portal and creates a room. Send the code or link (`/escape/CODE`).
2. The host starts. There are three rooms (📖 The Study, 🧪 The Lab, 🕸️ The Attic), each with 4 puzzles solved in order.
3. The banner says whether **you have the clue** (🗣️ describe it) or **the controls** (🎛️ ask what they see). It alternates every puzzle, and who goes first flips every room.
4. A wrong try is a ❌ mistake. Your score per room is the time plus 15 seconds for each mistake.

### The puzzles (different every game)

| Puzzle | Clue side | Controls side |
|---|---|---|
| 🔣 Dial lock | A mural with 4 symbols in order | 4 symbol dials and "Try the lock" |
| 🔢 Keypad | A note: "count these, in this order" (4 objects) | A cluttered shelf to count, and the keypad |
| 🎨 Colors | A stained-glass window (4–6 colors) | 4 colored buttons. A wrong press resets the sequence |
| ⚙️ Levers | Chalk marks like ✿ ✿ ♥ ♥ ♥ ✿ | 6 levers and a plaque: "✿ = up, ♥ = down" |
| 🌑 Dark maze | The map: walls, the exit 🚪 and where the walker 🔦 is | A blank grid: walk with arrow keys/WASD. A wall sends you back to the start |

## Run it

From the repository root, `npm install`, then `npm run dev`. Open http://localhost:5173/escape.

## Files

```
games/escape-room/          # @gfc/escape, built on the shared kit (../../kit)
├─ shared/index.ts          # symbols, colors, objects, rooms, puzzle + card types, action schema
├─ server/game.ts           # generators (incl. a perfect maze), actions, mistakes, room flow
├─ server/index.ts          # per-player cards (clue vs controls) + registerGame() (namespace /escape)
├─ server/__tests__/        # 8 unit tests
├─ client/Cards.tsx         # both sides of every puzzle
├─ client/screens.tsx       # Lobby, Play, Clear, Finish
└─ docs/spec.md
```

## Tests

```bash
npm test -w @gfc/escape
```

The tests cover:
- the generators: mazes are perfect with consistent walls, the shelf counts match the code, dials never start solved,
- the rules: alternating actors, only the actor acts, mistakes and resets, the maze bump,
- a full escape of all three rooms with roles flipping,
- redaction: the controls side never receives the answer, and the clue side never gets the controls.
