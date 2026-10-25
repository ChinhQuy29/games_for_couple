# 👻 Fan Cứng AOG (AOG Superfan)

A two-player trivia battle about Liên Quân Mobile and the Vietnamese pro scene: Saigon Phantom, Lai Bâng and the golden era, the FPT x Flash rivalry, AOG finals, international events, and the drama. Both players answer every question at the same time, so the faster *and* more correct fan wins. It's played at `/aog` in the [Games for Two](../../README.md) portal. Each player can switch between 🇻🇳 Tiếng Việt and 🇬🇧 English at any time.

## How to play

1. One of you opens **Fan Cứng AOG** from the portal, enters a name, and taps **Tạo phòng / Create a room**.
2. Send your partner the 4-letter code or the link (`/aog/CODE`). They join.
3. The host picks the settings and starts.

Each question:

- You both see the same question and options (in the same shuffled order) and tap an answer. The faster you're right, the more points you get: **100–200** per question.
- **Clue questions** ("Who is this mystery player?") reveal up to 3 clues over time. Answer after 1 clue for **300**, after 2 for **200**, after 3 for **100**.
- Then the reveal: the right answer, who picked what, points gained, streak banners (**DOUBLE KILL → PENTA KILL**), an explanation, and a link to the source.
- Think a question is wrong? Tap **🚩 Báo sai / Report**. It's listed in the recap and logged on the server, so it can be fixed in the question file.

With **SGP Special** on, the last 3 questions are all about Saigon Phantom and worth **double points**.

The recap names the biggest superfan and gives each of you a **Liên Quân rank** based on how many you got right: Đồng (Bronze) → Bạc → Vàng → Bạch Kim → Kim Cương → Tinh Anh → Cao Thủ → **Thách Đấu (Conqueror)** 👑. It also shows your best streak and a review of every question.

### Settings (host only)

Number of questions (10/15/20), time per question (15/20/30s; clue questions get +15s), SGP Special finale on/off, and topics:

| Topic | What's in it |
|---|---|
| 👻 Saigon Phantom | History, titles, finals, records |
| ⭐ Players | Lai Bâng, Fish, Khoa, Shin, Zeref and other SGP players, FMVPs, mystery-player clue questions |
| 🏆 AOG league | Seasons, venues, runners-up |
| ⚔️ Rivals | FPT x Flash (Team Flash), their 2025–2026 finals against SGP |
| 🌏 International | AIC, APL, AWC and SEA Games results involving Vietnamese teams |
| 🍿 Drama & transfers | Retirements, replacements, the tribute-video apology |
| 🎮 The game | A few basics about Liên Quân itself |

## The question bank

All questions are in [`server/content/questions.ts`](server/content/questions.ts): **70 questions**, 48 of which can appear in the SGP finale. They cover 2020 to Spring 2026, and every one carries a `source` URL.

They were written from Vietnamese Wikipedia (the ĐTDV and Saigon Phantom articles), the official Garena recap of the Winter 2025 final, and Vietnamese esports news. They have **not** been checked by a superfan yet. Facts the sources disagreed on (some final scores, the exact date Lai Bâng left) were left out rather than guessed. Private-life stories are not included.

### Adding or fixing a question

```ts
{
  id: 'unique-id',                 // shown in the 🚩 list, so keep it readable
  category: 'sgp',                 // sgp | players | aog | rivals | intl | drama | game
  type: 'mc',                      // mc (2–4 options) | tf (true/false) | clues
  difficulty: 2,                   // 1 casual → 3 hardcore (games ramp from 1 to 3)
  sgp: true,                       // can appear in the SGP Special finale
  q: t('Câu hỏi tiếng Việt?', 'English question?'),
  options: [t('Đúng', 'Right'), n('Same in both'), …],   // not needed for tf
  answer: 0,                       // index of the right option (tf: 0 = true, 1 = false)
  clues: [t(…), t(…), t(…)],       // clue questions only, vaguest first
  explain: t('Giải thích…', 'Explanation…'),
  source: 'https://…',
}
```

Options are shuffled on screen, so you can always list the right answer first. Run `npm test -w @gfc/aog` afterwards: the tests check every question has both languages, a valid answer and a source.

## Run it

From the repository root:

```bash
npm install
npm run dev
```

Open http://localhost:5173/aog. To play both sides on one computer, open the room link in a second tab.

## How it works

- **The server decides everything** (`server/game.ts`, plain functions with time and randomness passed in). It plans each game: questions from the chosen topics, sorted easy → hard, no repeats across rematches, and the SGP finale last.
- **Fair speed across the distance:** each device times its own answer from the moment the question appeared, so internet lag doesn't decide who was faster. The server only accepts a claim within 3 seconds faster (to allow for lag) or 1.5 seconds slower than its own clock, so nobody can claim an instant answer.
- **No peeking** (`server/view.ts`): while a question is open, the correct answer, explanation and your partner's choice never leave the server. Clues are sent only once they're due; the server wakes up for each clue (`server/timers.ts`).
- **Language** is per device (`client/lib/i18n.ts`). Every question, option, clue and screen is written in both languages.
- **Real-time:** the Socket.IO namespace `/aog` on the shared server. Rooms are kept in memory.

More detail in [docs/spec.md](docs/spec.md).

## Files

```
games/aog-trivia/             # workspace package @gfc/aog
├─ client/        # React UI → @gfc/aog/client (AogApp), with the VI/EN switch
│  ├─ lib/i18n.ts
│  ├─ components/ # QuestionHeader, Scoreboard, TimerBar, Avatar…
│  └─ screens/    # Home, Lobby, QuestionPhase, RevealPhase, Recap
├─ server/        # rules, view, clue-aware timers, socket wiring → @gfc/aog/server
│  └─ content/questions.ts   # the question bank
├─ shared/        # types, zod schemas, constants (ranks, points), scoring
└─ docs/spec.md
```

## Tests

```bash
npm test -w @gfc/aog
```

16 unit tests cover the question bank itself, game planning (ramp, finale, categories, no repeats), answering and timeouts, scoring (speed, clues, finale, ranks), clue timing, redaction and 🚩 flags.

## Status

Playable end to end. Next: have a fan check the questions, and add more (heroes, patch history, Queens of Glory if wanted). Ideas: a "who said it?" round with famous interview quotes, and a timeline round (put SGP's titles in order).
