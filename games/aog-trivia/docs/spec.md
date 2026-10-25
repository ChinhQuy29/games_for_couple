# Fan Cứng AOG: Spec

> Design and technical reference. For how to play and how to edit questions, see the [README](../README.md).

## 1. Goals

- **Made for one specific superfan.** She loves SGP's golden era (Lai Bâng, Fish, Khoa, Shin), so SGP gets its own topic, clue questions about those players, and a double-points finale. FPT x Flash appear as the rivals.
- **Both play.** The boyfriend also plays Liên Quân, so it's a straight head-to-head with simultaneous answers.
- **Fair across a long distance.** Speed is timed on each device, not by arrival time at the server.
- **Bilingual.** Every string has `vi` and `en`, and each player switches freely.
- **Correct, or honest about it.** Each question has a source, contested facts are left out, and 🚩 flags make fixes easy.

## 2. Phases

```
LOBBY ─start (plan built)→ QUESTION 1
QUESTION ─both answered | deadline + 2s grace→ REVEAL
REVEAL ─both ready→ next QUESTION | RECAP after the last
RECAP ─rematch→ LOBBY            any phase ─player leaves→ LOBBY
```

### Planning (`buildPlan`)
1. Eligible questions are those in the chosen categories. Ones already used in this room are skipped until too few are left, then the used list resets.
2. With the SGP finale on, up to `FINALE_SIZE` (3) questions with `sgp: true` are drawn for the end, from any category.
3. The rest is a random sample sorted by difficulty (random tiebreak), so games ramp from casual to hardcore.
4. Fewer than 3 questions available → `NOT_ENOUGH_QUESTIONS`.

### Timing
- Limit = `timeSec` (+15s for clue questions). Clue `i` (0-based) of `k` appears at `round(i · limit / k)` seconds.
- `wakeAt(room, now)` returns the next clue time, or `deadline + grace`. The room timer fires then: `tick()` either reveals (deadline passed) or just triggers a rebroadcast so the new clue is sent.

### Answers and speed
- The client sends `{choice (screen position), elapsedMs}`, where `elapsedMs` is `performance.now()` minus when the question rendered.
- The server clamps it to `[serverElapsed − 3000, serverElapsed + 1500]`, then to `[0, limit]`. This allows normal lag while preventing fake instant answers.
- No answer by the deadline → `{choice: null}` (wrong).

## 3. Scoring (`shared/scoring.ts`)

| Case | Points |
|---|---|
| Wrong / no answer | 0 |
| Correct mc / tf | `100 + round(100 · (1 − elapsed/limit))` → 100–200 |
| Correct clue question | 300 / 200 / 100 for 1 / 2 / 3 clues showing at answer time |
| SGP finale | × 2 |

Streaks count consecutive correct answers. Banners appear at 2–5+ (DOUBLE → PENTA KILL).

Ranks use the share answered correctly: 0 Đồng · 0.2 Bạc · 0.35 Vàng · 0.5 Bạch Kim · 0.62 Kim Cương · 0.75 Tinh Anh · 0.85 Cao Thủ · 0.95 Thách Đấu.

## 4. Data

```ts
QuestionDef { id, category, type: 'mc'|'tf'|'clues', difficulty: 1|2|3, sgp?, q: Text, options?: Text[],
              answer, clues?: Text[], explain: Text, source }
Turn        { index, questionId, finale, order[] /* display → original option */, answers{pid → {choice, elapsedMs}}, points }
Room        { phase, index, startedAt, deadline, plan[], finaleSize, turns[], scores, streaks, flagged[], usedQuestionIds, … }
```

## 5. Socket events (namespace `/aog`)

| Event | Payload | Phase |
|---|---|---|
| `room:create` / `room:join` / `room:resume` / `room:leave` | `{name}` / `{code, name}` / `{code, token}` / `{}` | – |
| `settings:update` | `Partial<Settings>` | LOBBY, host |
| `game:start` | `{}` | LOBBY, host, 2 connected |
| `answer:submit` | `{choice, elapsedMs}` | QUESTION |
| `question:flag` | `{index}` (toggles 🚩; also logged on the server) | REVEAL, RECAP |
| `round:ready` | `{}` | REVEAL |
| `game:rematch` | `{}` | RECAP |

Server → client: `room:state` (per viewer).

## 6. Redaction (`server/view.ts`)

While a question is open:
- `correct`, `explain` and `source` are null.
- Only clues whose time has come are included.
- The partner's answer is null; only `done` lists who has locked in.

After the reveal everything is visible, and tokens are always stripped. Unit tests check that the explanation text doesn't appear in an open question's serialized state.

## 7. Sources used for the question bank (Oct 2026)

- Vietnamese Wikipedia: *Đấu trường Danh vọng* (season table and records), *Saigon Phantom* (history, roster, awards, international results)
- lienquan.garena.vn: Winter 2025 final recap
- Sforum (Spring 2023 final), Techz (Spring 2026 final), PLO (AIC 2024), FPT Shop (AIC 2025), Thể Thao 247 and ai-hay (Lai Bâng's retirement and the tribute-video apology), Việt Giải Trí and Mytour (Lai Bâng's captaincy, individual title counts)

Not reachable: Facebook (needs a login), Liquipedia (human verification), and the YouTube channel pages (they wouldn't render). The YouTube search results confirmed the official channels: `@LienQuanMobileSportsGarena` and `@GarenaLienQuanMobileVN`.
