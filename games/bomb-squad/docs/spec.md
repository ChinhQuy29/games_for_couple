# Bomb Squad: Spec

## Rules

- **Phases:** LOBBY → ARMED → RESULT, then ARMED again (next bomb) or LOBBY (host's "Rematch", to change difficulty).
- **Start:** `startGame` flips a coin for the first Defuser and builds a bomb. `readyForNext` (both players) swaps the Defuser and builds a fresh bomb.
- **Bomb:** a serial (5 letters/digits ending in a digit), 0–4 batteries, and N modules: wires, button and symbols, plus Simon on Normal and the password on Hard, in a shuffled order. `endsAt = now + seconds`.
- **Module generation** guarantees exactly one answer:
  - Symbols: 4 symbols that appear together in exactly one manual column.
  - Password: 5 wheels of letters where exactly one manual word can be spelled.
  - Simon: 3–5 random flashes; stage starts at 1.
- **`bomb:act`** (Defuser only; the Expert gets `NOT_YOUR_ROLE`) returns `'ok' | 'strike' | 'solved'`:
  - `cut`: the solver's wire solves; any other wire strikes (and stays cut).
  - `press` / `release {shown}`: a release within `TAP_MS` (600ms) is a tap, otherwise a hold. Holding shows a random strip color; the release is correct only if the right action was used and, for a hold, `shown` (the timer text on the Defuser's screen) contains the strip's digit. Using the screen text keeps it fair with lag. `shown` is trusted only if it matches the server's own timer text within ±1.5s; otherwise the server uses its own time, so it can't be faked.
  - `symbol`: the next symbol in column order advances; a wrong one strikes and keeps the progress so far.
  - `simon`: the expected press is `simonMap(flash, hasVowel, strikes)` with the strike count **at the time of the press**. A wrong press strikes and clears the input for this stage.
  - `spin` / `submit`: the wheels turn freely; submitting anything but the answer strikes.
- **End:** all modules solved → `defused`. The third strike or `tick` at `endsAt` → `exploded` with cause `strikes` / `time`. A `BombResult` is recorded and the phase becomes RESULT.

## View

- The Expert never receives the bomb while it's armed (`bomb: null`). Both players see the strike count, modules solved/total, the deadline and the results.
- The manual is static text in the client bundle. It's an honor system: the Defuser's screen simply doesn't show it.

## Client

- The timer is rendered from `deadline` and the kit's `clockOffset`, every 200ms.
- The Simon pads replay the first `stage` flashes, then pause 1.8s, on a loop.
- A strike flashes the whole screen red (skipped with reduced motion).

## Kit

Built on the shared kit (`kit/`): rooms, join/resume, the per-room timer (`wakeAt`/`tick`), the lobby shell, home and join screens. See [kit/README.md](../../../kit/README.md).
