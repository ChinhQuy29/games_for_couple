# Codenames Duet: Spec

## The key (`KEY_LAYOUT`)

The 25 cards get pairs [seat 0's mark, seat 1's mark]:

| Seat 0 | Seat 1 | Cards |
|---|---|---|
| agent | agent | 3 |
| agent | bystander | 5 |
| agent | assassin | 1 |
| bystander | agent | 5 |
| assassin | agent | 1 |
| assassin | assassin | 1 |
| assassin | bystander | 1 |
| bystander | assassin | 1 |
| bystander | bystander | 7 |

So each side has 9 agents and 3 assassins, with 15 agents in total. `dealKeys` shuffles the pairs over the 25 positions.

## Rules (`server/game.ts`)

- **Phases:** LOBBY → PLAY → OVER, then PLAY again on a new board (both ready), or LOBBY (host's "Rematch").
- **Settings:** the language (`en`/`vi`, from `shared/words.ts`) and the turns (11, 9 or 7).
- **Deal:** 25 random words, new keys, nothing found, a random first giver, turns reset.
- **`clue {word, count}`:**
  - the giver only, once per turn;
  - cleaned, at most 2 space-separated parts (Vietnamese compounds);
  - not equal to a board word (case-, space- and Unicode-normalized);
  - stored as `{word, count, by, got: []}`.
- **`guess {card}`:** the guesser only. Not a found card, and not a card already known as a bystander for this giver. The card is read with `keys[clue.by]`:
  - **agent:** found, added to `got`. All 15 found → win.
  - **bystander:** `bystanderFor[by][card] = true`, and the turn ends.
  - **assassin:** lose, recording who gave the clue and the card.
- **`stop`:** the guesser, after at least one agent this turn; the turn ends.
- **Turn end:** log `{word, count, by, got, ended}`, use one turn; 0 left → lose ("out of time"). The giver alternates, unless the other side has no agents left on their key.
- **Record:** `record {wins, games}` survives new boards.

## View

- `cards[i]` carries the word, `mine` (my mark), found, `bystanderMine` / `bystanderTheirs`, and `theirs`. `theirs` is null until the game is over, so my partner's key never reaches me during play.
- Plus the counts: agents left in total, on my key, on theirs.

## Client

- **Cards:** my key is a left stripe plus a tint (green agent, dark ☠ assassin). Found agents turn mint with 🕵️. Bystander markers: 😐 mine, 🙂 theirs.
- **Clue box:** it changes by situation: give a clue, wait for the clue, the clue being guessed (giver), or tap + Stop (guesser).
- **Over:** both keys revealed (left/right stripes), the log, a new board.
