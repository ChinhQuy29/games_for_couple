# 🤔 Would You Rather: Unhinged

You both answer the same ridiculous question at the same time, and you guess what your partner picked. If you disagree, you each get one line to defend yourself. At the end, the game tells you how compatible you *really* are. It's played at `/wyr` in the [Games for Two](../../README.md) portal.

## How to play

1. One of you opens **Would You Rather: Unhinged** from the portal, enters a name, and taps **Create a room**.
2. Send your partner the 4-letter code or the link (`/wyr/CODE`). They join.
3. The host picks the settings and taps **Let's go!**

Each question has up to three steps:

| Step | What happens |
|---|---|
| **Answer** | Pick A or B, then guess what your partner picked. Neither of you sees the other's answer yet. |
| **Debate** (only if you disagree) | You both see who picked what and get 30 seconds to type a one-line defense, or tap 🤐 No comment. Both defenses are revealed together. |
| **Verdict** | 🤝 Same brain! or ⚔️ Divided!, who guessed right ✅/❌, the defenses, and live reactions 😂 💀 ❤️ 🤢 🔥 |

With **Write your own** on, every 5th (or 3rd) question is written by one of you, taking turns with the host first: "😈 Your turn to be evil."

After the last question, the **recap** shows:

- **Your match rate and a verdict:** 🧲 Opposites attract, 🌶️ A spicy balance, 🫛 Two peas in a pod, or 👯 Literally the same person.
- **Who knows who best:** how often each of you guessed the other's pick.
- **🔥 Hot takes:** every question you disagreed on, with your defenses.

### Settings (host only)

Number of questions (10/15/20), time to answer (15 or 30 seconds, or off), write-your-own (never, every 5th, every 3rd), and categories: 💑 Us, 🤢 Gross, 🦸 Powers & curses, 🍕 Food, 🦆 Absurd, 🌱 Life, and 🌶️ Spicy, which is opt-in. If time runs out, the game picks for you (marked 🎲, and left out of the guessing scores). If the writer runs out of time, a deck question is used.

## Run it

From the repository root:

```bash
npm install
npm run dev
```

Open http://localhost:5173/wyr. To play both sides on one computer, open the room link in a second tab.

## How it works

- **The server decides everything.** Clients send what a player wants to do; the server checks it, updates the room and sends each player their own snapshot.
- **`server/game.ts`** holds the rules as plain functions, with time and randomness passed in: LOBBY → (WRITE) → ANSWER → (DEBATE) → RESULT → … → RECAP.
- **`server/view.ts`** keeps secrets.
  - While answering, your partner's pick and prediction are hidden; you only learn that they've locked in.
  - In a debate, both picks are visible (that's the argument), but predictions and the other defense stay hidden until the verdict.
- **`shared/stats.ts`** computes the match rate, the verdict and the guessing scores. The verdict screen uses it for the running score, and the recap for the final numbers.
- **Real-time:** the Socket.IO namespace `/wyr` on the shared server. Rooms are kept in memory.

More detail in [docs/spec.md](docs/spec.md).

## Files

```
games/would-you-rather/       # workspace package @gfc/wyr
├─ client/        # React UI → @gfc/wyr/client (WyrApp)
│  ├─ components/Options.tsx  # the A-or-B cards, with voter avatars
│  └─ screens/    # Home, Lobby, WritePhase, AnswerPhase, DebatePhase, ResultPhase, Recap
├─ server/        # rules, rooms, timers, redaction, socket wiring → @gfc/wyr/server
│  └─ content/questions.ts    # 129 questions in 7 categories
├─ shared/        # types, zod schemas, constants, stats
└─ docs/spec.md
```

## Tests

```bash
npm test -w @gfc/wyr
```

13 unit tests cover the match and debate flow, the full game, write-your-own turns, timeouts, redaction, and the stats.

## Status

Playable end to end. Ideas for later: a "most controversial" award using reactions, sharing the recap as an image, and saving your favorite custom questions.
