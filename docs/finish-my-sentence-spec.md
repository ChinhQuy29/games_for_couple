# Finish My Sentence: Build Spec

> **Audience:** an AI coding agent that will implement this game from scratch.
> **Read the whole document before writing code.** Build in the milestone order in §11, and check each milestone's acceptance criteria before moving on.

---

## 1. What we're building

A **silly, real-time, two-player web game** for a couple in a long-distance relationship. Each of them plays on their own phone or laptop, usually during a video or voice call.

In each round, each player gets the **first half of a sentence** (written by their partner or dealt from a deck) and has to **finish it**. In the funnier modes, they finish it while seeing only part of the first half, or none of it. The two halves are then revealed together, dramatically. The goal is for both players to laugh, not to compete hard.

### Design pillars (use these to settle any ambiguity)

1. **Laughter over competition.** Scoring is light and optional. The reveal is the main event.
2. **Both players are always busy.** Rounds are symmetrical: both write at the same time, so nobody sits waiting.
3. **Zero friction.** No accounts and no installs. One player creates a room and sends a 4-letter code or link, and the other joins.
4. **Mobile-first.** It must feel good on a phone held in one hand with the on-screen keyboard open.
5. **Looks silly on purpose.** Bouncy animations, chunky rounded fonts, bright colors, emoji everywhere. Nothing corporate.

### Lives inside the Games-for-Couple portal

This game is the first of several. The repo is a **portal**: one web app and one server that host every game.
- `/` is the portal home, which lists every game from the registry in `shared/src/games.ts` as a card.
- Each game lives under its own route prefix (this one: `/fms`) and its own Socket.IO **namespace** (`/fms`).
- Game code is isolated per folder: `client/src/games/<id>/`, `server/src/games/<id>/`, `shared/src/<id>/`. The portal shell (layout, theme tokens, shared UI bits) lives in `client/src/portal/` and `client/src/ui/`.
- To add a game: add a registry entry, add a client route, and register a server namespace. Don't touch the other games.

### Non-goals (v1)

- More than 2 players per room
- User accounts, login, or a database
- AI-generated content
- Native apps

---

## 2. Game rules

### 2.1 Room & lobby
- Player A opens the site, enters a nickname, and taps **Create room**. They get a 4-letter room code (uppercase, with ambiguous letters `I`, `O`, `0`, `1` excluded) and a shareable link `/fms/<CODE>`.
- Player B opens the link (or enters the code) and a nickname, then joins.
- A room holds **exactly 2 players**. A third person who tries to join gets a friendly "This room is taken 💔" error.
- The **room creator is the host** and can change settings in the lobby (the other player sees the settings live but can't edit them).
- The game starts when the host taps **Start** while both players are connected.

### 2.2 Settings (lobby, host-editable)

| Setting | Options | Default |
|---|---|---|
| Rounds | 3, 5, 7, 10 | 5 |
| Mode | `classic`, `peek`, `blind` (see 2.4) | `peek` |
| Timer per writing phase | 30s, 45s, 60s, 90s, off | 60s |
| Silly modifiers | on / off | on |
| Deck categories | multi-select from §7 | all except `spicy` |

### 2.3 Round flow

Every round goes through these phases. Both players act **at the same time** in each phase.

1. **START phase.** Each player produces a sentence starter, either by:
   - typing their own starter (3–120 chars), or
   - tapping **🎲 Deal me one** to get a random starter from the deck (they may re-roll up to 2 times per round, then submit).
   The UI should nudge them to end the starter with `…` (append one automatically on submit if there's no trailing punctuation).
2. **FINISH phase.** The starters are **swapped**. Each player finishes their partner's starter (1–120 chars). What the finisher sees depends on the mode (2.4). If modifiers are on, a random **modifier** (§8) is shown in a big sticker at the top, e.g. "🏴‍☠️ Write it like a pirate".
3. **REVEAL phase.** The two completed sentences are revealed **one at a time**:
   - The **author of the starter** taps **Reveal** for their sentence, so each player reveals the sentence that started with their own starter. Player A reveals first, then B.
   - The reveal animation types the starter in, pauses dramatically for about 1 second, then slams the ending in with a bounce and screen shake.
   - Both players see the reveal at the same moment (it's server-driven).
   - A **🔊 Narrate** button reads the full sentence aloud with the Web Speech API in a funny voice (§9.4).
   - Both players can spam **live reactions** (😂 💀 ❤️ 🍅 🤯). They float up on **both** screens in real time.
4. **RATE step** (still part of REVEAL, shown under each revealed sentence). Each player can:
   - tap a **"How hard did you laugh?"** rating: 1–5 😂. This is optional and only feeds the end-of-game "Best line" awards.
   - tap **⭐ Save** to add it to their local Hall of Fame.
5. When **both players tap "Next round ▶"**, the next round starts. Show "Waiting for <name>…" to whoever taps first.

After the final round comes the **RECAP** screen (§2.6).

### 2.4 Modes

| Mode | What the finisher sees in FINISH phase |
|---|---|
| `classic` | The whole starter. Funny because you write the punchline on purpose. |
| `peek` | Only the **last 2 words** of the starter, e.g. `"… is a"`, plus the starter's word count. The default; a good mix of control and chaos. |
| `blind` | **Nothing** about the starter except its word count ("Your partner wrote 9 words. Good luck."). Pure exquisite-corpse chaos. |

The server enforces this: in `peek` and `blind` modes, it **must not send** the full starter text to the finisher's client before REVEAL. Don't just hide it in the UI.

### 2.5 Timers
- If a timer is set, the server stores a `deadline` (epoch ms) for the phase and broadcasts it. Clients show a countdown bar that wiggles under 10s.
- When the deadline hits, each client **auto-submits whatever is in its text box**.
- The server allows a **3-second grace period**. Any player who still hasn't submitted gets a fallback:
  - Missing starter → a random deck starter.
  - Missing ending → a random line from the "AFK excuses" list, e.g. `"[was too busy staring at you to answer]"`, `"[fell asleep, dreamt of you]"`. Write about 15 of these.
- If a phase has no timer, it advances only when both players have submitted.

### 2.6 Recap screen
- Shows all sentences from the game as a scrollable list of cards.
- **Awards** (computed from ratings, ties broken randomly):
  - 🏆 **Line of the Night**: highest combined rating.
  - 🤡 **Most Unhinged**: the sentence with the most reactions.
  - 💘 **Accidentally Romantic**: the sentence with the most ❤️ reactions.
  If nobody rated or reacted, skip that award.
- Buttons: **📸 Save as image** (renders the recap or a single card to PNG), **🔁 Rematch** (same room and settings, back to lobby), **🏠 Leave**.

### 2.7 Hall of Fame
- Starred sentences are saved in **`localStorage`** on that device (key `fms.hallOfFame.v1`), with the date, both names, and the mode.
- A **Hall of Fame** page lists them, newest first, with delete and "save as image" options.
- Wrap every `localStorage` access in `try/catch`. The game must work if storage is unavailable.

---

## 3. Tech stack

Use these choices; don't substitute.

| Concern | Choice |
|---|---|
| Language | TypeScript everywhere (`strict: true`) |
| Monorepo | npm workspaces: `client`, `server`, `shared` |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS + a little custom CSS for keyframes |
| Animation | `framer-motion` |
| Realtime | `socket.io` (server) / `socket.io-client` |
| Server | Node 20+, Express (static files + health check) + Socket.IO |
| Validation | `zod` schemas in `shared`, used on the server for every incoming event |
| Image export | `html-to-image` |
| Confetti | `canvas-confetti` |
| Tests | `vitest` (unit), `@playwright/test` (e2e with 2 browser contexts) |
| Lint/format | ESLint + Prettier, default-ish configs |

**Why a custom server rather than Firebase or Supabase:** there are no third-party accounts or keys, the hidden-information rules (§2.4) are easy to enforce in one authoritative place, and it deploys as a single service.

---

## 4. Repository layout

```
/
├─ package.json            # workspaces + root scripts
├─ tsconfig.base.json
├─ README.md               # how to run, how to deploy, how to play
├─ MEMORY.md               # running project log: what's done, decisions, next steps
├─ docs/
│  └─ finish-my-sentence-spec.md   # this file
├─ shared/
│  ├─ package.json
│  └─ src/
│     ├─ games.ts          # portal registry: every game's id, title, emoji, path, status
│     ├─ fms/
│     │  ├─ types.ts       # Room, PublicRoomState, Phase, etc.
│     │  ├─ events.ts      # event names + zod payload schemas
│     │  └─ constants.ts   # limits, timings, emoji list
│     └─ index.ts
├─ server/
│  ├─ package.json
│  └─ src/
│     ├─ index.ts          # Express + Socket.IO bootstrap, registers each game's namespace, serves client/dist in prod
│     └─ games/fms/
│        ├─ namespace.ts   # socket wiring for the /fms namespace
│        ├─ rooms.ts       # RoomStore: create/join/resume/cleanup
│        ├─ game.ts        # PURE state machine (no sockets, no timers)
│        ├─ timers.ts      # deadline scheduling that calls into game.ts
│        ├─ view.ts        # toPublicState(room, viewerId): redacts hidden info
│        ├─ content/
│        │  ├─ starters.ts # deck (§7)
│        │  ├─ modifiers.ts# (§8)
│        │  └─ afk.ts      # AFK fallback endings
│        └─ __tests__/     # vitest
└─ client/
   ├─ package.json
   ├─ index.html
   └─ src/
      ├─ main.tsx
      ├─ App.tsx           # routes: "/" portal, "/fms/*" this game
      ├─ styles.css        # theme tokens + Tailwind
      ├─ portal/           # PortalHome, GameCard
      ├─ ui/               # shared bits: BigButton, Toast, Blob…
      └─ games/fms/
         ├─ FmsApp.tsx     # routes: "/fms", "/fms/:code", "/fms/hall-of-fame"
         ├─ socket.ts      # namespace client, reconnect + resume logic
         ├─ store.tsx      # React context/hook holding latest PublicRoomState
         ├─ screens/       # Home, Lobby, StartPhase, FinishPhase, Reveal, Recap, HallOfFame
         ├─ components/    # TimerBar, ModifierSticker, ReactionLayer, SentenceCard…
         └─ lib/           # tts.ts, storage.ts, exportImage.ts, sfx.ts
```

Root scripts:
- `npm run dev` runs the server (tsx watch, port 3001) and the client (Vite, port 5173, proxying `/socket.io` to 3001) together, using `concurrently`.
- `npm run build` builds the client (the server runs TypeScript directly through `tsx`, so it has no build step).
- `npm start` runs the production server on `PORT` (default 3001), which serves `client/dist` with an SPA fallback.
- `npm test` runs the vitest suites. `npm run e2e` runs Playwright.

---

## 5. Server architecture

### 5.1 Principles
- **The server is authoritative.** Clients send intents, and the server validates them, mutates state, and broadcasts.
- **`game.ts` is pure.** Its functions look like `(room, action, now, rng) => room | GameError`. No I/O, no `Date.now()` inside, and the RNG is injected so tests are deterministic. This is where most of the unit tests go.
- **Broadcast full snapshots.** After any change, send each player their own `room:state` built by `toPublicState(room, viewerId)`. Don't send diffs; the state is tiny.
- **Never trust the client.** Validate every payload with zod, check that the sender is in the room, and check the event is allowed in the current phase. Reject anything else with an `error` event.

### 5.2 Data model (`shared/src/fms/types.ts`)

```ts
export type Mode = 'classic' | 'peek' | 'blind';
export type Phase = 'LOBBY' | 'START' | 'FINISH' | 'REVEAL' | 'RECAP';
export type Reaction = '😂' | '💀' | '❤️' | '🍅' | '🤯';

export interface Settings {
  rounds: 3 | 5 | 7 | 10;
  mode: Mode;
  timerSec: 30 | 45 | 60 | 90 | null;
  modifiersOn: boolean;
  categories: CategoryId[];
}

export interface Player {
  id: string;            // public id, safe to share
  token: string;         // secret, only ever sent to that player; used for resume
  name: string;          // 1–20 chars, trimmed
  connected: boolean;
  isHost: boolean;
}

export interface Sentence {
  id: string;
  round: number;
  starterAuthorId: string;
  finisherId: string;
  starter: string;
  starterFromDeck: boolean;
  ending: string | null;
  endingWasAfk: boolean;
  modifier: Modifier | null;   // the modifier the finisher had to obey
  revealed: boolean;
  ratings: Record<string, 1|2|3|4|5>;   // by playerId
  reactions: Record<Reaction, number>;
}

export interface Room {
  code: string;
  createdAt: number;
  lastActivityAt: number;
  players: Player[];           // length 0..2, index 0 = host
  settings: Settings;
  phase: Phase;
  round: number;               // 1-based, 0 in LOBBY
  deadline: number | null;     // epoch ms
  sentences: Sentence[];       // all rounds, 2 per round
  pendingStarters: Record<string, { text: string; fromDeck: boolean; rerollsLeft: number } | undefined>;
  dealtStarter: Record<string, string | undefined>; // current deck suggestion per player
  readyForNext: string[];      // playerIds who tapped "Next round"
  revealIndex: number;         // how many of this round's 2 sentences are revealed
  usedStarterIds: string[];    // avoid repeats within a room
}
```

`PublicRoomState` is what clients receive. It is the `Room` with these changes:
- `token` removed from every player. The viewer's own token is sent only in the join/create/resume ack.
- `pendingStarters`: the partner's entry is replaced by `{ submitted: boolean }`.
- In FINISH phase, sentences are redacted for the viewer according to the mode (§2.4). Add a computed field `myTask: { starterVisible: string; wordCount: number; modifier: Modifier | null } | null`.
- `ending` of **unrevealed** sentences is **always** null for both players, so nobody can peek through devtools.
- Includes `you: string` (the viewer's playerId) and `serverNow: number` so the client can correct clock skew for timers.

### 5.3 Socket events (`shared/src/fms/events.ts`, namespace `/fms`)

Client → server. All events use Socket.IO acks `(res: { ok: true, ... } | { ok: false, code, message })`.

| Event | Payload | Allowed in | Effect |
|---|---|---|---|
| `room:create` | `{ name }` | – | Creates a room; ack `{ code, playerId, token }` |
| `room:join` | `{ code, name }` | LOBBY | Joins as the 2nd player; ack `{ playerId, token }`. Errors: `ROOM_NOT_FOUND`, `ROOM_FULL`, `GAME_IN_PROGRESS` |
| `room:resume` | `{ code, token }` | any | Reattaches a reconnecting player; ack `{ playerId }` |
| `room:leave` | `{}` | any | Removes the player (in-game: the partner sees "<name> left" and returns to the lobby) |
| `settings:update` | `Partial<Settings>` | LOBBY, host only | |
| `game:start` | `{}` | LOBBY, host, 2 connected | → START, round 1 |
| `starter:deal` | `{}` | START | Puts a random deck starter into `dealtStarter[me]`; decrements rerolls |
| `starter:submit` | `{ text, fromDeck }` | START | When both have submitted → FINISH |
| `ending:submit` | `{ text }` | FINISH | When both have submitted → REVEAL |
| `reveal:next` | `{}` | REVEAL, only the author of the next sentence's starter | `revealIndex++` |
| `reaction:send` | `{ sentenceId, emoji }` | REVEAL, RECAP | Increments the count and also emits an ephemeral `reaction` broadcast. **Rate-limit to 8/sec per player.** |
| `rating:submit` | `{ sentenceId, value }` | REVEAL, revealed sentence only | |
| `round:ready` | `{}` | REVEAL, after both revealed | When both ready → next round's START, or RECAP after the last round |
| `game:rematch` | `{}` | RECAP | → LOBBY, clears sentences, keeps settings and players |

Server → client:

| Event | Payload |
|---|---|
| `room:state` | `PublicRoomState` (per viewer) |
| `reaction` | `{ fromPlayerId, sentenceId, emoji }`, used to animate floating emoji |
| `partner:typing` | `{ typing: boolean }`. Optional nicety: client sends `typing` (throttled, 1/sec) during writing phases; show "💭 <name> is typing…". Never send the text. |

### 5.4 Reconnection & room lifecycle
- On create or join, the client stores `{ code, token }` in `sessionStorage` (wrapped in try/catch). On socket reconnect or page reload, it calls `room:resume` automatically.
- When a player disconnects, mark them `connected: false` and broadcast. **Timers keep running.** The partner sees a small "📡 <name> disconnected…" banner. Never end the game just because of a disconnect.
- Rooms are kept in memory (`Map<string, Room>`). A sweep every 5 minutes deletes rooms with `lastActivityAt` older than **2 hours**, or rooms with 0 connected players for more than 30 minutes.
- A server restart loses all rooms. That's acceptable for v1; the client should handle `ROOM_NOT_FOUND` on resume by sending the player back home with a friendly toast.

### 5.5 Input rules
- Trim all text and collapse internal whitespace runs to one space. Strip control characters.
- Names: 1–20 chars. Starters: 3–120. Endings: 1–120.
- Render all user text as **plain text** in React. Never use `dangerouslySetInnerHTML`.
- No profanity filter; it's a private game for two adults.

---

## 6. Client UX

### 6.1 Screens
1. **Home**: big wobbly logo "Finish My Sentence…", a nickname input (remembered in localStorage), **Create room**, **Join with code**, and a 🏆 Hall of Fame link.
2. **Lobby**: room code in huge letters with **Copy link** and a native **Share** button (`navigator.share` when available). Two player "seats" with avatars (an emoji picked from the name's hash, e.g. 🐸 🦆 🐙 🦄), settings panel (read-only for the non-host), and a Start button.
3. **START phase**: prompt "Start a sentence for <partner>…", textarea, **🎲 Deal me one** (shows rerolls left), Submit. After submitting: "Waiting for <partner>…" with a goofy idle animation (a bouncing blob that blinks).
4. **FINISH phase**: modifier sticker (rotated a few degrees, slaps in), then the visible part of the starter, rendered according to the mode:
   - classic: the full starter in a speech bubble
   - peek: `"… <last two words>"` with the rest shown as scribbled-out blocks
   - blind: a bubble full of `???` with "9 words" under it
   Then the textarea and Submit.
5. **REVEAL**: big sentence card centered, reveal animation (§6.3), Narrate button, reaction bar, 1–5 laugh rating, ⭐ Save, then **Next round ▶**.
6. **RECAP**: awards first (each slides in with confetti), then all cards, then the buttons from §2.6.
7. **Hall of Fame**: grid of saved cards.

### 6.2 Visual style
- **Fonts** (Google Fonts): `Baloo 2` for headings and buttons, `Nunito` for body text.
- **Palette**: tokens on `:root`. Warm cream background `#FFF6E9`, ink `#2B2140`, hot pink `#FF4F8B`, sunny yellow `#FFC93C`, mint `#3DDC97`, sky `#4CC9F0`. Provide a dark theme via `prefers-color-scheme` (deep purple `#1E1530` background, same accent colors).
- **Shapes**: thick 3px ink outlines, large radii (20–28px), and hard drop shadows (`4px 4px 0 ink`) for a sticker or cartoon look. Buttons squish on press (scale 0.94) and pop back.
- Cards get a random slight tilt (−2° to 2°).
- Respect `prefers-reduced-motion`: turn off shake and confetti, keep fades.

### 6.3 The reveal (spend the most care here)
1. The card flies in from below.
2. The starter types out at about 35 ms/char with a soft tick sound.
3. "…" pulses for 900 ms with a drumroll.
4. The ending **slams** in: scale 2 → 1 with spring physics, a 150 ms screen shake, a "ba-dum-tss" sound, and the ending text in hot pink.
5. In `peek` and `blind` modes, briefly show a stamp: **"BLIND MODE 🙈"**.
6. Both clients play this animation when `room:state` shows the sentence switching to `revealed: true`. It must not depend on who clicked.

### 6.4 Mobile details
- Use `100dvh` layouts. Keep the primary action button visible above the on-screen keyboard (sticky footer).
- Auto-focus the textarea when a writing phase starts. Submit on Enter (Shift+Enter for a newline isn't needed; strip newlines).
- Show a character counter near the limit (from 100/120).
- Tap targets at least 44px. Test at 360px width with no horizontal scroll.

### 6.5 Sound
- Small sound effects (tick, drumroll, ba-dum-tss, pop for reactions, fanfare for awards), generated with the **Web Audio API** in `lib/sfx.ts` so there are no asset files to source. Keep them short and cartoonish.
- A mute toggle in the corner, persisted in localStorage. Default **on**.

---

## 7. Content: starter deck

Put the deck in `server/content/starters.ts` as `{ id, category, text }[]`. Write **at least 150 starters**, at least 20 per category, all ending in `…`. They should be open-ended so that endings written blind still land. Keep everything PG-13 except `spicy`, which is flirty but not explicit, and off by default.

| Category id | Label | Examples (write more in the same spirit) |
|---|---|---|
| `us` | 💑 Us | "The real reason I fell for you is…", "Our future kids will definitely…", "If we were a cooking show, the episode would be called…", "The first thing I'll do when I see you at the airport is…" |
| `ldr` | ✈️ Long distance | "Time zones are basically…", "Every time the video call freezes, I…", "My pillow is a poor substitute for you because…" |
| `absurd` | 🦆 Absurd | "The duck was furious because…", "Scientists were shocked to discover that…", "The ancient prophecy foretold…" |
| `food` | 🍜 Food | "Pineapple on pizza is acceptable only when…", "My last meal on Earth would be…, served by…" |
| `life` | 🌱 Life | "The most useless skill I have is…", "If my life had a warning label, it would say…" |
| `hypothetical` | 🤔 What if | "If cats could talk, the first thing they'd say is…", "If I woke up as you for a day, I'd…" |
| `confessions` | 🙊 Confessions | "I've never told anyone this, but…", "The weirdest thing I do when I'm alone is…" |
| `spicy` | 🌶️ Spicy (opt-in) | "The outfit that would make me forget my own name is…", "Our next date night will end with…" |

Deck rules: pick only from enabled categories, never repeat a starter within a room until the eligible deck is exhausted, and seed the RNG per room.

---

## 8. Content: modifiers

`server/content/modifiers.ts`: `{ id, emoji, text, check?: (ending) => boolean }[]`. Shown to the finisher only. They're **honor-system and for fun**; `check` (when present) only shows a little ✅ or ❌ badge at reveal and never blocks submitting.

Include at least these:

- 🏴‍☠️ Write it like a pirate
- 🤏 Five words max (`check`: ≤ 5 words)
- 🍌 Must include the word "banana" (`check`)
- 📢 ALL CAPS (`check`)
- 🎭 Make it as dramatic as possible
- 👵 Answer as your grandma would
- 🎵 It has to rhyme with the last word you see (in blind mode, swap this for another modifier)
- 🐸 Mention an animal
- 💼 Sound like a LinkedIn post
- 🧙 Fantasy-epic tone
- 😇 Make it unexpectedly wholesome
- 🔤 Every word starts with the same letter
- 🤖 Speak like a robot
- 📺 Write it like a news headline
- ❤️ Secretly compliment your partner

Pick a modifier each round with about 70% probability (some rounds have none), and don't use the same modifier twice in a row.

---

## 9. Implementation notes

### 9.1 State machine (`game.ts`) transitions

```
LOBBY --game:start--> START(round=1)
START --both starters in (or deadline+grace)--> FINISH
FINISH --both endings in (or deadline+grace)--> REVEAL(revealIndex=0)
REVEAL --reveal:next x2--> (revealed all) --both round:ready--> START(round+1) | RECAP (if round==settings.rounds)
RECAP --game:rematch--> LOBBY
any --player leaves mid-game--> LOBBY (sentences cleared)
```

On entering FINISH, create the two `Sentence`s for this round:
- `starterAuthorId = A, finisherId = B` and the other way around.
- Assign each one an independently drawn modifier.

### 9.2 Timers (`timers.ts`)
- Store one `setTimeout` handle per room. Clear it on every phase change.
- At `deadline + 3000`, dispatch an internal `phase:timeout` action into `game.ts`, which fills the fallbacks (§2.5) and advances.
- Unit-test the timeout logic through `game.ts` with an injected `now`. Don't use real timers in unit tests.

### 9.3 Clock skew
Client computes `offset = serverNow - Date.now()` on every state update and renders the countdown as `deadline - (Date.now() + offset)`.

### 9.4 Narrator (`lib/tts.ts`)
- Use `speechSynthesis` with an `SpeechSynthesisUtterance`. Offer three voices in a tiny dropdown next to the button:
  - 🎙️ **Movie trailer**: pitch 0.5, rate 0.85, prefixed with "In a world… "
  - 🐿️ **Chipmunk**: pitch 2, rate 1.4
  - 🤖 **Robot**: pitch 0.1, rate 1
- Narration plays only on the device of whoever presses the button. That's fine, since they're on a call together.
- Hide the button if `speechSynthesis` is unsupported.

### 9.5 Image export
`html-to-image` `toPng` on a dedicated, off-screen "share card" component: 1080×1350 with the logo, both names, the sentence, the mode badge, and the date. On mobile, try `navigator.share({ files })` first and fall back to a download link.

---

## 10. Testing requirements

### Unit (vitest, `server/src/__tests__`)
- `game.ts`: every transition in §9.1; reject events from the wrong phase or wrong player; host-only settings; third player gets `ROOM_FULL`; reroll limit; AFK fallbacks on timeout; RECAP after the final round; rematch resets correctly.
- `view.ts` (**critical**):
  - In `peek` and `blind` modes, the finisher's public state contains **no trace** of the full starter text. Assert with `JSON.stringify(state).includes(fullStarter) === false`.
  - Unrevealed endings never appear in anyone's state.
  - Tokens never appear except your own in the ack.
- Deck: no repeats until exhausted; respects categories.

### E2E (Playwright, `e2e/`)
Two browser contexts at a 390×844 viewport:
1. A creates a room, and B joins via the link.
2. Play a full 3-round game in `peek` mode, with one round using **Deal me one** and one round letting the timer expire (use a 30s timer, or add a test-only env var `FMS_TIMER_SCALE=0.1` that the server reads to speed up timers).
3. Both see the same revealed sentence text. Reactions sent by A appear on B's screen.
4. RECAP shows awards, and Rematch returns both players to the lobby.
5. Reload B's page mid-game, and B resumes in the same phase.

---

## 11. Milestones (build in this order)

Each milestone should end with a working app and a commit.

| # | Milestone | Acceptance criteria |
|---|---|---|
| M0 | **Scaffold** | Workspaces, TS configs, Tailwind, ESLint/Prettier. `npm run dev` shows a placeholder page that says "connected ✅" over Socket.IO. `npm test` runs. |
| M1 | **Rooms & lobby** | Create, join, resume, leave, settings sync, and the ROOM_FULL error all work across two browser windows. Unit tests for room logic. |
| M2 | **Core loop (no frills)** | Full START → FINISH → REVEAL → RECAP loop in all three modes with plain UI, plus server-side redaction tests passing. **This is the most important milestone.** |
| M3 | **Timers & resilience** | Countdown, auto-submit, AFK fallbacks, disconnect banner, reload resume. |
| M4 | **The fun layer** | Full visual style, reveal animation, reactions, sound effects, modifiers, narrator, confetti, waiting animations. |
| M5 | **Keepsakes** | Ratings, awards, Hall of Fame, image export, rematch. |
| M6 | **Polish & ship** | Content complete (150+ starters, 15+ modifiers, 15 AFK lines). Playwright suite green. Lighthouse mobile ≥ 90 performance and accessibility. README with run, deploy, and play instructions. Dockerfile. |

---

## 12. Deployment

- One Node web service: `npm run build && npm start`. It works on **Render**, **Railway**, or **Fly.io** free or cheap tiers. Include a `Dockerfile` (node:20-alpine, multi-stage) and document Render setup in the README.
- WebSockets must be allowed. All three hosts support them by default.
- `GET /health` → `200 ok`.
- **Quick testing with the real partner before deploying:** document running `npm run build && npm start` locally and exposing it with `cloudflared tunnel --url http://localhost:3001`. That gives an HTTPS link that can be sent across the world.
- Use one instance only (rooms live in memory). Note in the README that scaling out would need a Redis adapter. Out of scope for v1.

---

## 13. Coding conventions

- Keep files small and focused. One React component per file.
- No `any`. Infer shared payload types from zod schemas (`z.infer`).
- Keep all game rules in `game.ts`. The client holds **no game logic** beyond UI state such as draft text and animation flags.
- Keep user-facing copy playful and short. All strings for one screen live at the top of that screen's file, so tone tweaks are easy.
- Commit after each milestone with a clear message.

---

## 14. Open questions (use the default unless the human says otherwise)

| Question | Default |
|---|---|
| Should ratings be visible to the partner during the reveal? | No, hidden until RECAP (prevents sulking 😄) |
| Should the host role be able to transfer? | No; if the host leaves, the remaining player becomes host |
| Language | English only, with copy in one place so translating later is easy |
