# 🖍️ Telephone Doodle

The drawing game of broken telephone, made for two. You draw a prompt, your partner guesses what it is, you draw their guess, they guess that… and at the end you watch how "a dog driving a bus" became "a sad table". It's played at `/doodle` in the [Games for Two](../../README.md) portal.

## How to play

1. One of you opens **Telephone Doodle** from the portal, enters a name, and taps **Create a room**.
2. Send your partner the 4-letter code or the link (`/doodle/CODE`). They join.
3. The host picks the settings and taps **Let's go!**

Each round you run **two chains at once**, one started by each of you, so nobody waits around:

| Step | You | Your partner |
|---|---|---|
| Prompt | Get a prompt from the deck (🎲 re-roll twice) or write your own | Same, for their chain |
| 1 · Draw | Draw **your** prompt | Draw **their** prompt |
| 2 · Guess | Guess **their** drawing | Guess **your** drawing |
| 3 · Draw | Draw their guess of your drawing | Draw your guess of theirs |
| 4 · Guess | … | … |

You only ever see the one step right before yours: the guesser never sees the original words. Then comes the **reveal**: you step through each chain together, drawings replay stroke by stroke, and each chain ends with a "Started as → Ended as" card. React with 😂 💀 ❤️ 🤯 🎨. After the last round, the **gallery** shows every chain, and the one with the most reactions wins 🏆 Most lost in translation.

### Chaos rules

When chaos is on, most drawing steps come with a rule:

| Rule | What happens |
|---|---|
| 🙈 Blind draw | Your lines stay invisible until you submit |
| ✏️ One stroke | You can't lift your pen |
| 🖐️ Five strokes max | Choose wisely |
| 🪞 Mirror hands | Left is right and right is left |
| ⚫ One color | No palette for you |
| 🫨 Shaky hands | Your lines wobble |
| 🐜 Tiny brush | Smallest brush only |

### Settings (host only)

Rounds (1–3), chain length (2, 4 or 6 steps; it always ends on a guess), drawing time (45/60/90 seconds or off), guessing time (20/30/45 seconds or off), and chaos rules on or off. If time runs out, whatever you've drawn or typed is sent. An empty page or a "¯\\_(ツ)_/¯" is sent if there's nothing.

## Run it

From the repository root:

```bash
npm install
npm run dev
```

Open http://localhost:5173/doodle. To play both sides on one computer, open the room link in a second tab.

## How it works

- **The server decides everything.** Clients send intents (submit a drawing, reveal the next step); the server checks them, updates the room and sends each player their own snapshot.
- **`server/game.ts`** holds the rules as plain functions, with time and randomness passed in. In a chain, the owner draws and the partner guesses: step `s` of the chain owned by player `o` is played by player `(o + s) % 2`.
- **`server/view.ts`** is strict about secrets. During play, each player receives only their task (the one entry before their step). During the reveal, chains unlock one entry at a time. Chaos plans and session tokens never leave the server.
- **Drawings** are lists of strokes on a 1000×1000 grid (color index, brush index, flat x/y list), so they look the same on any screen and stay small. The server validates them (bounds, at most 300 strokes and 12,000 points) and enforces the chaos rules it can (one stroke, five strokes, one color, tiny brush). Blind, mirror and shaky are applied while drawing.
- **Real-time:** the Socket.IO namespace `/doodle` on the shared server. Rooms are kept in memory.

More detail in [docs/spec.md](docs/spec.md).

## Files

```
games/telephone-doodle/      # workspace package @gfc/doodle
├─ client/        # React UI → @gfc/doodle/client (DoodleApp)
│  ├─ components/ # DrawingCanvas (input + chaos), DrawingView (render + replay), ChainEntry…
│  ├─ lib/draw.ts # stroke rendering shared by the pad and the viewer
│  └─ screens/    # Home, Lobby, PromptPhase, StepPhase, Reveal, Recap
├─ server/        # rules, rooms, timers, redaction, socket wiring → @gfc/doodle/server
│  └─ content/prompts.ts   # 129 drawable prompts
├─ shared/        # types, zod schemas (incl. drawing validation), constants
└─ docs/spec.md
```

## Tests

```bash
npm test -w @gfc/doodle
```

13 unit tests cover chain assignment, the full round flow, chaos enforcement, drawing validation, timeouts, and redaction (guessers never see prompts, and drawers see only the previous guess).

## Status

Playable end to end. Ideas for later: let a viewer download a chain as an image, a "fill" bucket tool, and more chaos rules.
