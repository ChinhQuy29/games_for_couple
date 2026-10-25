# Bomb Squad: Spec

## Editions (`shared/edition.ts`)

- **`makeEdition(id)`:** builds plain data from a seeded RNG (mulberry32):
  - **wires:** for each count 3–6, three rules plus an "otherwise". Each rule is ANDed conditions → a target. Conditions: none/exactly/more-than of a color, first/last wire color, batteries ≥ n, serial odd/even/vowel. Targets: a position, the last wire, the first/last wire of a color. Templates only pair "of a color" targets with conditions that guarantee that color exists;
  - **button:** four rules of 1–2 atoms (color, label, batteries, vowel, odd) → tap/hold, plus "otherwise", and a strip color → digit map (4 distinct digits from 1–5);
  - **symbols:** 6 columns of 7 from a 28-symbol pool;
  - **simon:** vowel/no-vowel × 0/1/2 strikes, each a random color permutation;
  - **passwords:** 30 of 65 words;
  - **morse:** 8 of 16 words, each with a distinct frequency;
  - **mazes:** 6 DFS mazes on 6×6, each identified by a unique pair of marker cells;
  - **memory:** 5 stages × 4 display values. Each step is a position, a label, "same position as stage k" or "same label as stage k" (stage 1 only uses position/label);
  - **switches:** a rule per LED color: always, odd serial, vowel, batteries ≥ n, or "n+ LEDs of this color".
- **Solvers:** `wireToCut`, `buttonAction`, `releaseDigit`, `symbolOrder`, `simonMap`, `spellable`, `memoryPress`, `switchShouldBeUp`, `mazeFor`, `morseFor` interpret the data.
- **Manual text:** `wireRuleText`, `buttonRuleText`, `memoryStepText` and `switchRuleText` render the same data as sentences, so the manual and the checks can't drift apart.

## Bombs (`server/game.ts`)

- **Difficulty:** easy 3 modules / 5:00, normal 4 / 4:30, hard 6 / 5:30.
- **`makeBomb`:**
  - a new edition id (1000–9999, cached by `editionOf`), a serial (5 characters + a digit), 0–4 batteries;
  - module kinds from `pickKinds`: kinds not on the last bomb first, shuffled.
- **Module generation** keeps answers unique:
  - symbols: exactly one column;
  - password: exactly one spellable word;
  - morse: the dial never starts on the answer;
  - maze: the start and goal at least 5 steps apart (Manhattan);
  - memory: a fresh display and label shuffle per stage.

## Actions (`bomb:act`, Defuser only)

| Module | Ops | Strike when |
|---|---|---|
| wires | `cut` | the wrong wire |
| button | `press`, `release {shown}` | wrong tap/hold, or released on the wrong digit (`shown` trusted within ±1.5s of the server timer) |
| symbols | `symbol` | out of column order |
| simon | `simon` | not the mapped color (input resets) |
| password | `spin`, `submit` | the word isn't the spellable one |
| morse | `tune`, `transmit` | the wrong frequency |
| maze | `move` | into a wall or the edge (you stay put) |
| memory | `memory {pos}` | the wrong position (reset to stage 1) |
| switches | `flip`, `check` | any switch wrong |

Three strikes or the timer → exploded. All modules solved → defused. Results record the module kinds.

## View

- **Defuser:** gets the bomb, `manual: null`.
- **Expert:** gets `manual` (the full edition), `bomb: null`.
- **Both:** the edition id, the module kinds, strikes and progress. After the bomb, everyone gets everything.

## Client

- **Defuser:** one panel per module (`Modules.tsx`):
  - Morse blinks in real timing (250ms dot, 750ms dash);
  - Maze shows the markers, the light and the goal, plus arrow buttons;
  - Memory shows the display, the buttons and stage lights;
  - Switches shows the LEDs and toggles.
- **Expert:** `Manual.tsx` renders the edition, with tabs only for this bomb's kinds and the edition badge.
