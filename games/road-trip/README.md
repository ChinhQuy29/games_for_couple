# 🚐 Road Trip

A camper van, a winding road, and two people who each have half the controls. The **Driver** can only steer. The **Co-pilot** works the pedals and holds the only map: at every fork, only they know which town to follow. Cows wander onto the road, potholes and rocks wreck the van, and the fuel gauge keeps dropping. Inspired by *RV There Yet?* It's played at `/road-trip` in the [Games for Two](../../README.md) portal. Keyboard needed; play on a call.

## How to play

1. One of you opens **Road Trip** from the portal and creates a room. Send the code or link (`/road-trip/CODE`).
2. The host starts. A coin flip picks the first Driver. You swap seats every trip.
3. Controls:
   - **Driver:** **A/D** or **←/→** to steer (only works while rolling).
   - **Co-pilot:** **W/↑** gas, **S/↓** brake.
4. **Forks:** the road splits in two, with green signs naming a town on each side. The co-pilot's 🗺️ map lists the town to follow at each fork. The wrong one means a U-turn: you back up and stall for a few seconds.
5. **On the road:** 🐄 cows (they wander), 🕳️ potholes and 🪨 rocks damage the van and slow you down. Brown mud slows you to a crawl. Driving on the grass is slow and rattles the van apart. ⛽ cans refuel you.
6. The trip ends at the finish line, or early if the van breaks down (🔧 0%) or you run out of gas.

| Trip | Length | Forks | What's special |
|---|---|---|---|
| 🏖️ To the beach | 900 m | 3 | Gentle curves, a few cows |
| ⛰️ Mountain pass | 1100 m | 4 | Twisty, rocks on the road |
| 🌙 Night drive | 1200 m | 5 | You only see what the headlights reach |

Stars: ⭐ for arriving, another for beating the par time, and another for no wrong turns with the van at 70%+.

## Run it

From the repository root, `npm install`, then `npm run dev`. Open http://localhost:5173/road-trip.

## Files

```
games/road-trip/            # @gfc/roadtrip, built on the shared kit (../../kit)
├─ shared/index.ts          # trips, driving constants, road shape (curves + forks), types
├─ server/game.ts           # trip generation, controls split, driving sim, hits, forks, endings
├─ server/index.ts          # view (the route only for the co-pilot) + 30 Hz loop (namespace /roadtrip)
├─ server/__tests__/        # 8 unit tests, including an autopilot that finishes every trip
├─ client/Road.tsx          # the top-down canvas: road, forks, signs, obstacles, van, night
├─ client/screens.tsx       # Lobby, Drive (dashboard + map), Arrived, Finish
└─ docs/spec.md
```

## Tests

```bash
npm test -w @gfc/roadtrip
```

The tests cover:
- forks (both branches are road, the middle isn't), and every trip's layout,
- the controls split (the driver's gas does nothing), obstacles and fuel, wrong turns,
- breaking down and running out of gas,
- an autopilot that finishes all three trips for several seeds with no wrong turns,
- the route is hidden from the driver.
