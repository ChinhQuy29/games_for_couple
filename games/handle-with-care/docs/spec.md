# Handle With Care: Spec

## Physics (`shared/physics.ts`)

- **Origin:** Tethered's platformer physics (see [its spec](../../tethered/docs/spec.md)), copied and generalised. Every `Body` has its own `w`/`h`, so the same collision code moves the players (0.7 × 0.9) and the furniture (up to 3 × 1.6).
- **`stepBody` options:** it takes `{speed, canJump}`, used for heavy carrying (`HEAVY_SPEED` 0.55, no jump).
- **No chain:** the chain constraint is dropped; this game has none.

## Houses (`shared/levels.ts`)

- **Layout:** 32 × 18 tiles each, built from specs: `#` solid, `-` one-way, `T` the truck zone (outside, right of the house wall), `S` start.
- **The door:** the house wall is columns 24–25, open on rows 12–15 (4 tall). The biggest carried item, the piano (1.6 tall over heads at 15.1), fits.
- **Valuables:** 10 kinds `{w, h, value, fragile, big}`. Each house lists its items as `[kind, x, floorRow]`.
- **The mansion's lift:** a vertical mover that pauses at both ends (a quarter of its 8s cycle each). Its bottom stop is one tile above the floor, so you can hop on.

## Rules (`server/game.ts`)

- **Phases:** LOBBY → MOVE → DONE, then MOVE in the next house (both ready), or FINISH after house 3. "Rematch" (host) goes back to LOBBY.
- **`input`** (quiet): `{left, right, jump, grab, throw}`. Grab and throw are edge-triggered on the server, by comparing with the previous step.
- **Grab (E):** if holding something, let go. A small item keeps 60% of your speed when you put it down. Otherwise, take the nearest item within `REACH` (1.3 tiles, centre to centre; for big items, distance to anywhere along its width) that still has a free hand slot: 1 for small, 2 for big.
- **Throw (F):** small items only. vx = facing × 9 (+30% of your speed), vy = −7.
- **Step** (30 Hz, after the countdown):
  1. movers carry riders: players and loose items;
  2. buttons;
  3. players step; heavy means slow and no jump. A lone holder of a big item who walks more than reach + 0.5 away lets go;
  4. items:
     - **carried** (small, or big with 2 holders): moved toward overhead (centred on the holders' mean x, above the higher head) through collision. A bump while moving faster than 3 costs 0.08 × fragile (0.6s cooldown). Snagging more than 1.2 tiles off target, or two holders further apart than `w + 1.4`, drops it;
     - **loose:** gravity and friction. Landing faster than 9 costs (vy − 9) × 0.05 × fragile; hitting a wall faster than 6 costs 0.06 × fragile;
     - hp ≤ 0 → broken (released). Loose, resting, centre in the truck → delivered for `round(value × hp)`.
  5. Time up, or nothing left in the house → DONE.
- **Broadcasts:** `step` returns true (full broadcast) when holdings, item states or the feed change.

## Network

- **Frames:** `{t, b: [x, y, flags], i: [id, x, y, hp%], earned, left}` at 30 Hz.
- **Static item info** (kind, state, holders) goes out in full states.

## Client

- **Canvas** (`Stage.tsx`): the house tiles, the truck zone, the lift, each valuable drawn by kind with a health bar once damaged, and the movers. Arms go up while carrying.
- **Item strip:** shows each item's status (🤲 small, 🫂 big, 🚚 delivered, 💔 broken).
