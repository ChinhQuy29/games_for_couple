# 🔦 Ghost Hunt

One of you creeps through a dark, haunted house with a flashlight. The other sits at the "van" with the floor plan, two camera feeds, an EMF meter and a thermometer, but can never see the ghost. Together you find the evidence, name the ghost in the journal, and get out the front door. Inspired by *Phasmophobia*. It's played at `/ghost` in the [Games for Two](../../README.md) portal. Best on laptops, on a call, lights off.

## How to play

1. One of you opens **Ghost Hunt** from the portal and creates a room. Send the code or link (`/ghost/CODE`).
2. The host starts. A coin flip picks the first **Explorer**; the other is the **Navigator**. Roles swap every game.
3. **Explorer:** walk with **WASD** or the arrow keys. You only see what your flashlight hits (and a little around you); the tiles you've seen stay on your map, dimmed. Tools:
   - **F** UV light on/off (handprints show up on doorways),
   - **Q** spirit box (ask the ghost something; sometimes it answers),
   - **B** put the book down (come back later to see if it's been written in),
   - **C** set up a camera in this room (2 cameras; a third moves the oldest),
   - **Space** hide in a closet 🚪 / come out.
4. **Navigator:** you see the whole floor plan and where the Explorer is. Tell them where to go. You also get:
   - the **EMF** level and **temperature** of the room the Explorer is in,
   - the **camera feeds**: ghost orbs, and **MOTION** when the ghost moves through that room.
5. Both of you share the **journal**: mark evidence ✔ / ✘ and the ghost list crosses out what it can't be. Pick a guess.
6. Walk out the **EXIT** with a guess in the journal. Right guess = you escape and win.

### Danger

- The Explorer's **sanity** drops over time, faster near the ghost.
- When it's low enough, the ghost may **hunt**: the lights flicker for 3 seconds, then it chases the Explorer for 15. The front door is locked during a hunt. Hide in a closet, or run around a loop of rooms. If it reaches you, you lose.
- You have 10 minutes before sunrise.

### Evidence and ghosts

| Evidence | How to find it |
|---|---|
| 📟 EMF 5 | The Navigator's EMF hits 5 while the Explorer is in the ghost room (1–4 just means it's near). |
| 🥶 Freezing | The temperature in the ghost room is below 0°C. (A cold room around 7°C means ghost room, not this evidence.) |
| 🔮 Ghost orbs | A camera in the ghost room shows orbs. |
| 📓 Ghost writing | A book left in the ghost room gets written in after 8–20 seconds. |
| 📻 Spirit box | The spirit box sometimes answers in the ghost room. |
| 🖐️ Handprints | With UV on, the ghost room's doorways show handprints. |

| Ghost | Evidence | Behavior |
|---|---|---|
| Spirit | EMF, spirit box, writing | Hunts only at very low sanity |
| Wraith | EMF, spirit box, freezing | Sometimes glides an extra tile while hunting |
| Phantom | spirit box, handprints, orbs | Drains sanity twice as fast when near |
| Poltergeist | spirit box, handprints, writing | Lots of spooky noises in the feed |
| Banshee | handprints, orbs, freezing | Wanders out of its room more |
| Jinn | EMF, handprints, freezing | Rarely leaves its room |
| Mare | spirit box, orbs, writing | Hunts early |
| Demon | handprints, writing, freezing | Hunts early and often |

## Run it

From the repository root, `npm install`, then `npm run dev`. Open http://localhost:5173/ghost.

## Files

```
games/ghost-hunt/           # @gfc/ghost, built on the shared kit (../../kit)
├─ shared/map.ts            # the house (rooms → tile grid), line of sight, flashlight, pathfinding
├─ shared/index.ts          # ghosts, evidence, timing, state and view types, schemas
├─ server/game.ts           # rules: tools, moves, the ghost simulation (5 ticks/s), hunts, endings
├─ server/index.ts          # per-role views (redaction) + registerGame() wiring (namespace /ghost)
├─ server/__tests__/        # 13 unit tests
├─ client/                  # GhostApp, Maps (explorer + navigator SVG, key handling), screens
└─ docs/spec.md
```

## Tests

```bash
npm test -w @gfc/ghost
```

The tests cover:
- the house (everything reachable, the flashlight and walls),
- unique evidence per ghost and journal filtering,
- moves (rate limit, walls, Navigator can't move),
- each kind of evidence appearing only for the right ghost and room,
- hunts and getting caught, hiding,
- leaving with a right/wrong/no guess, the time limit, role swaps,
- redaction: the Explorer's limited tiles, and nobody ever receives the ghost type, room or position.
