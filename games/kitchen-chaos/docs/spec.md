# Kitchen Chaos: Spec

## Rules

- **Phases:** LOBBY → SHIFT → SUMMARY, then SHIFT again (both press "next shift"; sides swap, same level) or LOBBY (host's "Rematch", to change the level).
- **Start:** a coin flip picks the prep player. `startsAt = now + 3s`, `endsAt = startsAt + 180s`, and the first order arrives 1.5s after the start. Clicks before `startsAt` fail with `TOO_EARLY`.
- **Kitchen** (`buildKitchen(level)`): one crate per ingredient the level's recipes need, 2 boards and a trash can (prep); 3 pass slots (both); 3 stoves, the plate stack, 2 counters, the serving window and a trash can (cook). Using the other side's station fails with `WRONG_SIDE`.
- **Hands:** each player holds one `Item` (ingredient + chopped/cooked/burnt) or one `Plate` (up to 4 items).
- **`kitchen:click {station}`:**
  - Crate: empty hands take a fresh raw item. Holding the same raw item puts it back.
  - Board: only a raw, choppable, uncooked item can go down. While it's unchopped, empty-handed clicks chop (5 clicks). Once chopped, it acts like a counter.
  - Pass and counter: put down, pick up, or combine. A plate here plus an item in hand puts the item on the plate; a plate in hand plus an item here scoops it up. Burnt items can't go on a plate.
  - Stove: only cookable, uncooked items go on (`cookStart = now`). Before 7s it's `COOKING`. From 7s it's cooked, and from 15s it's burnt (`stoveState`). After that it acts like a counter.
  - Plates: empty hands take a plate; an empty plate goes back.
  - Trash: drops an item, or empties a plate (you keep the plate).
  - Serve: a plate that exactly matches an order (`plateMatches`, any order of parts) serves the oldest matching order: `parts × 10 + ceil(10 × patience left)` coins. Anything else fails with `NOT_ORDERED`. With no orders left, the next one comes within 2s.
- **Tick** (`wakeAt` = the earliest of shift end, next order, order expiry, a stove finishing or burning):
  - stoves settle (cooked / burnt, counted in `burnt`),
  - expired orders cost 10 (floor 0),
  - a new order spawns if there's room (`maxOrders`), with no three of the same dish in a row,
  - at `endsAt` the shift ends with stars from the level's thresholds.

## View

Everything is public, so both players see the whole kitchen, both hands and the tickets. The view adds `mySide`, and the kit's `deadline` is `endsAt`.

## Client

- Server time comes from the kit's `clockOffset`, updated every 100ms for the cooking and patience bars.
- Station tiles use container-query units (`cqw`) so the emoji and labels scale with the tile.
- The other side's stations are visible but dimmed and disabled.

## Kit

Built on the shared kit (`kit/`). See [kit/README.md](../../../kit/README.md).
