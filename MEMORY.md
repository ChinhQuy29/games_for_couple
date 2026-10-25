# Project Memory — Games for Couple

Running log of what has been built, decisions made, and what's next.
**Update this file at the end of every work session** (newest entry on top in the Log).

---

## What this project is

A portal of silly, real-time two-player web games for a long-distance couple. Each person plays on their own phone or laptop, usually while they're on a call together. The goal is laughter, not hard competition.

- **Portal home:** `/`. Lists every game from `shared/src/games.ts`.
- **Game #1: Finish My Sentence** at `/fms`. Full spec in [docs/finish-my-sentence-spec.md](docs/finish-my-sentence-spec.md).

## Current status (2026-10-24)

| Milestone (see spec §11) | Status |
|---|---|
| M0 Scaffold | ✅ done |
| M1 Rooms & lobby | ✅ done |
| M2 Core loop (all 3 modes) | ✅ done, verified in two browser tabs |
| M3 Timers & resilience | ✅ mostly done: countdown, auto-submit, AFK and deck fallbacks, disconnect banner, reload resume. Not done: `FMS_TIMER_SCALE` test hook |
| M4 Fun layer | 🟡 partial: visual style, reveal animation with shake, modifiers, live reactions, typing indicator and waiting blob are done. **TODO:** sound effects (Web Audio), TTS narrator, confetti, mute toggle |
| M5 Keepsakes | 🟡 partial: ratings, awards and rematch are done. **TODO:** Hall of Fame (localStorage), save-as-image (`html-to-image`) |
| M6 Polish & ship | ⬜ TODO: Playwright e2e, ESLint/Prettier, Dockerfile, deploy (Render), Lighthouse pass |

Content: 162 starters (8 categories), 17 modifiers, 15 AFK lines.

## How to run

```bash
npm install
npm run dev        # portal + game at http://localhost:5173 (server on :3001)
npm test           # 21 server unit tests (rules + hidden-info redaction)
npm run typecheck
npm run build && npm start   # production: one server on $PORT (default 3001) serves everything
```

## Architecture cheat-sheet

- **npm workspaces:** `shared` (types, zod schemas, game registry), `server` (Express + Socket.IO), `client` (React 18 + Vite + Tailwind v4 + framer-motion).
- **One server, one Socket.IO namespace per game** (`/fms`). It is registered in `server/src/index.ts`.
- **`server/src/games/fms/game.ts`** holds all the rules. It has no I/O; time and randomness come in through `ctx`. Functions validate, then mutate the room in place, and throw `GameError`.
- **`view.ts`** builds each player's redacted snapshot. Hidden starters and unrevealed endings never leave the server, and tests enforce this.
- **The server broadcasts full per-viewer snapshots** (`room:state`) after every change. The client keeps no game logic.
- **Rooms live in memory only.** A restart loses games, which is acceptable for v1.

## Decisions & gotchas

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

To add a game: add a registry entry in `shared/src/games.ts`, add client routes in `client/src/App.tsx` under `client/src/games/<id>/`, and, if it's real-time, add a server namespace in `server/src/games/<id>/` registered in `server/src/index.ts`.

---

## Log

### 2026-10-24: Portal and Finish My Sentence v0.1
- Brainstormed couple-game ideas, and the user picked **Finish My Sentence**.
- Wrote the full build spec (`docs/`), then updated it for the multi-game portal layout.
- Built the portal home (one playable card plus three "coming soon" cards) and the light/dark cartoon "sticker" theme.
- Built the game end to end: rooms with 4-letter codes and share links, host settings, START (write your own or 🎲 deal from the deck with 2 re-rolls), FINISH (classic, peek or blind, plus modifiers), a dramatic synced REVEAL with reactions and ratings, a RECAP with awards, and rematch.
- 21 unit tests passing. Played a full 3-round game across two tabs, including timer expiry fallbacks and a mid-game reload. Checked the mobile layout (375px, no horizontal scroll) in light and dark mode.
- **Next up:** M4 (sound effects, TTS narrator, confetti), then M5 (Hall of Fame, image export), then deploy so the user's girlfriend can actually play.
