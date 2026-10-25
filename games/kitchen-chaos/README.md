# 🍳 Kitchen Chaos

A tiny restaurant for two. One of you preps, the other cooks, and the only way across is the pass in the middle. Tickets keep coming, the meat is burning, and somebody put a raw onion on the plate. Inspired by *Overcooked*. It's played at `/kitchen` in the [Games for Two](../../README.md) portal. Best on laptops, on a call.

> **Who goes first:** in the lobby, the host picks who preps in the first shift (the other cooks): 🎲 random, themselves, or their partner. Roles still swap after that.

## How to play

1. One of you opens **Kitchen Chaos** from the portal and creates a room. Send the code or link (`/kitchen/CODE`).
2. The host picks a level and opens the kitchen. A coin flip decides who preps first. After a 3-2-1, the 3-minute shift starts.
3. Everything is a click. Click a station with something in your hands to put it down; click it with empty hands to pick up. You hold one thing at a time.
   - **🔪 Prep side:** ingredient crates (click again to put one back), two chopping boards (put something down, then click 5 times to chop), a trash can.
   - **🍽️ The pass:** three slots in the middle. Both of you can use them.
   - **🔥 Cook side:** three stoves (7s to cook, then 8s before it **burns** 💨), a plate stack, two counters to build dishes on, the serving window 🛎️, a trash can.
4. Build a dish on a plate: put a plate on a counter and drop parts onto it, or hold the plate and click parts to scoop them up. Bring the plate to 🛎️.
5. Serve what's on the tickets before the patience bar runs out. You see both halves of the kitchen, so you can watch your partner panic.
6. After the shift you get ⭐ to ⭐⭐⭐. Press **Next shift** and you swap sides.

### Recipes

The ticket shows each part: 🔪 means chopped, 🔥 means cooked.

| Dish | Parts | Levels |
|---|---|---|
| 🥗 Salad | chopped lettuce, chopped tomato | 1, 2, 3 |
| 🍔 Burger | bun, cooked meat, chopped lettuce | 1, 2, 3 |
| 🍲 Tomato Soup | chopped + cooked tomato, chopped + cooked onion | 1, 2, 3 |
| 🍣 Sushi | chopped fish, cooked rice, seaweed | 2, 3 |
| 🌮 Taco | tortilla, chopped + cooked meat, chopped cheese | 2, 3 |
| 🍳 Omelette | cooked egg, chopped + cooked mushroom, chopped cheese | 3 |
| 🍛 Fried Rice | cooked rice, cooked egg, chopped onion | 3 |

### Coins and stars

- A served dish pays 10 coins per part, plus a tip of up to 10 for speed.
- An order that walks out costs 10 (you never go below 0).

| Level | New order every | Patience | Stars at |
|---|---|---|---|
| 🍳 Lunch rush | 20s | 75s | 40 / 100 / 160 |
| 🍳🍳 Dinner service | 17s | 70s | 60 / 140 / 220 |
| 🍳🍳🍳 Kitchen nightmare | 14s | 65s | 80 / 180 / 280 |

## Run it

From the repository root, `npm install`, then `npm run dev`. Open http://localhost:5173/kitchen.

## Files

```
games/kitchen-chaos/        # @gfc/kitchen, built on the shared kit (../../kit)
├─ shared/index.ts          # ingredients, recipes, levels, timing, types, schemas
├─ server/game.ts           # rules: the kitchen layout, clicks, cooking, orders, scoring
├─ server/index.ts          # view + registerGame() wiring (namespace /kitchen)
├─ server/__tests__/        # 10 unit tests
├─ client/                  # KitchenApp, screens (Lobby, Shift, Summary), Food icons
└─ docs/spec.md
```

## Tests

```bash
npm test -w @gfc/kitchen
```

The tests cover:
- recipe matching, and crates for every level,
- the countdown and the first order,
- sides and the pass,
- chopping, cooking and burning (including when nobody comes back),
- a full salad from crate to coins,
- refused dishes and the trash,
- expired orders and stars,
- swapping sides.
