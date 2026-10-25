# 🦎 Paint & Hide

One of you drops a chameleon onto a crazy painted scene, flowers, leaves, dots and all, and paints it to vanish. The other gets **25 seconds and 3 clicks** to find it. Steal colors with the eyedropper, paint the stripes right across its body, tuck it half behind a flower… Inspired by *Meccha Chameleon*. It's played at `/paint-hide` in the [Games for Two](../../README.md) portal. Best with a mouse.

> **Who goes first:** in the lobby, the host picks who hides first: 🎲 random, themselves, or their partner. Roles still swap after that.

## How to play

1. One of you opens **Paint & Hide** from the portal and creates a room. Send the code or link (`/paint-hide/CODE`).
2. The host starts. A coin flip picks the first **Hider**; you swap every round (4 rounds).
3. **Hiding (80 seconds):** your partner sees a curtain. You get a new random scene and a bright green chameleon. Tools:
   - ✋ **Move** to drag it, ↺ ↻ to rotate, ⇋ to flip,
   - 🖌️ **Brush** in 3 sizes, and a palette made from the scene's own colors,
   - 💧 **Eyedropper**: click anywhere on the scene to take that exact color,
   - 🪣 **Fill all** for a quick base coat.

   The dashed outline is only on your screen. Press **Done hiding ✅**; it also submits on its own when the time runs out.
4. **Seeking (25 seconds):** the Seeker clicks where they think it is, up to 3 times. Both of you see the ❌ / ✅ marks live.
5. **Reveal:** the chameleon is outlined.
   - Found: the Seeker gets 100 + 4 for every second left.
   - Not found: the Hider gets 150.
6. After 4 rounds, the most points wins.

## Run it

From the repository root, `npm install`, then `npm run dev`. Open http://localhost:5173/paint-hide.

## Files

```
games/paint-hide/           # @gfc/paint, built on the shared kit (../../kit)
├─ shared/scene.ts          # the seeded scene generator (both screens draw the same scene)
├─ shared/index.ts          # the chameleon shape, placement maths, hit test, types, schemas
├─ server/game.ts           # rounds: hide (with a fallback), seek, clicks, scoring, timers
├─ server/index.ts          # view (no creature for the seeker while hiding) + registerGame() (namespace /paint)
├─ server/__tests__/        # 7 unit tests
├─ client/canvas.ts         # drawing the scene and the painted creature
├─ client/screens.tsx       # Lobby, Hide (the paint studio), Seek, Reveal, Finish
└─ docs/spec.md
```

## Tests

```bash
npm test -w @gfc/paint
```

The tests cover:
- the hit test (body, tail, rotation, flipping), and the scene being deterministic,
- only the hider hides, and the seeker gets nothing until seeking starts,
- scoring a hit (faster is better), three misses, the timer,
- the unpainted fallback when a hider never submits,
- roles swapping and the end of the game.
