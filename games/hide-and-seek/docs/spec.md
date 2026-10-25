# Hide and Seek: Spec

> Design and technical reference for **Hide and Seek**, a two-player prop hunt. One player turns into an everyday object and hides in a room full of real ones; the other gets a few shots to find the fake. Written before the code and kept in step with it. For how to play, see the [README](../README.md).

## 1. Design decisions

| Question | Decision | Why |
|---|---|---|
| View | **2D, top-down**, drawn as SVG | Mouse-friendly, easy to keep in sync on two screens, and cute |
| Devices | **Laptops first**: a wide 16:10 map (1600×1000 world units) that scales to the window | The couple mostly plays on laptops |
| Art | **Hand-made SVG props** (no emoji) | Emoji look different on different devices, which would make hiding unfair |
| What gives a hider away | Placement only: odd spots, odd angles, a 4th chair next to 3 | The fake looks exactly like the real ones |
| Layouts | **Shuffled every round** from plausible spots | The hunter can't memorize the room |
| Hider choices | **3 object types that already appear in this map** | It has to blend in |
| Hider adjustments | Rotate (15° steps) and a small size nudge (90%–110%) | Lets them match the real props |
| Moving while hunted | **2 sneak moves** per round | Keeps the hider involved; the hunter may catch the slide |
| Taunts | **Every 15s** the fake does a tiny wiggle | Stops perfect hides from being unfindable |
| Shooting | **5 shots, 60s** to hunt | Tense but fair |
| Missed shots | Real props **react**: vases shatter, cushions burst, ducks quack | Half the comedy |
| Rounds | **Roles swap every round**, best of 6 by default | Equal turns hiding and hunting |

## 2. Round flow

```
LOBBY ─start→ HIDE ─hider ready | hide timer + grace→ SEEK ─hit | out of shots | seek timer + grace→ REVEAL
REVEAL ─both ready→ next round's HIDE (roles swapped) | RECAP after the last round
RECAP ─rematch→ LOBBY            any phase ─player leaves→ LOBBY
```

### HIDE (default 45s)
- The server builds a fresh **layout** for the round's map (§4) and offers the hider **3 object types** from that map.
- The hider's object starts on a random free spot. The hider can:
  - pick one of the 3 types (switching at any time),
  - drag it anywhere on the map,
  - rotate it (buttons or the `Q`/`E` keys),
  - nudge its size (−/+),
  - press **Ready** to start the hunt early.
- The **hunter sees a curtain** ("🙈 Eyes closed!") with a countdown. They get **no layout at all**: seeing the room before the hide would make spotting the new object trivial.
- Every drop, rotate or resize is sent to the server, so a timeout uses the latest placement.

### SEEK (default 60s)
- Both see the full room. **The fake is indistinguishable in the data:** all props get fresh random ids every round and are sent in random order, with the same fields.
- **Hunter:** click a prop to shoot it (5 shots). Clicking empty floor doesn't use a shot.
  - Miss: the prop reacts and stays marked as checked.
  - Hit: the round ends at once.
- **Hider:** can drag their object to a new spot up to **2 times** (sneak moves). Both screens animate the slide, so the hunter can catch it if they're watching.
- **Taunt:** every 15s the fake wiggles for about 1 second on both screens. The taunt is in the state only while it's playing, then cleared.
- The round ends on a hit, when shots run out, or when the timer runs out.

### REVEAL
- Shows where the hider was (highlighted), every shot, the result and the points.
- Both press Next. Roles swap, and a new map is chosen (random, or the host's pick).

### RECAP
- Total scores, the winner, and per-player stats (hides survived, finds, shots used).

## 3. Scoring

| Event | Points |
|---|---|
| Hunter finds the hider | **100 + 20 × unused shots** |
| Hider survives the round | **150** |
| Each missed shot | Hider **+10** (for every shot wasted) |

Example: found on the 2nd shot of 5 gives the hunter 100 + 20×3 = 160 and the hider 10. Surviving all 5 shots gives the hider 150 + 50 = 200.

## 4. Maps and layouts

Each map has a **background** (floor, rugs, walls, paths: decoration only) and **spots**: candidate positions with the prop types that make sense there and an optional rotation range.

Per round:
1. Every spot is filled with one of its allowed types, or left empty (each spot has a fill chance).
2. Fill positions get a small jitter (±12 units), and rotation is picked within the spot's range.
3. The **hider's 3 choices** are drawn from the hideable types present in this layout, so the real twins are always in the room.
4. The hider's starting position is a random free spot.

| Map | Look | Hideable types |
|---|---|---|
| 🛋️ Living room | Wood floor, rug, sofa, TV | plant, lamp, cushion, vase, books, mug, chair |
| 🍳 Kitchen | Tiles, counters, dining table | mug, pot, toaster, bottle, stool, fruit bowl, plant, chair |
| 🌳 Park | Grass, flowers, path, pond with lily pads | bush, rock, flower, duck, mushroom, bin, lamp post |
| 🛏️ Bedroom | Carpet, starry rug, bed, wardrobe, desk | pillow, teddy, slippers, alarm clock, guitar, laundry basket, lamp, plant, books, mug, cushion, chair |
| 🛁 Bathroom | Tiles, toilet stalls, bathtub, sink, shower corner | toilet, towel, soap, toothbrush cup, toilet roll, shampoo, rubber duck, bucket, slippers, basket, bin, plant, bottle |
| 🏫 Classroom | Wood floor, blackboard, teacher's desk, 9 school desks | chair, books, apple, pencil cup, mug, backpack, globe, trophy, plant, bin |
| 🏖️ Beach | Sea, sand, boardwalk, palms, umbrellas, towels | surfboard, sandcastle, beach ball, shell, crab, bucket, starfish, rock, bin |

Big pieces (sofa, TV, counters, trees, bed, wardrobe, desks, bathtub, sink, blackboard, palms, umbrellas, beach towels) are props too: they can be shot, but can't be chosen for hiding.

## 5. Props

`PROP_TYPES[type] = { label (vi/en), w, h, hideable, reaction }`. Size is in world units. Art lives in `client/components/PropArt.tsx`, one small SVG drawing per type, centered on (0,0).

| Reaction | Used by | On a miss |
|---|---|---|
| `shatter` | vase, mug, bottle, lamp | 💥 pieces + "*CRASH*" |
| `feathers` | cushion | 🪶 burst + "*poof*" |
| `leaves` | plant, bush, flower, tree | 🍃 burst + "*rustle*" |
| `quack` | duck | "*QUACK!*" |
| `spark` | toaster, TV, lamp post | ⚡ + "*bzzt*" |
| `splash` | bathtub, sink, toilet, soap, shampoo, bucket, starfish | 💦 + "*sploosh!*" |
| `squeak` | teddy | 🧸 + "*squeak!*" |
| `ring` | alarm clock, guitar, trophy | 🔔 + "*RRRING!*" |
| `boing` | beach umbrella, surfboard, beach ball | 🌀 + "*boing!*" |
| `snap` | crab | 🦀 + "*snip snap!*" |
| `thud` | everything else | "*thunk*" |

## 6. Data

```ts
Placement  { x, y, rot /* degrees */, scale /* 0.9–1.1 */ }
Prop       { id, type, x, y, rot, scale }            // what clients see, real or fake alike
Shot       { propId | null, x, y, hit, at }
Round      { n, map, hiderId, hunterId, choices[3], hiderType, hider: Placement, hiderPropId,
             props[] /* real ones */, shots[], sneaksLeft, result: 'found'|'survived'|null, points }
Room       { phase, roundIndex, rounds[], scores, deadline, startedAt, taunt {propId, until} | null,
             nextTauntAt, readyForNext, settings }
Settings   { rounds: 2|4|6, hideSec: 30|45|60, seekSec: 45|60|90, shots: 3|5|7,
             map: 'random'|'living'|'kitchen'|'park'|'bedroom'|'bathroom'|'classroom'|'beach', taunts: boolean, sneaks: 0|2|3 }
```

## 7. Socket events (namespace `/hns`)

| Event | Payload | Who / phase |
|---|---|---|
| `room:create` / `room:join` / `room:resume` / `room:leave` | as in the other games | – |
| `settings:update` | `Partial<Settings>` | host, LOBBY |
| `game:start` | `{}` | host, LOBBY, 2 connected |
| `hide:pick` | `{type}` (one of the 3 choices) | hider, HIDE |
| `hide:place` | `{x, y, rot, scale}` | hider, HIDE |
| `hide:ready` | `{}` | hider, HIDE |
| `seek:shoot` | `{propId}` | hunter, SEEK |
| `seek:sneak` | `{x, y}` | hider, SEEK, sneaks left |
| `round:ready` | `{}` | REVEAL |
| `game:rematch` | `{}` | RECAP |

Server → client: `room:state` (per viewer).

## 8. Redaction (`server/view.ts`)

| Phase | Hider sees | Hunter sees |
|---|---|---|
| HIDE | Layout, their choices, their own placement | **Nothing** but the countdown (no props, no map layout) |
| SEEK | All props, and which one is theirs (`myPropId`) | All props, **no** `myPropId`; the fake looks like any other prop |
| REVEAL / RECAP | Everything | Everything, including `hiderPropId` |

- Prop ids are random per round, and props are sent **sorted by id**, so list position leaks nothing.
- The taunt prop id is in the state only while the wiggle plays (about 1.2s).
- Session tokens are always stripped.

## 9. Timers

The server wakes for the earliest of:
- the phase deadline + 2s grace,
- the next taunt,
- the end of the current taunt (to clear it).

`tick(room, now)` handles whichever is due and returns whether to rebroadcast.

## 10. Laptop-first UI

- The game uses a **wide container** (up to ~1150px), unlike the phone-width layout of the other games.
- The map is an SVG with `viewBox="0 0 1600 1000"` that scales to the width. The side panel sits below the map on narrow windows.
- **Hider controls:**
  - drag with the mouse,
  - `Q`/`E` or ⟲/⟳ to rotate,
  - `-`/`=` or buttons to resize,
  - `Enter` for Ready.
- **Hunter:** a crosshair cursor and a hover highlight on props; clicking fires a shot.

## 11. Tests

- **Layout:** spots are filled within the map bounds, choices come from this layout's hideable types, and every prop id is unique.
- **Flow:** HIDE → SEEK on ready or timeout, the hit/miss/out-of-shots/timeout paths, role swaps, and RECAP.
- **Rules:** only the hider can place or sneak, sneak moves are limited, a prop can't be shot twice, and only the hunter shoots.
- **Scoring:** both the found and survived formulas.
- **Redaction:**
  - the hunter gets no props during HIDE,
  - in SEEK the hider prop is indistinguishable (no flag, no `myPropId`, same keys),
  - the taunt clears,
  - no tokens.
