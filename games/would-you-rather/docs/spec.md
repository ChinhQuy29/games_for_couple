# Would You Rather: Unhinged: Spec

> Design and technical reference. For how to play, see the [README](../README.md).

## 1. Design goals

- **Simultaneous and secret:** both answer at once, so nobody can copy or adapt to the other.
- **Something to talk about every question:** a match gets a celebration, a mismatch gets a debate. Predicting your partner's pick turns every question into a mini "how well do you know me".
- **Make it personal:** write-your-own questions let couples bring in inside jokes.

## 2. Phases

```
LOBBY ─start→ question 1
question i:  WRITE (if i is a write-your-own turn) → ANSWER
ANSWER ─both answered (or timeout: auto-pick)→ same pick ? RESULT : DEBATE
DEBATE ─both defended or skipped (or 30s + grace)→ RESULT
RESULT ─both ready→ question i+1 | RECAP after the last
RECAP ─rematch→ LOBBY          any phase ─player leaves→ LOBBY
```

- **Write-your-own:** with `customEvery = N`, question `i` is written when `i % N == 0`. The writer alternates, host first: `players[(i/N − 1) % 2]`. Options are cleaned: a leading "Would you rather" and trailing punctuation are dropped, and each needs 3–90 characters. On timeout (75s + grace), a deck question is used.
- **Deck:** questions are drawn from the enabled categories with no repeats until the eligible deck runs out. Sides are shuffled per draw.
- **Timeouts:** in ANSWER, a missing answer gets a random pick and prediction, and the player is listed in `autoPicked`. In DEBATE, a missing defense becomes `''` ("no comment").

## 3. Data

```ts
Question { id, a, b, authorId | null }
Turn     { index, question, picks{pid → 'a'|'b'}, predictions{pid → partner's expected pick},
           autoPicked[pid], defenses{pid → text}, reactions }
Room     { phase, index, deadline, turns[], writerId, readyForNext, usedQuestionIds, settings }
```

## 4. Socket events (namespace `/wyr`)

| Event | Payload | Phase |
|---|---|---|
| `room:create` / `room:join` / `room:resume` / `room:leave` | `{name}` / `{code, name}` / `{code, token}` / `{}` | – |
| `settings:update` | `Partial<Settings>` | LOBBY, host |
| `game:start` | `{}` | LOBBY, host, 2 connected |
| `question:write` | `{a, b}` | WRITE, writer only |
| `answer:submit` | `{pick, prediction}` | ANSWER |
| `defense:submit` | `{text}` (empty = skip) | DEBATE |
| `reaction:send` | `{index, emoji}` (max 8/sec) | RESULT, RECAP |
| `round:ready` | `{}` | RESULT |
| `game:rematch` | `{}` | RECAP |

Server → client: `room:state` (per viewer), `reaction`, and `partner:typing` (sent while writing or debating).

## 5. Redaction (`server/view.ts`)

| Phase | Partner's pick | Partner's prediction | Partner's defense |
|---|---|---|---|
| ANSWER | hidden (`done` lists who locked in) | hidden | – |
| DEBATE | visible | hidden | hidden (`done` lists who sent one) |
| RESULT / RECAP / history | visible | visible | visible |

Your own values are always visible to you. Tokens are always stripped. Unit tests check the serialized state for leaks.

## 6. Stats (`shared/stats.ts`)

- **Match rate** = matching picks ÷ answered questions. The verdict thresholds are 0, 0.35, 0.6 and 0.85.
- **Guessing score:** how often a player's prediction equals the partner's actual pick. A question doesn't count toward guessing scores if either player was auto-picked.
- The same function runs on the verdict screen (running score) and the recap.
