# 🕹️ Two-Body Problem

One character, two players. One of you can only **walk**, the other can only **jump**, so every gap needs a "three, two, one, NOW!". Swap pads trade your jobs halfway through a level. Inspired by *It Takes Two* and *Pico Park*. It's played at `/two-body-problem` in the [Games for Two](../../README.md) portal. You need a keyboard.

> **Who goes first:** in the lobby, the host picks who walks on the first level: 🎲 random, themselves, or their partner. Roles still swap after that.

## How to play

1. One of you opens **Two-Body Problem** from the portal and creates a room. Send the code or link (`/two-body-problem/CODE`).
2. The host picks a starting level (all 6 are open) and starts. After a 2-second countdown, the banner shows your job:
   - **👟 Walker:** A/D or ←/→.
   - **🦘 Jumper:** W, ↑ or Space. Hold for a higher jump, tap for a hop.
3. The character is two-tone: the bottom half is the Walker's color, the top half the Jumper's.
4. Things in the levels:
   - **⇄ swap pad:** you trade jobs (once per visit).
   - **🔑 key:** opens the 🔒 purple doors.
   - **🔘 button:** opens the green gates for 5 seconds.
   - **Red spikes, or falling off:** back to the start (and the key is lost).
   - **⭐:** the goal.
5. **R** (or the Retry button) restarts the level if you're stuck. It counts as a death.
6. Who walks first alternates every level. After the last level you get your total time and deaths. The host can start at any level.

| # | Level | What's new |
|---|---|---|
| 1 | First steps | walking + jumping, spikes, a step |
| 2 | Get the key | one-way platforms, a key and a door |
| 3 | Swap! | a swap pad and a staircase |
| 4 | Hold the gate | a button and a timed gate |
| 5 | All aboard | a moving platform over a spike pit |
| 6 | The two-body problem | a lift, key, swap, button, gate and door, all at once |
| 7 | Stairway ❄️ | the floor is all spikes: four jumps up a staircase |
| 8 | Locked in 🍄 | one-way ledges up to the key, a spike pit, the door |
| 9 | Sprint 🏜️ | the button is up high: drop and run before the gate shuts |
| 10 | The ferry 🌲 | swap first, then ride a raft over a long spike river |

Each level has its own look (grass, snow, sand, mushroom land or forest). The tiles, backgrounds, keys, locks, switches and flags are from Kenney's free **New Platformer Pack** (CC0, public domain): see `client/assets/CREDITS.md`.

📱 **On a phone or tablet**, on-screen buttons appear for your job: ◀ and ▶ under your thumbs for the Walker, a jump button for the Jumper. Sideways is best: the level fills the screen and the HUD shrinks to a strip.

## Run it

From the repository root, `npm install`, then `npm run dev`. Open http://localhost:5173/two-body-problem.

## Files

```
games/two-body-problem/     # @gfc/twobody, built on the shared kit (../../kit)
├─ shared/physics.ts        # platformer physics, copied from Tethered (games stay independent)
├─ shared/levels.ts         # the 10 levels (built from specs) and their themes, movers, gate time
├─ shared/index.ts          # room, frame and view types, schemas
├─ server/game.ts           # levels, combined input, keys/doors/gates/swaps, deaths, goal
├─ server/index.ts          # view + registerGame() with a 30 Hz loop (namespace /twobody)
├─ server/__tests__/        # 14 unit tests, including scripted runs through levels 1, 6, 7, 8, 9 and 10
├─ client/                  # TwoBodyApp, Stage (canvas renderer with Kenney sprites), screens
├─ client/assets/           # the Kenney CC0 images we use, with CREDITS.md
└─ docs/spec.md
```

## Tests

```bash
npm test -w @gfc/twobody
```

The tests cover:
- the level data (size, start, goal, keys for doors, buttons for gates),
- the input mapping (Walker = left/right, Jumper = jump),
- the countdown, spikes and respawn, swap pads, keys and doors, the gate timer,
- the level flow (clear → next, swap who walks → finish), the view,
- scripted runs that finish levels 1, 6, 7, 8, 9 and 10 with only the two half-controls.
