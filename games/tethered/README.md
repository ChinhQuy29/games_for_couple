# ⛓️ Tethered

Two climbers, one short chain, one tall tower. Each of you controls your own climber, but you're chained 3.5 tiles apart: jump too far ahead and you yank your partner off the ledge, slip and you drag them down with you. Hold on, anchor, swing, scream. Inspired by *Chained Together* and *PEAK*. It's played at `/tethered` in the [Games for Two](../../README.md) portal. You need a keyboard.

## How to play

1. One of you opens **Tethered** from the portal and creates a room. Send the code or link (`/tethered/CODE`).
2. The host starts the climb. After a 3-2-1 you're both at **Base camp**.
3. Controls:
   - **A/D** or **←/→**: move.
   - **W**, **↑** or **Space**: jump. Let go early for a small hop.
   - **S**, **↓** or **Shift** (hold): **grab** the floor or a wall. While grabbing you don't move, so you're an **anchor** for your partner, but it drains **stamina** (the yellow bar). Jump while holding onto a wall to climb off it (costs stamina).
4. The chain is red when it's taut.
5. Get to the 🏁 at the top.

### The tower

- **Wooden planks:** jump up through them, land on top.
- **Rock:** solid.
- **Cracked blocks:** crumble 0.6s after someone stands on them, and come back 4s later.
- **Blue platforms:** move back and forth or up and down.
- **Spikes:** count as a fall.
- **Flags 🏳️ → 🚩:** checkpoints (Camp 1, 2, 3). Fall more than 9 rows below your last camp (or touch spikes) and you both go back to it.

The summit screen shows your time, falls and "yanks" (hard chain pulls), and a drama verdict. **Climb again** to beat your best time.

## Run it

From the repository root, `npm install`, then `npm run dev`. Open http://localhost:5173/tethered.

## Files

```
games/tethered/             # @gfc/tethered, built on the shared kit (../../kit)
├─ shared/physics.ts        # platformer physics: tiles, one-way, movers, grabbing, the chain
├─ shared/level.ts          # the tower (built from platform specs), checkpoints, movers
├─ shared/index.ts          # room, frame and view types, input schema
├─ server/game.ts           # the climb: stepping, crumbles, falls, checkpoints, summit
├─ server/index.ts          # view + registerGame() with a 30 Hz loop (namespace /tethered)
├─ server/__tests__/        # 14 unit tests
├─ client/                  # TetheredApp, Tower (canvas renderer), screens
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
- the climb: the countdown, crumbling, falls and spikes, checkpoints, the summit and climbing again, per-player input.
