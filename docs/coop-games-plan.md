# Co-op games plan: 5 Steam hits, remade for two

> **Status: all 5 built and pushed (2026-10-25):** 💣 [Bomb Squad](../games/bomb-squad/README.md) · 🍳 [Kitchen Chaos](../games/kitchen-chaos/README.md) · 🔦 [Ghost Hunt](../games/ghost-hunt/README.md) · ⛓️ [Tethered](../games/tethered/README.md) · 🕹️ [Two-Body Problem](../games/two-body-problem/README.md). Each game's `docs/spec.md` describes what was actually built, where it differs from this plan.
>
> Written 2026-10-25 before building. Each game gets its own folder under `games/` with a README and `docs/spec.md`, is built on the shared kit (`kit/`), and is committed and pushed when done.

## What's popular (research summary)

| Steam game | Why people love it | Two-player fit |
|---|---|---|
| **PEAK** (2025, 15M+ players) | Climbing a mountain together, helping each other up, chaotic physics | Great: co-op climbing |
| **Chained Together** | Players chained together, every jump affects your partner | Perfect for a couple: you literally can't leave each other behind |
| **R.E.P.O.** (19.6M players) | Carrying wobbly valuables out as a team | Physics-heavy; the "carry it together" idea is the fun part |
| **It Takes Two / Split Fiction** | The top couples' picks: two players who need each other's abilities | Asymmetric abilities |
| **Keep Talking and Nobody Explodes** | One defuses, the other reads the manual, by talking only | Ideal for a couple on a call |
| **Overcooked 2** | Frantic kitchen teamwork, shouting "I need onions!" | Great, and works with split jobs |
| **Phasmophobia / Lethal Company** | Spooky co-op exploring, one person getting scared | Asymmetric: one explores, one guides |
| **Lovers in a Dangerous Spacetime** | Running different stations of one ship | Another split-stations game |
| **Meccha Chameleon** | Paint yourself to blend in and hide | Already covered by our Hide and Seek |

Sources:
- [Peak (Wikipedia)](https://en.wikipedia.org/wiki/Peak_(video_game))
- [Friendslop (Wikipedia)](https://en.wikipedia.org/wiki/Friendslop)
- [Steam250 top co-op games](https://steam250.com/tag/co-op)
- [isthisgamedead: most active Steam co-op games](https://isthisgamedead.com/category/coop)
- [Best 2-player Steam games (thinglabs)](https://thinglabs.io/best-2-player-steam-games)
- [Best co-op games for couples (Inverse)](https://www.inverse.com/gaming/11477-the-8-best-co-op-video-games-for-couples)
- [Meccha Chameleon (PC Games)](https://www.pcgames.de/Spiele-Thema-239104/News/Steam-Friendslop-Multiplayer-Koop-Meccha-Chameleon-1545449/)

## The 5 games (in build order)

All five are **co-op**: you win or lose together. Every game ends with a shared result (time, stars, rank) instead of a winner.

---

### 1. 💣 Bomb Squad (from *Keep Talking and Nobody Explodes*)

**Pitch:** one of you sees a ticking bomb, the other has the defusal manual. You can only win by talking.

- **Roles:** the **Defuser** sees the bomb (modules, serial number, battery count, a strike counter); the **Expert** sees only the manual. Roles swap every bomb.
- **Modules** (3–5 per bomb by difficulty), each with rules that depend on bomb details:
  1. **Wires:** 3–6 colored wires; which one to cut depends on colors, count and the serial's last digit.
  2. **The Button:** a colored, labeled button; hold or tap, and when held, release on a specific digit depending on the strip color.
  3. **Symbols:** 4 of 28 symbols; press them in the order of the manual column that contains all 4.
  4. **Simon Says:** flashing colors that map to other colors depending on strikes and whether the serial has a vowel.
  5. **Passwords:** 5 letter wheels; find the one word from a list of 35 that can be spelled.
- **Rules:** 3 strikes or the timer (5:00 → 3:00 by difficulty) means 💥. Clear every module to defuse.
- **Tech:** server-authoritative bomb state. Redaction: the **Expert never receives the bomb**, and the **Defuser never receives the manual**. That matters because the manual rules are general, but solutions are computed from this bomb's details. Both use pure solver functions that are unit-tested.
- **Done means:** 3 difficulty levels, a bomb summary at the end, and tests for every module solver.

---

### 2. 🍳 Kitchen Chaos (from *Overcooked 2*)

**Pitch:** a tiny restaurant where one of you preps and the other cooks and serves, and orders keep coming.

- **Kitchen:** two stations, linked by a **pass-through counter**:
  - **Prep side (player 1):** ingredient crates and a chopping board.
  - **Cook side (player 2):** stove, oven, plates and the serving window.
- **Recipes:** salad, soup, burger, sushi and more, built from 2–4 steps (chop, cook, bake, plate).
- **Cooking:** click to take an item, click a station to use it. Chopping takes several clicks. Cooking runs on its own timer and **burns** if you leave it too long 🔥.
- **Orders:** they arrive on tickets, each with a patience timer. Serve correct dishes for coins, plus a tip when they're fast. Expired orders cost a little.
- **Round:** 3 minutes, scored with ⭐ to ⭐⭐⭐ by coins. Stations swap sides between rounds. There are 3 levels, each with more recipes and faster orders.
- **Tech:** the server owns all items and timers. A tick runs every 250ms for cooking progress and order timers; clients render smooth progress bars from the timestamps.
- **Done means:** a playable 3-minute shift, 6+ recipes, burning, the pass, scoring, and tests for the recipe logic and timers.

---

### 3. 🔦 Ghost Hunt (from *Phasmophobia* / *Lethal Company*)

**Pitch:** one of you creeps through a dark house with a flashlight; the other watches the security cameras and the map. Find out which ghost it is, then get out.

- **Explorer:**
  - moves on a tile grid (WASD or arrows) and sees only a **flashlight cone** and nearby tiles,
  - can pick up **evidence** (EMF spikes, ghost writing, freezing rooms, orbs) by standing in the right room and using the right tool,
  - has a **sanity** meter that drops over time and when the ghost is near.
- **Navigator:**
  - sees the **full floor plan**, the explorer's dot, and **cameras** that show ghost activity in 2 rooms,
  - watches the **EMF/temperature readout** for whichever room the explorer is in,
  - doesn't see the ghost directly, only clues ("lights flicker in the kitchen").
- **The ghost:** it wanders between rooms and has a favorite room. During **hunts** (more often as sanity drops) it chases the explorer, who must hide in a closet or break line of sight.
- **Winning:** identify the ghost type from 3 pieces of evidence (8 ghost types), then reach the front door. Pick the wrong type, or the explorer is caught = loss. Roles swap per game.
- **Tech:**
  - **Server-simulated:** ghost movement and hunts, at 5 ticks per second.
  - **Redaction:** the explorer gets only visible tiles; the navigator gets the map but not the ghost's position (only camera/EMF signals).
- **Done means:** 1 house map, 8 ghost types, evidence, hunts, hiding, the journal, win/lose, and tests for evidence logic and redaction.

---

### 4. ⛓️ Tethered (from *Chained Together* / *PEAK*)

**Pitch:** two climbers chained together, climbing a tower of platforms. If one falls, the chain drags the other. Reach the summit.

- **Movement:** each player controls their own climber (←/→ or A/D, Space to jump).
- **The chain:** a **3.5-tile chain** links you. It's a distance constraint, so a falling partner pulls you, and you can swing them. One player can **anchor** (hold ↓ to grab a ledge) while the other swings up.
- **Stamina:** a **stamina bar** (from PEAK) drains while grabbing.
- **The tower:** a hand-built climb with checkpoints every ~10 platforms; falling sends you back to the last checkpoint. It has moving platforms, crumbling platforms and one-way platforms.
- **Score:** time to the top and number of falls (the "drama meter").
- **Tech:** the **server simulates physics at 30 ticks per second**. Clients send input changes; the server broadcasts compact positions every tick, and clients interpolate.
- **Done means:** a full tower with 3 checkpoints, the chain, stamina, moving and crumbling platforms, a summit celebration, and tests for physics and the chain constraint.

---

### 5. 🕹️ Two-Body Problem (from *It Takes Two* / *Pico Park*)

**Pitch:** one character, two players. One of you can only **walk**, the other can only **jump** (and later **grab** and **switch**). This replaces the "coming soon" card on the portal.

- **Controls:** the Walker uses ←/→, the Jumper uses Space. In later levels, abilities swap mid-level at ⇄ pads.
- **Levels:** 6 short ones with keys, doors, buttons that need a box, spikes, and moving platforms. Each level is a few screens.
- **Respawns:** death means a quick respawn at the level start or a checkpoint. The level-complete screen shows time and deaths.
- **Tech:** reuses Tethered's physics module (copied into this game's folder, so games stay independent): a server sim at 30 ticks per second with a single body.
- **Done means:** 6 levels, ability swaps, death and respawn, the level select, and tests for the level data and input mapping.

## Shared technical approach

- **Kit:** every game uses `@gfc/kit` for rooms, joining and the lobby (see [kit/README.md](../kit/README.md)).
- **Server-authoritative:** pure rules in `server/game.ts`, unit-tested with injected time and randomness. Per-player redaction lives in the view.
- **Real-time games (Kitchen ticks, Ghost Hunt, Tethered, Two-Body):** a fast lightweight `tick` event carries positions, while full `room:state` broadcasts go out only on meaningful changes.
- **Laptop-first** layouts with keyboard controls, sized to fit 1280×800 without scrolling.
- **Every game:** tests, a two-tab play-test, a README, `docs/spec.md`, a portal card, the root README section, a MEMORY.md entry, and a commit and push.
