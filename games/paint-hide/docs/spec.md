# Paint & Hide: Spec

## The scene (`shared/scene.ts`)

- **Generation:** `buildScene(seed, 1200, 750)` uses a mulberry32 RNG to pick one of 5 palettes, then a background color and layers of shapes:
  - 7 rotated rectangles, 14 blobs, 60 leaves, 28 flowers and 160 dots.
- **Network:** only the seed is sent; each client draws the same scene once into an offscreen canvas (`sceneCanvas`), which is also the eyedropper's source.

## The chameleon (`shared/index.ts`)

- **Shape:** a union of 9 ellipses in its own coordinates (body, head, snout, tail, curl, legs, crest), drawn at `CREATURE_SCALE` 0.75.
- **Placement:** `{x, y, rot°, flip}`. `toLocal` inverts it (translate, unscale, rotate back, unflip).
- **Hit test:** `hits(placement, x, y)` checks the point against the ellipses, with 6 units of padding so edge clicks count.
- **Paint:** a TEX canvas (240 × 120) covering the creature's bounding box in local coordinates. The client clips it to the outline when drawing.

## Rules (`server/game.ts`)

- **Phases:** LOBBY → HIDE → SEEK → REVEAL, ×4 rounds (both ready between rounds), then FINISH. "Rematch" (host) goes back to LOBBY.
- **HIDE** (80s):
  - `hide {x, y, rot, flip, paint}` (hider only); `paint` is a PNG data URL of up to 500 KB.
  - Clamps the position and starts SEEK.
  - If nothing arrives by the deadline + 4s grace (the client auto-submits at −1.5s), the creature goes to a random spot, unpainted.
- **SEEK** (25s):
  - `click {x, y}` (seeker only, up to 3).
  - A hit → REVEAL; found, with points 100 + 4 × whole seconds left.
  - The third miss or the timer → REVEAL; not found, 150 to the hider.
- **Rounds:** the hider alternates every round, with a new seed each time.

## View

- The seeker gets `placement` and `paint` only once SEEK starts. They're needed to draw it, so the pixels are an honor system like Bomb Squad's manual.
- Everyone sees the seed, the clicks (live), scores and results.

## Client

- **Hider studio:**
  - **Move** drags the placement.
  - **Brush:** strokes are converted to local/TEX coordinates and drawn clipped to the outline (`creaturePath(TEX.ox, TEX.oy)`); the line width is the brush size / scale.
  - **Eyedropper** reads the scene canvas pixel. **Fill** paints the whole texture.
  - **Palette:** 8 colors sampled from the scene, plus white and dark.
- **Board** (seek/reveal): the scene, the creature (texture clipped, or plain green when unpainted), and ❌/✅ markers. In the reveal, a pink dashed outline.
