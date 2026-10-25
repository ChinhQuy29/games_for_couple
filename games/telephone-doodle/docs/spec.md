# Telephone Doodle: Spec

> Design and technical reference for Telephone Doodle. For how to play, see the [README](../README.md).

## 1. The two-player problem, and the fix

Classic telephone needs many players: each sees only the previous step, so meaning drifts. With two people, every chain passes back and forth between the same pair. That creates two constraints:

1. **Whoever guesses must never have seen the original words.** So players don't write prompts for each other; they draw their own (dealt or self-written).
2. **Both players should always be busy.** So each round runs **two chains in parallel**, one owned by each player. At every step both players act, each on a different chain.

Assignment rule: step `s` (0-based) of the chain owned by player `o` is played by player `(o + s) % 2`. Even steps are drawings, odd steps are guesses. So **owners always draw, and partners always guess**. The owner does see their own prompt again when drawing later steps, but they only ever draw from their partner's latest guess. Chaos rules and time pressure keep the drift strong.

Chain length is even (2, 4, 6 steps after the prompt), so every chain ends on a guess. That's the punchline for the "Started as → Ended as" card.

## 2. Phases

```
LOBBY ─start→ PROMPT ─both locked in (or 45s + 3s grace)→ STEP 0 (draw)
STEP s ─both submitted (or deadline + grace)→ STEP s+1 … → REVEAL
REVEAL ─every entry shown, both ready→ PROMPT (next round) | RECAP
RECAP ─rematch→ LOBBY          any phase ─player leaves→ LOBBY
```

- **PROMPT:** each player is dealt a deck prompt (no repeats within a room until the deck runs out), may re-roll twice, or writes their own (3–80 chars). On timeout, the dealt prompt is used.
- **STEP:** each player gets one `StepTask`, either `{kind: 'drawing', text, chaos}` or `{kind: 'guess', drawing}`. On timeout, missing drawings become empty pages and missing guesses become `¯\_(ツ)_/¯ no idea`, both flagged `afk`.
- **REVEAL:** `revealChain` (which chain) and `revealCount` (how many entries are showing; it starts at 1, the prompt). Either player taps **Next**. After the last entry of a chain, Next moves to the other chain. Reactions unlock on a chain once it's fully shown.
- **RECAP:** every chain in full. The chain with the most reactions gets 🏆.

## 3. Data

```ts
Stroke  { c: colorIndex 0–7, w: brushIndex 0–2, p: [x0, y0, x1, y1, …] }  // ints on a 1000×1000 grid
Drawing { strokes: Stroke[] }                                            // ≤ 300 strokes, ≤ 12,000 points
Entry   = prompt {text, by, fromDeck} | drawing {drawing, by, afk, chaos} | guess {text, by, afk}
Chain   { id, round, owner, entries, chaosByStep, reactions }
```

Chaos is decided per drawing step when a chain starts (about 60% of steps, never the same rule twice in a row in a chain).

| Chaos | Enforced by |
|---|---|
| one-stroke, five-strokes, one-color, tiny | server (`applyChaos` trims and normalizes) + client UI |
| blind, mirror, shaky | client only, applied while drawing |

## 4. Socket events (namespace `/doodle`)

Client → server, all with acks:

| Event | Payload | Phase |
|---|---|---|
| `room:create` / `room:join` / `room:resume` / `room:leave` | `{name}` / `{code, name}` / `{code, token}` / `{}` | – |
| `settings:update` | `Partial<Settings>` | LOBBY, host |
| `game:start` | `{}` | LOBBY, host, 2 connected |
| `prompt:reroll` | `{}` | PROMPT |
| `prompt:submit` | `{text, fromDeck}` | PROMPT |
| `drawing:submit` | `{drawing}` | STEP (even) |
| `guess:submit` | `{text}` | STEP (odd) |
| `reveal:next` | `{}` | REVEAL |
| `reaction:send` | `{chainId, emoji}` (max 8/sec) | REVEAL, RECAP |
| `round:ready` | `{}` | REVEAL, everything shown |
| `game:rematch` | `{}` | RECAP |

Server → client: `room:state` (`PublicRoomState` per viewer), `reaction` (for floating emoji), and `partner:typing`.

## 5. Redaction (`server/view.ts`)

- PROMPT: only your own dealt prompt.
- STEP: only `myTask`, built from the single entry before your step. You never get other entries of the current round, and never `chaosByStep`.
- REVEAL: chains before `revealChain` in full, the current one sliced to `revealCount`, later ones as empty lists (with `total` only).
- Earlier rounds stay viewable in full; RECAP shows everything. Tokens are always stripped.

Unit tests assert that prompt and guess text never appear in the serialized state of the wrong player.

## 6. Client notes

- `DrawingCanvas` records pointer events, skips points closer than 4 grid units, and applies mirror, shaky and blind as you draw. It enforces stroke caps, one color and the tiny brush in the UI too.
- `DrawingView` renders a drawing and replays it stroke by stroke (over about 2.2s) the first time it's shown on a device. It respects `prefers-reduced-motion`.
- Canvases are always white paper, in light and dark mode.
