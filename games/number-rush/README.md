# 🔢 Number Rush

Every number from 1 to 100 is scattered on one board. You both hunt for the same number at the same time: whoever clicks it first gets the point, and you move on to the next one. Most numbers when the board is empty wins. It's played at `/rush` in the [Games for Two](../../README.md) portal. It's designed for laptops.

## How to play

1. One of you opens **Number Rush** from the portal and creates a room. Send the code or link (`/rush/CODE`).
2. The host picks the settings and starts. After a **3-2-1** countdown, the big yellow box shows the number to **Find**.
3. Click it on the board before your partner does. Found numbers fill with the finder's color: 🩷 player 1, 🩵 player 2.
4. A **wrong click locks you out for 1.5 seconds** (🔒), so guessing by spam-clicking doesn't pay. Clicking a number that's already found is harmless.

### Settings (host only)

| Setting | Options |
|---|---|
| How many numbers | 30, 50 or **100** |
| Order | **⬆️ 1 → 100**, ⬇️ 100 → 1, or 🎲 random (you both still see the same target) |
| Board style | 😌 calm (same size, upright, one color) or **🌀 chaos** (random sizes, angles and colors) |

The recap shows the winner and each player's count, fastest find, average time and best streak, plus the board colored by who found what.

## Fair across a long distance

If you both click the right number at about the same moment, the one whose click reached the server first shouldn't automatically win, because one of you may have a slower connection. So:

1. Each device times its own reaction from the moment the target appeared on that screen.
2. The first correct click opens a **0.35s photo finish**. If the other player's correct click arrives in that window, the **faster device-timed reaction wins**.
3. The server only trusts a device's timing within a lag window: at most 3s faster or 1.5s slower than what it saw itself. Nobody can claim a 0ms reaction.

## Run it

From the repository root, `npm install`, then `npm run dev`. Open http://localhost:5173/rush.

## Files

```
games/number-rush/          # @gfc/rush, built on the shared kit (../../kit)
├─ shared/index.ts          # types, settings, timing, zod schemas
├─ server/game.ts           # rules: board layout, sequences, picks, photo finish
├─ server/index.ts          # view + registerGame() wiring (namespace /rush)
├─ server/__tests__/        # 9 unit tests
├─ client/                  # RushApp, Board (SVG), screens (Lobby, Play, Recap)
└─ docs/spec.md
```

## Tests

```bash
npm test -w @gfc/rush
```

The tests cover:
- the board (every number once, inside the board, no overlaps),
- the three orders,
- the countdown, wrong-click lock, harmless re-clicks,
- the photo finish (both claims, a lone claim, impossibly fast claims),
- a full game to RECAP and rematch,
- the view (no tokens, only my own lock).
