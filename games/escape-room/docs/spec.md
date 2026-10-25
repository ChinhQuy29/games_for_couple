# Escape Room for Two: Spec

## Rules (`server/game.ts`)

- **Phases:** LOBBY → PLAY → CLEAR, then PLAY of the next room (both ready), or FINISH after room 3. "Rematch" (host) goes back to LOBBY.
- **Rooms** (`ROOMS`):
  - The Study: dial, code, colors (4), levers.
  - The Lab: code, maze (5×5), colors (5), dial.
  - The Attic: maze (6×6), levers, code, colors (6).
- **Actors:** a coin flip picks the first actor. Puzzle *i* is acted on by `(firstActor + i) % 2`, and `firstActor` flips every room.
- **Puzzles** are solved strictly in order. `currentIndex` is the first unsolved one.
- **Generators** (randomized):
  - **dial:** 4 distinct symbols out of 10; the dials never start on the answer.
  - **code:** 6 of 10 objects with counts 1–9, scattered on an 8×8 cell grid (no overlap). The order is the first 4 objects, and the answer is their counts.
  - **colors:** a sequence of the room's length.
  - **levers:** 6 up/down values (never all down) and a random two-symbol legend.
  - **maze:** a DFS perfect maze, with the start and exit in opposite corners.
- **`puzzle:act`** (only the actor; the other gets `NOT_YOURS`):
  - `spin` / `tryDial`; `code` (a wrong code is a mistake); `color` (correct advances, wrong resets progress and is a mistake); `lever` / `tryLevers`.
  - `move`: a wall sends the walker back to the start, clears the trail and is a mistake; reaching the exit solves it.
- **Room done:** the last puzzle solved → CLEAR with `{ms, mistakes}`. Score = ms + 15s × mistakes.
- **Flash:** every solve or mistake sets `flash {id, good, text}`, shown briefly on both screens.

## View (`server/index.ts`)

- `cardFor(puzzle, seat)` gives the clue side or the controls side, never the answer:
  - **dial:** mural vs. dials;
  - **code:** object order vs. the shelf plus the code length;
  - **colors:** the window vs. the length and progress;
  - **levers:** the symbol pattern vs. the legend and the lever states;
  - **maze:** walls, exit and position vs. size, position and trail.
- Only the current puzzle and solved ones carry a card; future puzzles show only their kind.

## Client

- `Cards.tsx` has one view per (kind, role). The dark maze also takes arrow keys or WASD.
- The header shows the room, time, mistakes, and a 4-step progress strip.
