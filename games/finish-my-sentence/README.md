# ✍️ Finish My Sentence

You start a sentence, your partner finishes it, usually without seeing the whole thing. Then you reveal both, dramatically. It's played at `/fms` in the [Games for Two](../../README.md) portal.

## How to play

1. One of you opens **Finish My Sentence** from the portal, enters a name, and taps **Create a room**.
2. Send your partner the 4-letter code or the link (`/fms/CODE`). They enter a name and join.
3. The host picks the settings and taps **Let's go!**

Each round has three steps, and you both play every step at the same time:

| Step | What you do |
|---|---|
| **Start** | Write the first half of a sentence for your partner, or tap 🎲 **Deal me one** to get a random starter from the deck (2 re-rolls per round). |
| **Finish** | You get your partner's starter and write the ending. How much of the starter you see depends on the mode. Most rounds add a silly rule like "🏴‍☠️ Write it like a pirate". |
| **Reveal** | Each of you reveals the sentence that started with your words. It types out, pauses dramatically, then the ending slams in. React with 😂 💀 ❤️ 🍅 🤯 and rate how hard you laughed. |

After the last round, the recap hands out 🏆 **Line of the Night**, 🤡 **Most Unhinged** and 💘 **Accidentally Romantic**. Then you can rematch.

### Modes

| Mode | What the finisher sees |
|---|---|
| 👀 Classic | The whole starter |
| 🫣 Peek (default) | Only the last 2 words, plus the word count |
| 🙈 Blind | Only the word count. Pure chaos. |

### Settings (host only)

Rounds (3, 5, 7 or 10), timer per step (30–90 seconds, or off), silly rules on or off, and deck categories: 💑 Us, ✈️ Long distance, 🦆 Absurd, 🍜 Food, 🌱 Life, 🤔 What if, 🙊 Confessions, and 🌶️ Spicy, which is opt-in.

If time runs out, whatever you typed is sent. If you typed nothing, the game fills in for you: a deck starter, or an ending like "[is buffering… please hold]".

## Run it

From the repository root:

```bash
npm install
npm run dev
```

Open http://localhost:5173/fms. To play both sides on one computer, open the room link in a second tab; each tab is its own player.

## How it works

- **The server decides everything.** The client sends what a player wants to do; the server checks it, updates the room, and sends each player their own snapshot (`room:state`).
- **`server/game.ts`** holds all the rules as plain functions. It does no I/O, and time and randomness are passed in, so the tests are deterministic.
- **`server/view.ts`** builds each player's snapshot and removes anything they shouldn't see: the hidden part of a starter in Peek and Blind, endings that aren't revealed yet, the other player's rating until the recap, and session tokens.
- **Real-time:** a Socket.IO namespace, `/fms`, on the shared server. Rooms are kept in memory, so restarting the server ends any games in progress.
- **Reconnecting:** the session token is kept in the tab's `sessionStorage`, so reloading the page puts you back in the game.

## Files

```
games/finish-my-sentence/     # workspace package @gfc/fms
├─ client/    # React UI → exported as @gfc/fms/client (FmsApp)
├─ server/    # rules, rooms, timers, redaction, socket wiring → @gfc/fms/server (registerFms)
│  └─ content/   # starter deck (162), silly rules (17), AFK endings (15)
├─ shared/    # types, zod event schemas, constants used by both sides
└─ docs/
   └─ spec.md   # the full build spec: rules, events, data model, milestones
```

It plugs into the portal in four places at the repo root: the registry entry in `shared/src/games.ts`, the route in `client/src/App.tsx`, `registerFms(io)` in `server/src/index.ts`, and an `@source` line in `client/src/styles.css`. It also uses the portal's shared theme from that stylesheet.

## Tests

```bash
npm test -w @gfc/fms
```

21 unit tests cover the round flow, the deck, the timers, and the redaction guarantees (for example, that the full starter never reaches the finisher in Peek or Blind mode).

## Status

Playable end to end. Still to do: sound effects, the 🔊 narrator voices, confetti, a Hall of Fame, saving a sentence as an image, and end-to-end tests. See the milestones in [docs/spec.md](docs/spec.md#11-milestones-build-in-this-order).
