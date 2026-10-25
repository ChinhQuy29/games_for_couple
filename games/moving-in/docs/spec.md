# Moving In: Spec

## World

- **Layout:** each room is a front view (a dollhouse cut-away) of 1600 × 900 world units. The floor starts at y = 760.
- **Item positions:** an item's position is its **bottom-centre**, and its size comes from `KINDS` (43 kinds).
- **Furniture:** scenery only, `{type, x, y, w, h}`. The top edge `y` is the surface things rest on.
- **Slots:** `{x, y, kind, owner?}` mark where items belong.
- **Boxes:** each room has two box lists of 6 kinds, one per player. The slot kinds match the box contents exactly (a test checks this).
- **Room 1** puts an `owner` on every slot, so your pillow only counts on your own bed.

## Rules (`server/game.ts`)

- **Phases:** LOBBY → UNPACK → CLEAR, then UNPACK of the next room (both ready), or FINISH after room 6. "Rematch" (host) goes back to LOBBY.
- **Lobby settings:** the starting room, and `swapBoxes`. By default seat 0 (the host) gets box A and seat 1 box B; swapping flips it.
- **`unpack`:** the next item from my box comes out on top of my box, fanned out by its box position so items don't hide each other.
- **`grab {item}`:** any unboxed item, unless the other player holds it (`TAKEN`). It leaves its slot.
- **`drop {item, x, y}`:**
  - the position is clamped to the room;
  - it snaps to the nearest **free** slot within 70 units, whatever its kind (strict: a wrong item can sit in a slot and simply doesn't count);
  - otherwise the item stays where it was dropped (near the floor it rests on the floor).
- **Correct** means `slot.kind === item.kind`, and the owner matches if the slot has one.
- **Room done:** every item unboxed and correct → CLEAR, with the time and the hints used.
- **`hint`** (3 per room, shared):
  - it picks an unboxed item that isn't right (or a boxed one if none is out), plus a slot of its kind not already correctly filled;
  - it shows for 4 seconds, via `wakeAt`/`tick`.
- **Red glow** (`wrongItems`): only when both boxes are empty, the ids of the items that aren't right.

## View and network

- **Slots:** the view sends slot **positions only**. Which kind belongs where never leaves the server, except through a hint.
- **Items:** their kind, owner, position and slot index are public (both of you see the room). Both boxes' remaining counts too.
- **Live dragging:** this doesn't touch the state. The client emits `drag {item, x, y}` (~30/s). The server relays it to the partner only if that player really holds the item. Drops go through the `drop` action and a normal broadcast.

## Client

- The scene is one SVG. Pointer events convert to world coordinates with `getScreenCTM()`.
- **While dragging:** the item follows the pointer (keeping the grab offset), every slot shows as a faint dot, and the snap target shows as a green circle.
- **Partner's items:** what your partner holds gets a dashed ring in their seat color.
- **Pairs:** variants (0, 1, …) per kind give pairs different colors. The frames show a picture for each room of the story.
- **Photos:** `SolvedScene` draws a room with every slot filled. It's used for the polaroid after each room and the final album.

## Ideas for later

- Bigger items, more decoration per room. The rooms read a little sparse at full size.
- Sounds (box rustle, snap pop), a "both hands on it" heavy item, and personal items (your photos, her favourite things).
