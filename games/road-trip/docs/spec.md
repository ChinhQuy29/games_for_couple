# Road Trip: Spec

## The road (`shared/index.ts`)

- **Coordinates:** `d` is the distance along the route, `x` is sideways.
- **Shape:** the centre is `roadCenter(curve, d)`, a sum of 3 seeded sine waves scaled by the trip's `curve`. The road is ±3.2 wide.
- **Forks:** at each junction `d`, the branch offset `forkSpread` ramps 0 → 5 over [d−45, d−15], holds until d, then closes over [d, d+30]. During a fork, both branches are road and the middle is grass (`onRoad`).

## Trips (`server/game.ts`, `buildTrip`)

- **Forks:** spaced evenly with jitter. A random correct side; signs name two towns. The route is the list of correct towns.
- **Obstacles:** cows (moving), potholes, rocks and mud, placed ≥ 18 apart and never within [j−55, j+40] of a fork or in the first 60 / last 30 units. Fuel cans every ~250 units.

## Rules

- **Phases:** LOBBY → DRIVE → ARRIVED, then DRIVE of the next trip with seats swapped (both ready), or FINISH after the last trip (6). The host's `settings:update {startTrip}` (lobby) picks the first trip. Obstacles that find no free spot (away from forks and each other) are skipped. "Rematch" (host) goes back to LOBBY.
- **`input`** (quiet): `{left, right, gas, brake}` from both players. `controls(room)` takes left/right from the Driver and gas/brake from the Co-pilot.
- **Step** (30 Hz, after the countdown):
  - **Cows** wander and bounce off the road edges.
  - **Speed:** top speed is 12, mud 5, grass 6. Gas accelerates at 6/s (only with fuel), brake 14/s, coasting 1.5/s.
  - **Steering:** 5/s, scaled by min(1, speed/5).
  - **Fuel:** 0.15 per unit of distance.
  - **Grass** costs 4 hp/s while moving.
  - **Hits** (each obstacle once):
    - cow: −12 hp, speed ≤ 2;
    - pothole: −6 hp, speed × 0.6;
    - rock: −15 hp, speed × 0.3;
    - fuel: +40.
  - **Forks:** when `d` passes a junction, the side is left if x < centre.
    - Right side: a cheer.
    - Wrong side: back up 40, stall 4s, recentre, and the junction re-arms.
  - **Ends:** hp 0 → `broke-down`; fuel 0 and stopped → `out-of-gas`; `d ≥ length` → `arrived`.
- **Broadcasts:** a full broadcast whenever the feed changes (hits, forks, endings).

## View

- Everyone sees the road shape, obstacles (with hit flags) and signs.
- `route` goes only to the Co-pilot while driving (and to everyone after). The correct side of each fork is never sent.
- **Frames:** `{t, d, x, speed, hp, fuel, stalled, cows near the van}`.

## Client

- **Canvas** (`Road.tsx`): 30 units wide, with the van at 86% of the height and a camera easing between the van and the road ahead. It draws the trip's scene first (ground colour, a texture that scrolls with the road, and roadside things placed by a hash of the distance, under the road so forks never cover them), then the road strips per branch, dashed centre lines, signs 30 units before each fork, obstacles, the finish line and the van.
- **Night:** a radial darkness except the headlights, and obstacles beyond 20 units are hidden.
- **Sidebar:** the role card, the speedometer, fuel and van meters, a progress bar with fork marks, and the map (co-pilot) or a reminder to ask (driver).
