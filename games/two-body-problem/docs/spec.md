# Two-Body Problem: Spec

## Physics

`shared/physics.ts` is a copy of Tethered's (see [its spec](../../tethered/docs/spec.md)). This game uses one body, no grabbing and no chain. Games stay independent, so a fix to one copy doesn't silently change the other.

## Levels (`shared/levels.ts`)

- **Layout:** 32 × 18 tiles each, built from `[row, from, to, char]` specs plus single markers.
- **Tiles:**
  - `#` solid, `-` one-way, `^` spikes,
  - `D` a door (solid until the key is taken), `H` a gate (solid unless the button was touched in the last 5s),
  - markers: `S` start, `K` key, `B` button, `~` swap pad, `G` goal.
- **Movers:** level 5 has a horizontal ferry, level 6 a vertical lift. Each is a triangle wave over its period, a pure function of time.

## Rules (`server/game.ts`)

- **Phases:** LOBBY → PLAY → CLEAR, then PLAY on the next level (both ready), or FINISH after level 6. "Rematch" (host) goes back to LOBBY from CLEAR or FINISH.
- **Level start:** the Walker is `players[level % 2]`, so it alternates. A 2s countdown runs (the loop doesn't step before `startsAt`). The body spawns at `S`.
- **`input {left, right, jump}`** (quiet): each player's held keys. `combinedInput` takes left/right from the Walker and jump from the Jumper; everything else is ignored.
- **`step`** (30 Hz):
  1. carry a rider with its mover,
  2. step the body,
  3. check the marker tiles the body overlaps:
     - spikes or falling below the level → a death and a respawn (key reset, gate closed);
     - `K` → has the key;
     - `B` → the gate is open until t + 5s;
     - entering `~` (not standing on it) → swap Walker and Jumper;
     - `G` → CLEAR with time, deaths and swaps.
- **`level:retry`:** a death and a respawn.

## Network

Same as Tethered: the kit's 30 Hz `loop` sends a `frame` (`t`, body `[x, y, vx, vy, flags]`, key, gate seconds left, Walker id, deaths). Full states go out on deaths, keys, swaps and level ends.

## Client

- A canvas renders the level at the display's frame rate, interpolating frames.
- The body is two-tone: Walker's seat color on the bottom, Jumper's on top. A banner shows your job and animates when it swaps.
- Held keys are sent when they change; window blur releases them all. **R** retries.
