# Tethered: Spec

## Physics (`shared/physics.ts`)

- **Units and constants:** tile units; a fixed step of `dt = 1/30` s. Gravity 40, run speed 7 (acceleration 60 on the ground, 35 in the air), jump speed 17 (a ~3.6-tile jump), max fall speed 22. The body is 0.7 × 0.9 tiles.
- **Movement:** axis-separated: move X and resolve against solid tiles, then move Y.
  - Falling lands on solid tiles, on one-way tiles (only if the previous bottom was above them), and on moving platforms (which set `riding`).
- **Jump:** edge-triggered with a 0.12s buffer and 0.1s coyote time. Releasing jump while still rising fast cuts the jump short.
- **Grab** (held): allowed when standing or touching a wall, with stamina left.
  - It freezes the body and drains 25 stamina/s (max 100). Standing without grabbing regains 30/s.
  - Jump while grabbing releases. Off a wall, that's a climb costing 15 stamina.
- **Chain** (`applyChain`), with length 3.5 between centers, up to 3 iterations:
  - when stretched, the excess is split 50/50, or all of it goes to the other body if one is grabbing (an anchor);
  - the correction moves through `moveBody`, so nobody is pulled through walls;
  - the velocity component that stretches the chain is removed.

## Towers (`shared/level.ts`)

- **`getTower(id, seed)`:** id 0 is Classic (hand-built, below). 1–3 are generated from fixed seeds (Frozen Peak: snow, 78 rows; Desert Cliffs: sand, 72; Mushroom Caves: purple, 84). 4 is random: the seed is new each climb, with a random theme and height 66–84.
- **The generator** (`generateTower`) builds bottom-up from the full-width ground:
  - an ordinary step is 3 rows up, width 3–6, beside the previous platform with a 0–2 tile gap, zig-zagging off the walls. A step is solid or crumbling only if `canBeSolid` (nothing 2–3 rows straight below), otherwise one-way. Wide solid ledges sometimes get a spike in the middle;
  - a lift (14%) is a vertical mover beside the platform, from its row up 6, with the next platform beside the lift's top;
  - a ferry (12%) is a horizontal mover one step up that crosses 6 tiles to a landing on the same row;
  - camps: when the route passes 72%, 46% and 22% of the height, a 6-wide solid (or one-way) platform with a flag;
  - the summit: a 5-wide solid ledge with the flag above it.
  - The route is returned for tests.
- **Room state:** `towerId` (host's lobby choice, `settings:update`) and `towerSeed` (set at each climb for the random tower). Server and clients both call `getTower(towerId, towerSeed)`.

## Classic

- **Layout:** 24 × 72 tiles built from platform specs, with each step up 3 rows. No solid (`#`/`x`) tile has another platform 2–3 rows directly below it, so climbs never bonk (a test checks this).
- **Checkpoints:** Base camp, Camp 1 (row 50), Camp 2 (row 26), Camp 3 (row 8). The summit flag is at (6, 1).
- **Movers:** a horizontal one at row 44 (x 3→9) and a vertical lift at x 11 (rows 35→29). They move as a triangle wave over their period, so their position is a pure function of time.
- **Crumbling blocks** (`x`): they start crumbling when stood on, are gone 0.6s later, and return after 4s.

## Rules (`server/game.ts`)

- **Phases:** LOBBY → CLIMB → SUMMIT, then CLIMB again (both ready) or LOBBY (host's "Rematch").
- **`step`** (30 Hz through the kit's loop, after `startsAt`):
  1. carry riders with their mover,
  2. step both bodies with their held input,
  3. apply the chain (a hard pull counts as a "yank"),
  4. update crumbles,
  5. check spikes (→ fall), checkpoint flags (within 1.6 × 1.2 tiles), and the summit (→ SUMMIT with time, falls and yanks),
  6. a fall happens when both bodies are more than 9 rows below the camp, or one is 13 below. Both respawn at the camp.
- **`input`** is a quiet action (no full broadcast): the held keys `{left, right, jump, grab}`.

## Network

- The kit's `loop` emits a `frame` after each step: the sim time, per body `[x, y, vx, vy, flags, stamina]` rounded to 0.01, the crumbled tiles, falls, yanks and the checkpoint. That's about 150 bytes, 30 times a second.
- A full `room:state` goes out only on falls, checkpoints, the summit and lobby changes.

## Client

- A canvas renders at the display's frame rate, interpolating between the last two frames. Movers are computed from the interpolated sim time.
- The camera follows the pair's midpoint with easing. The sky warms as you climb.
- Held keys are sent when they change; window blur releases them all.
