# Ghost Hunt: Spec

## The house

`shared/map.ts` builds a 30×18 grid from 8 room rectangles (nursery, bedroom, bathroom, study, hallway, kitchen, dining, living), 10 doorways (including side doors that make loops), 6 closets and the front door (`E`). The Explorer starts next to the door in the living room. `roomAt` maps a tile to its room (doorways are in no room).

- **Line of sight:** Bresenham; walls block, but the wall at the end is visible.
- **Visible tiles:** the 8 around you, plus a cone 7 tiles long with an 80° spread in the direction you face, with line of sight.
- **Pathfinding:** BFS `nextStep`, used by the ghost.

## Rules

- **Phases:** LOBBY → HUNT → RESULT, then HUNT again with roles swapped (both ready) or LOBBY (host's "Rematch").
- **Setup** (`beginGame`): a random ghost type (8) and ghost room (not the hallway or living room).
  - With handprints, 2 random doorways of the ghost room carry prints.
  - Room temperatures: 15–19°C, the ghost room 7°C, or −3°C with freezing.
  - 10 minutes on the clock.
- **`move {dir}`** (Explorer only): always turns you; steps at most every 150ms (faster ones are ignored, not errors); walls block. Stepping on `E` needs a calm house (`LOCKED`) and a journal guess (`NO_GUESS`), then ends the game: `escaped` if the guess is right, else `wrong`.
- **`tool {tool}`** (Explorer only):
  - `uv` toggles UV.
  - `hide` works only on a closet tile, and toggles.
  - `spiritbox` has a 2.5s cooldown and costs 1 sanity. In the ghost room, with that evidence, it answers 45% of the time; otherwise static.
  - `book` (inside a room) moves the one book. In the ghost room with writing, it gets written 8–20s later.
  - `camera` (inside a room, one per room, max 2; a third moves the oldest).
- **`journal {mark?, guess?}`** (either player): evidence marks are `yes | no | null`; the guess is a ghost type or null.

## Simulation (every 200ms)

- **Sanity:** −0.055 per tick, plus −0.2 within 3 tiles of the ghost (×2 for a Phantom) unless hidden.
- **Hunts:** every 10s while calm, if sanity < the ghost's threshold, roll its hunt chance. A warning (3s) comes first, then the hunt (15s), then a 20s cooldown.
- **Ghost movement:**
  - hunting a visible Explorer: one BFS step toward them every tick (a Wraith sometimes takes 2);
  - otherwise it wanders every 3 ticks, mostly inside its room (Banshee leaves often, Jinn rarely) and heads back when outside.
  - Reaching the unhidden Explorer during a hunt → `caught`.
- **Instruments** (once a second, for the Explorer's room, or their last room when in a doorway):
  - EMF: in the ghost room, 5 with 35% chance if it has EMF, else 2–4; within 3 tiles, 2–3; else 1.
  - Temperature: the room's base ±1.
- **Spooky events** go to the feed (more for a Poltergeist).
- At `endsAt` → `timeout`.

## Redaction

- **Explorer:**
  - only the visible tiles (index → char);
  - the ghost's position only while it hunts and is in sight;
  - the book's written state only when the book is in sight;
  - handprints only with UV on and in sight;
  - no EMF, temperature or camera feed.
- **Navigator:** the full map, the Explorer's position and facing, cameras with `orbs` and `motion`, the book's position, and the readings. Never the ghost's position, type or room.
- Both see sanity, hunt status, the feed, the journal and the results. The ghost type and room appear only in the results.

## Client

- Both maps are SVGs at 32 units per tile, width-capped to fit the screen next to a 320px sidebar.
- The Explorer's client keeps a memory of seen tiles (reset each game).
- Keys repeat every 160ms while held; the server rate limit is 150ms.
- A hunt adds a pulsing red vignette; the warning flickers.
