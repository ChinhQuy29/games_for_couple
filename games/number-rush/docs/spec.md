# Number Rush: Spec

## Rules

- **Phases:** LOBBY → PLAY → RECAP.
- **Start:** `startGame` builds the board and the target sequence, then sets `startsAt = now + 3s`. Clicks before that are rejected (`TOO_EARLY`).
- **Board:** 1..count is placed on a jittered grid with `cols = ceil(sqrt(count · 1.6))` and `rows = ceil(count / cols)`. Each number takes one random cell, so numbers never overlap. Chaos style varies size (32–62% of a cell), rotation (±35°) and color.
- **Sequence:** ascending, descending, or a shuffle. The current target is `sequence[index]`.
- **`pick {n, ms}`:**
  - A wrong number sets `lockedUntil[player] = now + 1.5s` and returns `'wrong'`.
  - An already-found number returns `'late'`, with no penalty.
  - The right number adds a claim with `ms` clamped to `[serverMs − 3000, serverMs + 1500]`, where `serverMs = now − targetSince`. The first claim opens `pending.closesAt = now + 350ms`.
- **Resolve:** when both players have claimed, or at `closesAt` (via `wakeAt`/`tick`), the lowest `ms` wins (ties go to the first claim). The score goes up, the finder is recorded, `index` moves on, and `targetSince` resets. The last number leads to RECAP.

## View

Everything is public (it's a race on a shared board) except each player's own lock time.

## Client

- The board is an SVG in world units (1600×1000), width-capped so it fits a laptop screen.
- The reaction time is `Date.now() − shownAt`, where `shownAt` is when this target first rendered on this device, or the local countdown end for the first target.

## Kit

This is the first game on the shared kit (`kit/`): rooms, join/resume, timers, the lobby shell, home and join screens. See [kit/README.md](../../../kit/README.md).
