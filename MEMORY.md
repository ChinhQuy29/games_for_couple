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
- **GitHub:** https://github.com/ChinhQuy29/games_for_couple (branch `main`).

## Current status (2026-10-24)

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

Already shown as "coming soon" cards in `shared/src/games.ts`: Blind Portrait Duel, Two-Body Problem, Would You Rather: Unhinged.
Other ideas from brainstorming: Telephone Doodle, Bad Charades by Webcam, Cook Together Badly, Wobbly Tower, Liar Liar, Pet Rock Tamagotchi (async), Story Chain (async).

To add a game, follow "Adding a game" in the root README: make a `games/<id>/` package with its own README and docs, add a registry entry in `shared/src/games.ts`, and plug it into `client/src/App.tsx` / `server/src/index.ts`.

---

## Log

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
