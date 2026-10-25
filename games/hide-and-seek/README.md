# 🙈 Hide and Seek

A two-player **prop hunt**. One of you turns into an everyday object (a lamp, a cushion, a duck…) and hides in a room full of real ones. The other gets **5 shots** to find the fake. Then you swap. It's played at `/hns` in the [Games for Two](../../README.md) portal. It's designed for **laptops** with a mouse or trackpad.

> **Who goes first:** in the lobby, the host picks who hides first: 🎲 random, themselves, or their partner. Roles still swap after that.

## How to play

1. One of you opens **Hide and Seek** from the portal, enters a name, and taps **Create a room**.
2. Send your partner the 4-letter code or the link (`/hns/CODE`). They join.
3. The host picks the settings and taps **Let's play! 🙈** A coin flip decides who hides first.

### 🙈 Hiding (45 seconds)

The hunter's screen is a curtain: they can't see the room at all.

1. **Become…** one of **3 objects** that already exist in this room. The panel tells you how many real ones there are to blend in with.
2. **Place it:**
   - drag your object (the one with the green ring) anywhere,
   - rotate it with **Q / E** or ⟲ ⟳,
   - nudge its size with **− / =**.
3. Hit **I'm hidden! 🤫**, or press **Enter**, to start the hunt early.

Tip: the real objects are scattered at slight angles and sizes. Copy them. A perfectly straight cushion, or a 4th chair next to a set of 3, is a giveaway.

### 🔫 Hunting (60 seconds)

- Click the object you think is fake. You have **5 shots**. Clicking empty floor doesn't use one.
- **Miss** and the real object reacts (💥 *CRASH!*, 🪶 *poof*, 🦆 *QUACK!*), then gets a ❌.
- **Every 15 seconds the fake does a tiny wiggle** (👀 *Something just wiggled!*). Watch closely.
- The hider has **2 sneak moves**: they can drag themselves somewhere new, but both screens show the object sliding, so the hunter might catch it.

The round ends when the fake is hit, the shots run out, or time's up. The reveal shows where they were, with every shot on the map.

### Scoring

| Event | Points |
|---|---|
| Hunter finds the hider | **100 + 20 per unused shot** |
| Hider survives | **150** |
| Every missed shot | Hider **+10** |

Roles swap every round. After the last round (6 by default), the recap shows the winner, hides survived, finds, and every round.

### Settings (host only)

Map (🛋️ Living room, 🍳 Kitchen, 🌳 Park, or 🎲 random each round), rounds (2/4/6), time to hide (30/45/60s), time to hunt (45/60/90s), shots (3/5/7), sneak moves (0/2/3), and taunts on/off.

## Run it

From the repository root:

```bash
npm install
npm run dev
```

Open http://localhost:5173/hns. To play both sides on one computer, open the room link in a second tab.

## How it works

- **The server decides everything** (`server/game.ts`, plain functions with time and randomness passed in).
  - Each round it builds a **fresh layout** from the map's plausible spots in `server/content/maps.ts`: every spot gets a random type, a chance to stay empty, a little jitter, a slight tilt and size.
  - It offers the hider 3 types that exist in that layout.
- **The fake is indistinguishable** (`server/view.ts`):
  - While hiding, the hunter receives **no room data at all**.
  - While hunting, every prop (the fake included) has a fresh random id, the same fields, and the list is sorted by id.
  - Only after the round does anyone learn which prop it was.
  - The taunt prop id is in the state only while the wiggle plays (about 1.2s).
- **Server-driven timers** (`server/timers.ts`) wake for the phase end, each taunt, and the end of each taunt.
- **Art:** every prop is a small hand-made SVG drawing (`client/components/PropArt.tsx`), with no emoji, so a fake lamp looks exactly like a real one on every device. Floors, rugs, the path and the pond are in `MapBackground.tsx`.
- **Map:** one SVG in world units (1600×1000) that scales to the window. Dragging converts the mouse position to world units. Sneak moves animate with a CSS transition, so the slide is visible.
- **Real-time:** the Socket.IO namespace `/hns` on the shared server. Rooms are kept in memory.

The full design is in [docs/spec.md](docs/spec.md).

## Files

```
games/hide-and-seek/          # workspace package @gfc/hns
├─ client/        # React UI → @gfc/hns/client (HnsApp), wide laptop layout
│  ├─ components/ # MapView (drag/shoot/reveal), PropArt, MapBackground, Hud, TimerBar…
│  └─ screens/    # Home, Lobby, HidePhase, SeekPhase, RevealPhase, Recap
├─ server/        # rules, view, timers, socket wiring → @gfc/hns/server
│  └─ content/maps.ts   # the spots for each map
├─ shared/        # types, zod schemas, prop catalog, maps, points
└─ docs/spec.md   # written before the code
```

## Adding a map or a prop

- **New prop:** add it to `PROP_TYPES` in `shared/constants.ts` (size, hideable, reaction) and give it a drawing in `PropArt.tsx`.
- **New map:**
  - add it to `MAPS` in `shared/constants.ts`,
  - add its spots in `server/content/maps.ts`,
  - draw its background in `MapBackground.tsx`.

## Tests

```bash
npm test -w @gfc/hns
```

The tests cover:
- layouts (inside the world, unique ids, choices that have real twins),
- hiding (roles, normalization, timeout),
- seeking (hit, miss, already shot, out of shots, out of time, sneak limits, taunt timing),
- rounds (role swaps, no repeated map, recap),
- redaction (nothing for the hunter while hiding, an indistinguishable fake, a taunt that clears).

## Status

Playable end to end. Ideas for later: sound effects, more maps (a bedroom, her favorite café), and a "decoy" power-up that makes a real prop wiggle.
