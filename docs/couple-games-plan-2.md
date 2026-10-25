# Couple games plan, part 2: 5 more games

> **Status: all 5 built and pushed (2026-10-25):** 🔐 [Escape Room for Two](../games/escape-room/README.md) · 📦 [Handle With Care](../games/handle-with-care/README.md) · 🚐 [Road Trip](../games/road-trip/README.md) · 🕵️ [Codenames Duet](../games/codenames-duet/README.md) · 🦎 [Paint & Hide](../games/paint-hide/README.md). Each game's `docs/spec.md` describes what was actually built.
>
> Written 2026-10-25, before building. Picked by the user from a list of 10 ideas (#4–#8). Each game gets its own folder under `games/` with a README and `docs/spec.md`, is built on the shared kit (`kit/`), and is committed and pushed when done. Part 1 is [coop-games-plan.md](coop-games-plan.md).

## Research summary

- **Friendslop:** the cheap, chaotic co-op games on Steam. R.E.P.O., PEAK, Schedule I and RV There Yet? were 4 of 2025's 10 best-selling Steam games, and Meccha Chameleon (2026) sold a million in days.
- **Couple lists:** It Takes Two / Split Fiction, Portal 2 co-op, We Were Here (asymmetric escape rooms) and Codenames lead them.

Sources:
- [Game World Observer: the friendslop niche](https://gameworldobserver.com/2026/08/03/analyst-there-are-many-games-in-the-friendslap-niche-but-it-is-not-oversaturated)
- [Inverse: friendslop](https://www.inverse.com/gaming/friendslop-peak-repo-fortnite-trend)
- [Two Average Gamers: co-op games for couples](https://www.twoaveragegamers.com/best-co-op-games-for-couples-who-hate-toxicity-2026/)
- [GameGeeker: best co-op on Steam](https://gamegeeker.com/editors-picks/best-co-op-games-on-steam?market=US)

## Build order

### 1. 🔐 Escape Room for Two (from *We Were Here* / *Portal 2* co-op), `/escape`

- **Idea:** you're locked in two different rooms. Every puzzle has its clue on one screen and its controls on the other. You only escape by describing things.
- **Puzzles** (answers randomized every game):
  1. **Symbol dial:** a 4-dial lock on one side, the mural with the order on the other.
  2. **Counting code:** one side has a note saying which objects make each digit; the other has a cluttered shelf to count them.
  3. **Color sequence:** a stained-glass window on one side, the colored buttons on the other.
  4. **Levers:** one side has a ☀/☾ pattern, the other the legend and the levers.
  5. **Dark maze:** one side has the map; the other walks it blind.
- **Rooms:** 3 rooms, 4 puzzles each, alternating who acts.
- **Scoring:** time plus 15s for every mistake. Roles alternate per room.

### 2. 📦 Handle With Care (from *R.E.P.O.*), `/carry`

- **Idea:** a side-view house full of valuables. Carry them to the moving truck before time runs out.
- **Carrying:** small items take one person, and can be thrown. Big ones (the TV, the piano, the fish tank) need **both of you** grabbing, and can't be jumped with.
- **Damage:** drops, falls and bumps chip the value; fragile items break.
- **Rounds:** 3 houses, 3 minutes each, scored in $. Physics copied from Tethered at 30 Hz.

### 3. 🚐 Road Trip (from *RV There Yet?*), `/road-trip`

- **Idea:** a top-down scrolling road. The **Driver** steers, the **Co-pilot** has the pedals and the only map.
- **On the road:** junctions (take the wrong branch and you lose time), cows, potholes, mud, a fuel gauge and fuel cans.
- **Rounds:** 3 trips; roles swap each one. Server sim at 30 Hz.

### 4. 🕵️ Codenames Duet (from *Codenames Duet*), `/codenames`

- **Idea:** 25 words. Each of you holds a different secret key: 9 agents and 3 assassins each, with overlaps (15 agents in total).
- **Turns:** take turns giving a one-word clue and a number; the other guesses with the clue-giver's key. A bystander ends the turn, an assassin ends the game.
- **Limits:** 9 turns. English or Vietnamese words.

### 5. 🦎 Paint & Hide (from *Meccha Chameleon*), `/paint-hide`

- **Idea:** the Hider places a chameleon on a busy generated scene and paints it to blend in, with an eyedropper, brushes and fill.
- **Seeking:** the Seeker gets 25 seconds and 3 clicks to find it.
- **Rounds:** 4 rounds, swapping roles. Points for staying hidden, and for finding it fast.
