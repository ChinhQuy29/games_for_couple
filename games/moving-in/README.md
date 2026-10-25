# 📦 Moving In

A two-player take on *Dreamy Room* (and *Unpacking*, which inspired it). You each have your own box of stuff. Unpack it, drag every item to the one spot where it belongs, and tidy six rooms together. The rooms tell a long-distance story without a single word: two bedrooms on a video call, a visit, then a first home together. It's played at `/moving-in` in the [Games for Two](../../README.md) portal. Best on laptops with a mouse or trackpad.

## How to play

1. One of you opens **Moving In** from the portal and creates a room. Send the code or link (`/moving-in/CODE`).
2. The host can pick the starting room and **whose stuff is whose** (which of you gets the box with the plushies). Then start.
3. **Click your box** (the one with your name and color tape) to take out the next item. It lands on top of the box.
4. **Drag** items around the room. Near a spot where something can go, a green circle shows where it will snap.
5. **Every item has exactly one right spot.** Identical items (two mugs, two pillows, the frames) can swap with each other. In room 1, your things only count in *your* half of the screen.
6. Once an item is out of its box, **either of you can move it**. Your partner's drags show live, with their color around whatever they're holding.
7. When both boxes are empty, anything in the wrong place **glows red**.
8. **💡 Hint:** 3 per room, shared between you. A hint shows a ghost outline of where one item belongs for a few seconds.
9. Finish a room and you get a 📸 polaroid of it, with your time and hints used. After room 6 you get the whole photo album.

| # | Room | The story |
|---|---|---|
| 1 | Two rooms, one call | Two bedrooms, far apart, split by a phone call |
| 2 | The visit | A tiny hotel room, two suitcases' worth of stuff |
| 3 | Our first bedroom | One bed, two pillows, a gaming desk and a plushie shelf |
| 4 | Our kitchen | Two mugs, a worrying amount of instant noodles |
| 5 | Our bathroom | Two toothbrushes, one cup |
| 6 | Our living room | Photos of every room so far, a Liên Quân poster and an SGP one |

## Run it

From the repository root, `npm install`, then `npm run dev`. Open http://localhost:5173/moving-in.

## Files

```
games/moving-in/            # @gfc/movingin, built on the shared kit (../../kit)
├─ shared/rooms.ts          # item kinds and sizes, furniture, the 6 rooms: slots and box contents
├─ shared/index.ts          # room/item/view types, schemas
├─ server/game.ts           # unpack, grab, drop + snap, correctness, hints, room flow
├─ server/index.ts          # view (slot kinds stay secret) + live drag relay (namespace /movingin)
├─ server/__tests__/        # 12 unit tests
├─ client/ItemArt.tsx       # 43 hand-drawn SVG items
├─ client/FurnitureArt.tsx  # the furniture and decorations (curtains, fairy lights, plants, lamps…)
├─ client/Scene.tsx         # a room (and a finished room, for the photos)
├─ client/RoomView.tsx      # boxes, dragging, snapping preview, hints, red glow, partner drags
├─ client/screens.tsx       # Lobby, Unpack, Clear (polaroid), Finish (album)
└─ docs/spec.md
```

## Tests

```bash
npm test -w @gfc/movingin
```

The tests cover:
- the room data: every boxed item has exactly one slot, everything fits on screen, different slots are far enough apart,
- unpacking your own box in order, swapping boxes,
- snapping and free drops, sharing items without both grabbing at once, the room-1 ownership rule,
- solving all 6 rooms, identical items swapping, the red glow only after the boxes are empty,
- hints (3 per room, fading), and that the view never reveals which kind goes in which slot.
