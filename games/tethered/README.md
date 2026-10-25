# ⛓️ Tethered

Two climbers, one short chain, one tall tower. Each of you controls your own climber, but you're chained 3.5 tiles apart: jump too far ahead and you yank your partner off the ledge, slip and you drag them down with you. Hold on, anchor, swing, scream. Inspired by *Chained Together* and *PEAK*. It's played at `/tethered` in the [Games for Two](../../README.md) portal. Play with a keyboard, or on a phone with on-screen buttons.

## How to play

1. One of you opens **Tethered** from the portal and creates a room. Send the code or link (`/tethered/CODE`).
2. The host picks a **tower** and starts the climb. After a 3-2-1 you're both at **Base camp**.
3. Controls:
   - **A/D** or **←/→**: move.
   - **W**, **↑** or **Space**: jump. Let go early for a small hop.
   - **S**, **↓** or **Shift** (hold): **grab** the floor or a wall. While grabbing you don't move, so you're an **anchor** for your partner, but it drains **stamina** (the yellow bar). Jump while holding onto a wall to climb off it (costs stamina).
   - **📱 Phones and tablets:** on-screen buttons appear (◀ ▶ on the left, ✋ grab and ⏫ jump on the right). Hold several at once. Sideways is best: the tower fills the screen and the buttons sit at the sides. Upright, the buttons go under the game.
4. The chain is red when it's taut.
5. Get to the yellow ⭐ flag at the top.

### The towers

| Tower | Look | What it is |
|---|---|---|
| 🌿 Classic | grassy hills | The original hand-built climb |
| ❄️ Frozen Peak | snow and clouds | A tall generated tower |
| 🏜️ Desert Cliffs | sand and cacti | A generated tower |
| 🍄 Mushroom Caves | purple mushroom land | The tallest generated tower |
| 🎲 Random tower | any theme | A brand-new tower every climb |

The generated towers are built so they're always climbable: every step is at most 3 rows up and 2 tiles across. Lifts carry you 6 rows up, and ferries slide across wide gaps. They always have three camps.

### What's on the way

- **Thin ledges:** jump up through them, land on top.
- **Solid ground:** solid.
- **Wooden crates:** crumble 0.6s after someone stands on them, and come back 4s later.
- **Floating platforms (with a chain on top):** move back and forth or up and down.
- **Spikes:** count as a fall. Hop over them.
- **Flags (grey → waving green):** camps (checkpoints). Fall more than 9 rows below your last camp (or touch spikes) and you both go back to it.

The summit screen shows your time, falls and "yanks" (hard chain pulls), and a drama verdict. **Climb again** to beat your best time.

### Art

The tiles, backgrounds, characters and flags are from Kenney's free **New Platformer Pack** (CC0, public domain): see `client/assets/CREDITS.md`.

## Run it

From the repository root, `npm install`, then `npm run dev`. Open http://localhost:5173/tethered.

## Files

```
games/tethered/             # @gfc/tethered, built on the shared kit (../../kit)
├─ shared/physics.ts        # platformer physics: tiles, one-way, movers, grabbing, the chain
├─ shared/level.ts          # the towers: Classic (hand-built) and the seeded generator
├─ shared/index.ts          # room, frame and view types, input schema
├─ server/game.ts           # the climb: stepping, crumbles, falls, checkpoints, summit
├─ server/index.ts          # view + registerGame() with a 30 Hz loop (namespace /tethered)
├─ server/__tests__/        # 17 unit tests
├─ client/Tower.tsx         # the canvas renderer (Kenney sprites, parallax, decorations)
├─ client/sprites.ts        # loads client/assets/*.png
├─ client/assets/           # the Kenney CC0 images we use, with CREDITS.md
├─ client/screens.tsx       # Lobby (tower choice), Climb (with touch buttons), Summit
└─ docs/spec.md
```

## Tests

```bash
npm test -w @gfc/tethered
```

The tests cover:
- the physics: landing, walls, jump height, one-way platforms,
- the chain: its length limit, anchoring, dragging,
- the tower: size, camps on solid ground, no head bonks, the movers,
- the climb: the countdown, crumbling, falls and spikes, checkpoints, the summit and climbing again, per-player input,
- generated towers: every route step reachable (≤3 up, ≤2 across, lifts 6), camps and the summit on ground, no head bonks, over the 3 named towers and 60 random seeds,
- the tower choice, and a new random tower every climb.
