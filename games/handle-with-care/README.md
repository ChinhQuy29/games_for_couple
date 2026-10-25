# 📦 Handle With Care

You're two very unqualified movers. Get the valuables out of the house and into the truck before time runs out. Small things take one pair of hands (and can be thrown, if you're brave). The TV, the piano, the fish tank and the sofa need **both of you** holding on at once, walking in step. Every bump and drop costs money, and fragile things break. Inspired by *R.E.P.O.* It's played at `/carry` in the [Games for Two](../../README.md) portal. You need a keyboard.

## How to play

1. One of you opens **Handle With Care** from the portal and creates a room. Send the code or link (`/carry/CODE`).
2. The host starts. After a 3-2-1 you're in the first house.
3. Controls:
   - **A/D** or **←/→**: walk. **W**, **↑** or **Space**: jump.
   - **E**: pick up whatever is in reach / put it down.
   - **F**: throw what you're holding (small things only).
4. Small things ride over your head. 🫂 Big things need both of you: each grabs (E) one end and it lifts. Walk together: if you pull apart, it drops. You're slower and can't jump while carrying something heavy.
5. Carried things bump into door frames and ceilings (💥 −$). Drops and throws hurt them when they land hard. Fragile things (the vase, the plates, the fish tank) lose value fastest, and break at $0.
6. Put things down in the green **🚚 truck** zone outside to load them. The house ends when the time runs out or everything is loaded or broken.

| House | Time | What's tricky |
|---|---|---|
| 🏠 The studio | 2:30 | A loft (jump up via the step) and your first TV and sofa |
| 🏡 The family house | 2:30 | Small stuff upstairs; the piano and fish tank stay on the ground floor |
| 🏰 The mansion | 3:00 | The sofa and TV are upstairs: ride the freight lift down together |

## Run it

From the repository root, `npm install`, then `npm run dev`. Open http://localhost:5173/carry.

## Files

```
games/handle-with-care/     # @gfc/carry, built on the shared kit (../../kit)
├─ shared/physics.ts        # copied from Tethered, generalised: every body has its own size
├─ shared/levels.ts         # the 10 kinds of valuables and the 3 houses
├─ shared/index.ts          # room, item, frame and view types, input schema
├─ server/game.ts           # grabbing, carrying (alone or together), throwing, damage, the truck
├─ server/index.ts          # view + registerGame() with a 30 Hz loop (namespace /carry)
├─ server/__tests__/        # 10 unit tests
├─ client/Stage.tsx         # the canvas: house, truck, lift, valuables, movers
├─ client/screens.tsx       # Lobby, Move, Done, Finish
└─ docs/spec.md
```

## Tests

```bash
npm test -w @gfc/carry
```

The tests cover:
- the houses (sizes, start, truck, items resting on something),
- the countdown and settling without damage,
- carrying small things, big things needing two, pulling apart, no jumping when heavy,
- throwing and landing damage, breaking, loading the truck,
- carrying the TV through the doorway into the truck,
- the time limit and the next house, the view.
