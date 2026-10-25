# Project Memory — Games for Couple

Running log of what has been built, decisions made, and what's next.
**Update this file at the end of every work session** (newest entry on top in the Log).

---

## What this project is

A portal of silly, real-time two-player web games for a long-distance couple. Each person plays on their own phone or laptop, usually while they're on a call together. The goal is laughter, not hard competition.

- **Portal home:** `/`. Lists every game from `shared/src/games.ts`.
- **Game #1: Finish My Sentence** at `/fms`, in `games/finish-my-sentence/` (package `@gfc/fms`). Docs: [README](games/finish-my-sentence/README.md), [spec](games/finish-my-sentence/docs/spec.md).
- **Game #2: Jjinja Battle** at `/jjinja`. A mic-scoring "jjinja?!" (찐짜) shouting battle the user built earlier as its own project. It now lives in `games/jjinja-battle/` (see its README).
- **Game #3: Telephone Doodle** at `/doodle`, in `games/telephone-doodle/` (package `@gfc/doodle`). Docs: [README](games/telephone-doodle/README.md), [spec](games/telephone-doodle/docs/spec.md).
- **Game #4: Would You Rather: Unhinged** at `/wyr`, in `games/would-you-rather/` (package `@gfc/wyr`). Docs: [README](games/would-you-rather/README.md), [spec](games/would-you-rather/docs/spec.md).
- **Game #5: Fan Cứng AOG** (Liên Quân/AOG trivia) at `/aog`, in `games/aog-trivia/` (package `@gfc/aog`). Docs: [README](games/aog-trivia/README.md), [spec](games/aog-trivia/docs/spec.md).
- **Game #6: Hide and Seek** (prop hunt) at `/hns`, in `games/hide-and-seek/` (package `@gfc/hns`). Docs: [README](games/hide-and-seek/README.md), [spec](games/hide-and-seek/docs/spec.md).
- **Game #7: Number Rush** at `/rush`, in `games/number-rush/` (`@gfc/rush`), the first game on the shared **kit** (`kit/`, `@gfc/kit`).
- **Game #8: Bomb Squad** (co-op, KTANE-style) at `/bomb`, in `games/bomb-squad/` (`@gfc/bomb`). The first of 5 co-op games planned in [docs/coop-games-plan.md](docs/coop-games-plan.md).
- **Game #9: Kitchen Chaos** (co-op, Overcooked-style) at `/kitchen`, in `games/kitchen-chaos/` (`@gfc/kitchen`).
- **Game #10: Ghost Hunt** (co-op, Phasmophobia-style) at `/ghost`, in `games/ghost-hunt/` (`@gfc/ghost`).
- **Game #11: Tethered** (co-op, Chained Together/PEAK-style platformer) at `/tethered`, in `games/tethered/` (`@gfc/tethered`).
- **Game #12: Two-Body Problem** (co-op, It Takes Two/Pico Park-style: one body, walker + jumper) at `/two-body-problem`, in `games/two-body-problem/` (`@gfc/twobody`). It replaced the old coming-soon card.
- **Game #13: Moving In** (two-player Dreamy Room/Unpacking) at `/moving-in`, in `games/moving-in/` (`@gfc/movingin`).
- **Game #14: Escape Room for Two** (We Were Here-style) at `/escape`, in `games/escape-room/` (`@gfc/escape`). The first of 5 from [docs/couple-games-plan-2.md](docs/couple-games-plan-2.md).
- **Game #15: Handle With Care** (R.E.P.O.-style) at `/carry`, in `games/handle-with-care/` (`@gfc/carry`).
- **Game #16: Road Trip** (RV There Yet?-style) at `/road-trip`, in `games/road-trip/` (`@gfc/roadtrip`).
- **Game #17: Codenames Duet** at `/codenames`, in `games/codenames-duet/` (`@gfc/duet`).
- **Game #18: Paint & Hide** (Meccha Chameleon-style) at `/paint-hide`, in `games/paint-hide/` (`@gfc/paint`). The last of the 5 from couple-games-plan-2.
- **GitHub:** https://github.com/ChinhQuy29/games_for_couple (branch `main`).

## Current status (2026-10-25)

**Playable games: 18.** The 7 earlier games, Number Rush, the 5 co-op games from [docs/coop-games-plan.md](docs/coop-games-plan.md), Moving In, and the 5 from [docs/couple-games-plan-2.md](docs/couple-games-plan-2.md): Escape Room for Two, Handle With Care, Road Trip, Codenames Duet and Paint & Hide. All of these newer games are built on the shared kit (`kit/`) and have unit tests; each was play-tested in two browser tabs at 1280×800.

- **What two tabs couldn't verify:** the physics/real-time games (Tethered, Two-Body, Handle With Care, Road Trip) need two real people on two keyboards to judge feel and difficulty. Two-Body's levels 1 and 6 are proven finishable by scripted tests, and Tethered's first jumps by a headless simulation. Tuning knobs are in `shared/physics.ts` (`PHYS`) and the level specs.
- **Only coming-soon card left:** Blind Portrait Duel.


**Jjinja Battle:** fully working as imported (classic and rally modes, bot opponent, random matchmaking, camera/WebRTC with a TURN relay, match recording, highlight clips, safety and rate limits). It's served by the shared server at `/jjinja`. Verified in two tabs: invite link, join and WebSocket. Not verified here: the mic and camera, since the browser pane blocks them.

**Telephone Doodle:** playable end to end (prompt deck or your own, 2 parallel chains, 7 chaos rules, synced reveal with stroke replay, gallery). Verified in two tabs with real mouse drawing. 13 unit tests.

**Would You Rather: Unhinged:** playable end to end (secret pick + prediction, debate on disagreement, write-your-own turns, recap with match rate, verdict, reads and hot takes). Verified in two tabs over a full 10-question game. 13 unit tests.

**Fan Cứng AOG:** playable end to end (VI/EN per player, simultaneous answers with device-timed speed, clue questions revealed by the server, SGP Special ×2 finale, streak banners, Liên Quân ranks, 🚩 report). Verified in two tabs over a full game plus a clue question. 16 unit tests. **The 70 questions are sourced but NOT checked by a fan yet**: the user chose to skip checking for now.

**Hide and Seek:** playable end to end (3 maps, hiding with drag/rotate/resize, hunter curtain, 5 shots with prop reactions, taunt wiggle, sneak moves, reveal, recap). Verified in two tabs at a laptop size (1280×800) over a full 2-round game:
- the timeout and survive path, and a found-on-the-first-shot path,
- a real-mouse hide, rotation, shot and sneak,
- the hunter's page holding no room data while hiding.

13 unit tests.

**Finish My Sentence milestones:**

| Milestone (see spec §11) | Status |
|---|---|
| M0 Scaffold | ✅ done |
| M1 Rooms & lobby | ✅ done |
| M2 Core loop (all 3 modes) | ✅ done, verified in two browser tabs |
| M3 Timers & resilience | ✅ mostly done: countdown, auto-submit, AFK and deck fallbacks, disconnect banner, reload resume. Not done: `FMS_TIMER_SCALE` test hook |
| M4 Fun layer | 🟡 partial: visual style, reveal animation with shake, modifiers, live reactions, typing indicator and waiting blob are done. **TODO:** sound effects (Web Audio), TTS narrator, confetti, mute toggle |
| M5 Keepsakes | 🟡 partial: ratings, awards and rematch are done. **TODO:** Hall of Fame (localStorage), save-as-image (`html-to-image`) |
| M6 Polish & ship | 🟡 deploy path now exists (DEPLOY.md, Oracle/VPS with Caddy); still TODO: Playwright e2e, ESLint/Prettier, Lighthouse pass |

Content: 162 starters (8 categories), 17 modifiers, 15 AFK lines.

## How to run

```bash
npm install
npm run dev        # portal + game at http://localhost:5173 (server on :3001)
npm test           # every workspace's tests (21 FMS unit tests: rules + hidden-info redaction)
npm run typecheck
npm run build && npm start   # production: one server on $PORT (default 3001) serves everything
```

## Architecture cheat-sheet

- **One server for everything** (`server/src/index.ts`): the React build, Socket.IO games, and Jjinja's static files plus `ws` WebSocket at `/jjinja` and `/jjinja/ws`. Socket.IO runs with `destroyUpgrade: false` so it doesn't kill Jjinja's upgrade requests.
- **Jjinja's server** (`games/jjinja-battle/server/index.ts`) exports `handleHttp` and `attachJjinja` instead of listening itself. Its client hardcodes `BASE = "/jjinja"` in `public/app.js`, and its HTML uses `/jjinja/...` paths.
- **Jjinja's type boundary:** the server type-checks against `games/jjinja-battle/types.d.ts`, because the server's `noUncheckedIndexedAccess` would flag Jjinja's internals. `server/contract.check.ts` fails typecheck if the real exports drift from it.
- **Vite dev proxy:** `/jjinja` goes to the game server on :3001. The portal card uses a plain `<a>` (`standalonePage: true`), not a React Router link.

- **One folder per game:** `games/finish-my-sentence` (`@gfc/fms`, which exports `./client`, `./server` and `./shared`) and `games/jjinja-battle` (`@gfc/jjinja`). The root workspaces are only the shared parts: `shared` (the game registry `games.ts`), `server` (Express + Socket.IO; mounts every game) and `client` (the portal shell: React 18 + Vite + Tailwind v4, the shared theme in `styles.css`).
- **Tailwind** only scans `client/` by default, so `client/src/styles.css` has one `@source` line per React game. A `games/*/client` glob did not work; list each folder.
- **Vite** dedupes react, react-dom and react-router-dom, so games outside `client/` share one React. In `@gfc/fms`, react and socket.io are peer dependencies.
- **One server, one Socket.IO namespace per game** (`/fms`). It is registered in `server/src/index.ts`.
- **`games/finish-my-sentence/server/game.ts`** holds all the FMS rules. It has no I/O; time and randomness come in through `ctx`. Functions validate, then mutate the room in place, and throw `GameError`.
- **`view.ts`** builds each player's redacted snapshot. Hidden starters and unrevealed endings never leave the server, and tests enforce this.
- **The server broadcasts full per-viewer snapshots** (`room:state`) after every change. The client keeps no game logic.
- **Rooms live in memory only.** A restart loses games, which is acceptable for v1.

## Decisions & gotchas

- **Commit messages:** plain, author ChinhQuy29 only, with **no** Co-Authored-By or "Generated with" lines (the user's explicit rule). Jjinja's imported history had them stripped with `git filter-repo`.
- **Jjinja history:** its 14 commits were imported into `games/jjinja-battle/` and merged with `--allow-unrelated-histories`. The original `D:\JjinjaBattle` folder and the `jjinja_battle` GitHub repo were left untouched; the user may delete them later.
- **Deploy scripts** moved to the repo root (`deploy/`, `DEPLOY.md`) and now clone games_for_couple, run `npm ci && npm run build` and start `server/src/index.ts`. Server names were deliberately kept (`/opt/jjinja`, user and service `jjinja`, `/etc/jjinja/env`) so an existing server keeps working. DEPLOY.md has migration steps. Old invite links `/r/CODE` are now `/jjinja/r/CODE`.
- The shared server honors `HOST`; setup sets `HOST=127.0.0.1`, `PORT=3000`.

- **Two git repos:** `D:\` itself is a git repo (it covers the whole drive). This project has its **own** repo at `D:\GamesForCouple` (branch `main`) so it isn't mixed up with it.
- **Session token storage:** the token is kept in **sessionStorage**, not localStorage. Each browser tab is a separate player, so you can test with two tabs, and a reload still resumes. The name is in localStorage.
- **No server build step:** the server runs TypeScript through `tsx`, in prod as well. It serves `client/dist` whenever that folder exists.
- **Dev port:** the dev server port is pinned with `--port 3001`, because preview tooling sets `PORT=5173`, which collided with Vite.
- **Timeouts:** when a phase deadline passes, clients auto-submit whatever is typed. The server waits 3s of grace, then fills the gaps (a deck starter, or an AFK line).
- **Who reveals:** the starter's author reveals their sentence. If the author is disconnected, the partner may reveal it instead so nobody gets stuck.
- **Ratings** stay hidden from the partner until RECAP.
- **Spec vs. code:** `game.ts` mutates rooms in place rather than returning new ones. The spec's "pure" means deterministic and I/O-free.

## Ideas backlog (future games for the portal)

Still a "coming soon" card in `shared/src/games.ts`: Blind Portrait Duel.
Other ideas from brainstorming: Telephone Doodle, Bad Charades by Webcam, Cook Together Badly, Wobbly Tower, Liar Liar, Pet Rock Tamagotchi (async), Story Chain (async).

To add a game, follow "Adding a game" in the root README: make a `games/<id>/` package with its own README and docs, add a registry entry in `shared/src/games.ts`, and plug it into `client/src/App.tsx` / `server/src/index.ts`.

---

## Log

### 2026-10-25: Polish pass begins: "who goes first" everywhere
- **The ask:** polish every game:
  - better art (CC0 packs like Kenney, downloaded only with the user's OK, plus my own; **not Pinterest**: copyrighted);
  - more maps and items; Bomb Squad with more modules, varied per bomb, and rules that change per game;
  - phone controls for all keyboard games; a "who does what" choice at room creation for every role game.
  The user picked the order: role picker → Bomb Squad → Tethered → Hide and Seek → the other environment games → phone controls.
- **Done: Road Trip trips and scenery.** 3 new trips (rice fields, desert highway, snowy village; 6 in all), a `scene` per trip with drawn roadside decor, a "start at" pick. Fixed: crowded trips could drop an obstacle on a fork. Also fixed the shared decoration `hash` (Tethered, Two-Body, Road Trip) returning negatives, which silently skipped about half the decorations.
- **Done: platformer polish.** Two-Body Problem: Kenney sprites with a theme per level, 4 new levels (Stairway, Locked in, Sprint, The ferry; 10 in all), each with a scripted test run. Handle With Care: Kenney tiles, wallpaper, windows and a truck; 2 new houses (apartment, art gallery; 5 in all) and a "start at" lobby pick.
- **Done: Ghost Hunt houses.** `shared/map.ts` now has 4 houses (old house, school, hospital, lake cabin) on the same 30×18 grid; every map function takes the house first. Lobby pick or 🎲 random (never the same twice in a row). 16 tests, including a closed-walls / all-reachable / doorway-per-ghost-room check for every house.
- **Done: Hide and Seek (maps, props, art).**
  - No top-down CC0 pack matched the style, so all art is hand-drawn SVG in code. 4 new maps (🛏️ bedroom, 🛁 bathroom, 🏫 classroom, 🏖️ beach) for 7 in all, and 34 new prop types (61 in all) with 5 new miss reactions (splash, squeak, ring, boing, snap).
  - Every floor is richer: sunlight, shadows, patterned rugs, flowers and lily pads in the park, the sea and a boardwalk on the beach.
- **Done: Tethered (towers, art, phones).**
  - With the user's OK, downloaded Kenney CC0 packs to the scratchpad: New Platformer Pack 1.1 (3.3 MB) and Mobile Controls (3.1 MB). Only the files used are copied into the repo: `games/tethered/client/assets/` (73 PNGs) and `kit/client/assets/touch/` (9 icons), 108 KB total, each with a CREDITS.md.
  - Towers: Classic plus a seeded generator (lifts, ferries, crumbles, spikes, 3 camps, summit), as Frozen Peak / Desert Cliffs / Mushroom Caves plus a 🎲 random tower each climb. Lobby choice `towerId`.
  - Renderer: themed Kenney tiles, sky gradient, parallax backdrop, drifting clouds, decorations, waving flags, posed sprite characters (pink/green).
  - **Kit `TouchControls`:** on coarse pointers (or `?touch`); multi-touch hold buttons; overlay in landscape, a row underneath in portrait. Tethered uses it; on short screens the HUD hides and the canvas fills the height.
  - 17 tests (a route reachability check over 60 random seeds; physics confirmed a rise-3/gap-2 jump lands). Play-tested: Frozen Peak on a laptop, phone portrait (buttons below, touch moved the climber) and landscape.
- **Done: Bomb Squad overhaul.**
  - Fixed manual → seeded **editions** (`shared/edition.ts`): rules for every module are generated per bomb and rendered as manual text from the same data the solvers use.
  - 4 new modules: Morse (blinking word → frequency), Maze (marker circles identify one of 6 mazes), Memory (5 stages, "same as stage k" steps), Switches (LED-color rules). 9 kinds total.
  - The module mix comes from `pickKinds`, preferring kinds the last bomb lacked; the manual only shows the present kinds; the edition # is on both screens. Hard = 6 modules.
  - 10 tests, including defusing every kind by following the manual. Play-tested in two tabs: a 6-module hard bomb, and the Expert's Morse tab matching the edition.
- **Done: the role picker.**
  - The kit has `first` on BaseRoom, a built-in `settings:first` action, `first` added to every view, `firstPlayer` / `firstSeat` helpers, and a `kit.FirstChoice` lobby control.
  - Used by Bomb Squad, Ghost Hunt, Road Trip, Escape Room, Kitchen Chaos (who preps), Two-Body (first walker, then it alternates), Paint & Hide and Codenames (first giver; later boards alternate who starts).
  - Hide and Seek (pre-kit) got its own `settings.firstHider`. Moving In already had "whose stuff is whose".

### 2026-10-25: Paint & Hide (plan 2 done)
- **Design:**
  - a seeded busy scene (mulberry32, 5 palettes, ~270 shapes) drawn identically on both screens;
  - a chameleon made of 9 ellipses at scale 0.75, with placement {x, y, rot, flip} and a server-side hit test with 6 units of padding;
  - the paint job is a 240×120 texture sent as a PNG data URL (≤500 KB), clipped to the outline;
  - hide 80s (auto-submit, then an unpainted fallback), seek 25s / 3 clicks, 4 rounds alternating.
- 7 tests. Play-tested in two tabs: the curtain for the seeker, move + eyedropper + fill + brush strokes, submit, the seeker's miss and hit, scores, the reveal outline. The scene matched on both screens and the painted texture arrived intact.

### 2026-10-25: Codenames Duet
- **Rules:**
  - the official Duet key layout (9 overlapping categories → 9 agents and 3 assassins per side, 15 agents total);
  - a clue (one word, at most 2 parts for Vietnamese compounds, never a board word) + a number; the guesser reads cards with the giver's key;
  - a bystander marks the card for that giver and ends the turn; the assassin loses;
  - turns 11/9/7; the giver alternates unless the other side has no agents left; win/loss record across boards.
- **Words:** ~280 English, ~150 Vietnamese.
- **Bug caught before testing:** the first draft kept the found-words list in a module-level variable, shared across every room on the server. It now lives on the clue.
- 8 tests (key layout, clue/guess rules, bystander/stop/assassin/out of turns, a full win, key redaction). Play-tested in two tabs with Vietnamese words: a clue, an agent found, a bystander ending the turn and passing the clue to the other player, the log.
- **Polish:** own agents and assassins are tinted, not just striped.

### 2026-10-25: Road Trip
- **Design:**
  - a top-down road where d = distance and x = sideways; the centre comes from seeded sine waves; forks spread two branches around the centre;
  - the Driver steers only; the Co-pilot has gas/brake and the route (which town to follow at each fork);
  - obstacles: cows (moving), potholes, rocks, mud, fuel cans; grass damages the van;
  - a wrong fork backs you up 40 and stalls you 4s; endings: arrived / broke down / out of gas; seats swap each trip.
- 8 tests, including an autopilot that finishes all 3 trips for 3 seeds with no wrong turns (so every generated road can be driven), and route redaction.
- **Play-test fix:** the first view showed under 1s of road ahead at full speed. The view is now 30 units wide with the van lower on screen, the top speed went 15 → 12, and the night headlights reach further.
- **Not verified in the browser:** a full trip by two people (the forks, cows and the night look are covered by tests and code, not seen in play).

### 2026-10-25: Handle With Care
- **Design:**
  - side-view houses (32×18) with a doorway in the wall at columns 24–25 and a truck zone outside;
  - 10 valuable kinds (value, fragility, small/big); E = grab/drop, F = throw (edge-triggered on the server);
  - big things need two holders: slower, no jump, pulled apart → drop;
  - damage from carried bumps, hard landings and wall hits; delivered = put down and resting in the truck.
- **Physics:** copied from Tethered and generalised (per-body w/h; `stepBody` takes `{speed, canJump}`).
- **Level fixes before testing:** the studio loft needed a step (4-tile rise > jump); the mansion lift's bottom stop was raised so it can be boarded.
- 10 tests, including two players carrying the TV through the doorway into the truck. Play-tested in two tabs: the render, grabbing the lamp, carrying it overhead, putting it down.
- **Not verified in the browser:** a full two-person run of each house (it needs two keyboards). Delivery and big-item carrying are covered by tests.

### 2026-10-25: Couple games plan 2 + Escape Room for Two
- **The ask:** the user picked ideas #4–#8 from a researched list of 10 (Escape Room, Handle With Care, Road Trip, Codenames Duet, Paint & Hide), to build one by one. The plan is in [docs/couple-games-plan-2.md](docs/couple-games-plan-2.md).
- **Escape Room:**
  - 3 rooms × 4 puzzles; clue and controls on different screens, alternating per puzzle, with the first actor flipping per room;
  - 5 puzzle kinds, randomized: a dial lock, a counting keypad, colors, levers, a DFS perfect maze walked blind;
  - score = time + 15s per mistake.
- 8 tests, including a full 3-room escape and the clue/controls redaction. Play-tested in two tabs: the dial (with a wrong try), the keypad (counting from the shelf), colors, levers, room 1 cleared, then the room-2 role flip and the maze with a bump and a keyboard walk to the exit.
- **Testing note:** the live server and tunnel (port 3001) were left running for the couple. New games were tested on a second server on port 3002 (`$env:PORT = '3002'; npm start`).

### 2026-10-25: Moving In (two-player Dreamy Room)
- **The ask:** the user requested a 2-player version of *Dreamy Room* (ABI Games). Their choices:
  - co-op "moving in together": each unpacks their own boxes;
  - our long-distance story over 6 rooms;
  - **strict** placement (every item one spot);
  - hand-drawn SVG; glow + hint button; anyone can move anything; the name "Moving In".
- **Design:**
  - 1600×900 front-view rooms built from furniture rects plus slots `{x, y, kind, owner?}`, and 43 item kinds drawn in `client/ItemArt.tsx`;
  - a drop snaps to the nearest free slot within 70 (any kind, so wrong placements are possible); identical kinds swap;
  - room 1's slots are owner-bound (your stuff in your bedroom);
  - the red glow comes only when both boxes are empty; 3 shared hints per room (4s ghost);
  - live drags are relayed through `onConnection` without touching the state.
- **Redaction:** slot kinds never leave the server.
- 12 tests. Play-tested in two tabs at 1280×800: all 6 rooms completed by real pointer drags from both tabs (each tab placing its own box), plus a hint, the polaroids and the final album.
- **Fixed after the play-test:** unpacked items stacked on one spot; they now fan out across the box top.
- **Polish pass (same day, the user's request):**
  - items are drawn 1.4× bigger (`ITEM_SCALE`, with `sizeOf()` used by the server and tests), and 6 slot pairs moved so the bigger items don't overlap;
  - decoration-only furniture added (curtains, garlands, wall art, floor lamps, big plants, a suitcase, a backsplash, a pendant lamp), plus a wallpaper pattern per room and a baseboard;
  - all 6 rooms replayed in two tabs and the album checked.
- **Still possible:** sounds, personal items.

### 2026-10-25: Two-Body Problem (all 5 co-op games done)
- **Game:** one body; Walker = left/right, Jumper = jump (only the matching part of each player's input counts). Swap pads trade jobs once per visit, and the first Walker alternates per level. 6 one-screen levels (32×18) with spikes, one-way platforms, a key/door, a 5s button gate, a ferry and a lift. R retries.
- **Physics:** copied from Tethered on purpose (games stay independent). Runs on the kit's 30 Hz loop.
- 10 tests, including scripted runs that finish level 1 (two separate half-controls) and level 6 (lift → key → swap → button → gate → door → goal). Play-tested in two tabs: the walker's keys move it, the jumper's key jumps it, and the walker's jump is ignored.
- **Wrap-up:** root README table/sections/layout, the co-op plan's status line, MEMORY status refreshed.

### 2026-10-25: Kit real-time loop + Tethered
- **Kit:**
  - `GameDef.loop {hz, active, step, frame}` runs a per-room interval that emits a small `frame` event; a full broadcast happens only when `step` returns true.
  - `action(schema, run, { quiet: true })` skips the broadcast (for held-key input).
  - The client gets `kit.useFrame(handler)`.
- **Tethered:**
  - physics in `shared/physics.ts`: tiles, one-way, movers, grab/stamina, jump buffer and coyote time, a chain constraint that routes corrections through collision;
  - a 24×72 tower built from platform specs with 3 camps, 2 movers, crumbles and spikes;
  - the server steps at 30 Hz; the client renders on a canvas with interpolation.
- 14 tests (physics, chain, the level's no-bonk rule, the climb). Play-tested in two tabs: the render, moving, the chain drawing. A headless simulation confirmed the first jumps land on the planks.
- **Not done:** a full two-person climb to the summit wasn't played in the browser (needs two real keyboards). The summit, checkpoints and respawns are covered by tests.

### 2026-10-25: Ghost Hunt
- **Design:**
  - Explorer + Navigator on a 30×18 tile house (8 rooms, loops, 6 closets);
  - 6 evidence types, split between the roles so they must talk: EMF, temperature and orbs show on the Navigator's side; writing, the spirit box and handprints on the Explorer's;
  - 8 ghosts with unique triples and small behaviors;
  - sanity, hunts (3s warning + 15s chase, door locked), hiding, a shared journal, a 10-minute limit.
- **Server:** simulation at 5 ticks/s through the kit's `wakeAt`/`tick` (`nextTickAt`). The Explorer gets only visible tiles; nobody gets the ghost's type, room or position until the result.
- 13 tests. Play-tested in two tabs: movement and fog memory, the Navigator's blueprint and readings, a camera feed, journal filtering, leaving with a wrong guess → result.
- **Fixed in play-test:** the key handler crashed when the event target was `window` (`closest` isn't on Window); it now checks `instanceof Element`.
- **Added** a shared `.flicker` animation to `client/src/styles.css`.

### 2026-10-25: Kitchen Chaos
- **Design:** click-only (no walking), so it works on trackpads. Prep side (crates, 2 boards, trash), the pass (3 slots), cook side (3 stoves, plates, 2 counters, serve, trash). One item or plate in hand. Both players see the whole kitchen.
- **Rules:** 7 recipes over 3 levels; chop = 5 clicks; cook 7s, burn 8s later; coins = 10 per part + up to 10 tip; walk-out −10 (floor 0); stars per level; sides swap each shift.
- **Server wake-ups** include stove done/burn times, so burns are counted even if nobody clicks.
- **Client:** station tiles use container-query units (`cqw`) so they scale with the panel.
- 10 tests. Play-tested in two tabs: a burger from crate to coins, cooking and burning, walk-outs, a full 3-minute shift to the summary.
- **Gotcha:** while the browser pane is hidden, framer-motion exit animations don't finish, so old tickets linger on screen. That's a test-environment artifact only.

### 2026-10-25: Co-op plan + Bomb Squad
- **Research:** read up on popular co-op Steam games (Keep Talking and Nobody Explodes, Overcooked 2, It Takes Two, PEAK, Chained Together, Phasmophobia, Lethal Company, Pico Park, The Chameleon). Picked 5 to adapt for two players on laptops; the plan with sources is [docs/coop-games-plan.md](docs/coop-games-plan.md).
- **Build order:** 💣 Bomb Squad → 🍳 Kitchen Chaos → 🔦 Ghost Hunt → ⛓️ Tethered → 🕹️ Two-Body Problem (replaces the coming-soon card).
- **Bomb Squad:**
  - Defuser/Expert roles that swap every bomb; 3 difficulties; 5 modules (wires, button, symbols, Simon, password).
  - The manual is original text. `shared/rules.ts` holds solvers that implement it, with 14 tests.
  - The button's hold uses the timer text shown on the Defuser's screen, trusted within ±1.5s of the server's.
  - Play-tested in two tabs at 1280×800: a strike, every module solved, the result screen, the role swap.
- **Next:** Kitchen Chaos. The physics games (Tethered, Two-Body) need a real-time loop in the kit.

### 2026-10-25: Shared kit + Number Rush
- **The ask:** the user requested a 1–100 number-finding race. They also requested: then research popular co-op Steam games, plan 5 couple-friendly adaptations, and build them one by one without asking, retrying failures, and not stopping until all are done.
- **Kit:** created `kit/` (`@gfc/kit`) to stop copying room/socket/lobby code into every game. `registerGame(io, def)` on the server; `createGameClient()` on the client, which gives AppShell, LobbyShell, Choice, Scores, TimerBar, Avatar, RecapActions and WaitingBlob. Older games keep their own copies.
- **Number Rush:**
  - 30/50/100 numbers on a jittered grid, in asc/desc/random order, with a calm or chaos style;
  - a 1.5s lock after a wrong click;
  - a fair "photo finish": the first correct click opens a 350ms window, and the lowest device-timed reaction (clamped to the server-seen time −3s/+1.5s) wins.
  - 9 tests. Play-tested in two tabs at 1280×800 through a full 100-number game.

### 2026-10-25: Hide and Seek (prop hunt)
- **Request:** the user wanted a prop hunt where one player becomes a random object (3 choices) and hides, and the other shoots (5 chances). They chose "go with your recommendations", the name **Hide and Seek**, and **laptops** as the main device.
- **Design** (docs/spec.md, written first):
  - 2D top-down SVG map 1600×1000, hand-drawn SVG props (no emoji, for fairness across devices),
  - 3 maps (living room, kitchen, park) with spot-based layouts reshuffled every round,
  - 3 choices from types present in the room, rotate (15° steps) and resize (90–110%),
  - 2 sneak moves, a taunt wiggle every 15s, 5 shots and 60s, roles swapping every round,
  - scoring: found = 100 + 20 per unused shot; survived = 150; +10 per miss for the hider.
- **Redaction:** the hunter gets no room data while hiding; while seeking, ids are random and props are sorted by id, so the fake is indistinguishable; the taunt id is in the state only during the wiggle.
- **Delayed:** shell commands failed the auto-mode safety check (classifier errors) for a while, so the code was written blind and run afterwards. It passed tests and typecheck on the first run.
- **Fixed after the play-test:**
  - at 1280×800 the full-width hunt map overflowed the screen height, so `MapView` now caps its width at `(100dvh − 230px) × 1.6`;
  - "1 shots" now reads "1 shot".

### 2026-10-24: Fan Cứng AOG (Liên Quân trivia)
- **Built for the user's girlfriend:** a big Liên Quân/AOG fan whose favorite team is **SGP (Saigon Phantom)**, especially the era with **Lai Bâng**, and old members **Fish, Khoa, Shin**. She **dislikes FPT x Flash** (SGP's rival). Both partners play (the user plays Liên Quân too).
- **User choices:** a VI/EN toggle; coverage back to 2020; only AOG plus international events with Vietnamese teams (no Queens of Glory); skip Facebook; skip fact-checking for now.
- **Research:**
  - **Readable:** Vietnamese Wikipedia (ĐTDV + SGP), lienquan.garena.vn recaps and Vietnamese esports news.
  - **Blocked:** Facebook needs a login (not done), Liquipedia shows a human check (not bypassed), and the YouTube channel pages didn't render (search works; the official channels are `@LienQuanMobileSportsGarena` and `@GarenaLienQuanMobileVN`).
  - **Left out:** contested facts (the Đông 2024 final score, Lai Bâng's exact leaving date, the V Gaming → One Star rename) and private-life stories, including Lai Bâng's breakup and his old boosting ban.
- **Fairness:** the server clamps device-claimed answer times to [server − 3s, server + 1.5s].
- **Avatars:** fixed duplicate player avatars in all four React games; the second player gets the next animal on a collision.
- **Next ideas:** have a fan check the questions and fix any 🚩 ones; add hero/patch questions, "who said it?" quotes and timeline ordering.

### 2026-10-24: Would You Rather: Unhinged
- Built `games/would-you-rather/` (`@gfc/wyr`, Socket.IO namespace `/wyr`), following the same pattern as FMS and Doodle. The portal's "coming soon" card became the playable game.
- **Flow:** ANSWER (pick + predict) → DEBATE only on disagreement → RESULT. Write-your-own questions every 5th or 3rd, alternating writers, host first.
- `shared/stats.ts` is shared by the verdict screen, the recap and the tests. Auto-picked answers are left out of the guessing scores.
- **Next ideas:** the two remaining coming-soon games (Blind Portrait Duel, Two-Body Problem); sound effects and narrator for FMS; deploying, so the games are playable without a tunnel.

### 2026-10-24: Telephone Doodle
- Built Telephone Doodle as `games/telephone-doodle/` (`@gfc/doodle`), following the FMS pattern: server-authoritative, a pure `game.ts`, strict `view.ts`, Socket.IO namespace `/doodle`.
- **Two-player design:** two parallel chains per round, one owned by each player. Owners draw and partners guess, so the guesser never sees the original words, and both players are busy at every step.
- **Drawings** are stroke lists on a 1000×1000 grid. The server validates them and enforces the one-stroke, five-strokes, one-color and tiny chaos rules; blind, mirror and shaky are client-side.
- Client plumbing (socket, store, storage, timer, waiting blob) was copied from FMS rather than shared, to keep games isolated.

### 2026-10-24: Every game in its own folder
- Moved Finish My Sentence from `client/src/games/fms`, `server/src/games/fms`, `shared/src/fms` and `docs/` into one package, `games/finish-my-sentence/` (`client/`, `server/`, `shared/`, `docs/spec.md`), using `git mv` so history follows. `WaitingBlob` moved in with it, since only FMS uses it.
- Each game now has its own README (FMS: a new one for players and developers; Jjinja: its existing one). The root README is the overview of all games, including "Adding a game".
- Verified: 21 tests pass, every workspace typechecks, the production CSS still includes the game's classes, and both games play in the browser.

### 2026-10-24: Jjinja Battle joins the portal; pushed to GitHub
- Moved the Jjinja Battle project (from `D:\JjinjaBattle`) into `games/jjinja-battle/` with its history, minus attribution lines.
- Served it from the shared server at `/jjinja`, added its portal card and a "← Games" link back to the portal, and moved its deploy scripts to the root for the whole project.
- Tested: portal shows both games; Jjinja invite, join and WebSocket work in dev and prod; FMS still works; tests and typecheck pass.
- Removed the attribution line from the first commit before the first push.

### 2026-10-24: Portal and Finish My Sentence v0.1
- Brainstormed couple-game ideas, and the user picked **Finish My Sentence**.
- Wrote the full build spec (`docs/`), then updated it for the multi-game portal layout.
- Built the portal home (one playable card plus three "coming soon" cards) and the light/dark cartoon "sticker" theme.
- Built the game end to end: rooms with 4-letter codes and share links, host settings, START (write your own or 🎲 deal from the deck with 2 re-rolls), FINISH (classic, peek or blind, plus modifiers), a dramatic synced REVEAL with reactions and ratings, a RECAP with awards, and rematch.
- 21 unit tests passing. Played a full 3-round game across two tabs, including timer expiry fallbacks and a mid-game reload. Checked the mobile layout (375px, no horizontal scroll) in light and dark mode.
- **Next up:** M4 (sound effects, TTS narrator, confetti), then M5 (Hall of Fame, image export), then deploy so the user's girlfriend can actually play.
