# 🕵️ Codenames Duet

The two-player co-op version of Codenames. 25 words on the table, and each of you holds a **different secret key**: 9 agents and 3 assassins each, some shared. Take turns giving a one-word clue and a number; your partner taps the cards they think you mean. Find all 15 agents before you run out of turns, without touching an assassin. Based on the board game *Codenames Duet*. It's played at `/codenames` in the [Games for Two](../../README.md) portal, with **English or Vietnamese** words.

## How to play

1. One of you opens **Codenames Duet** from the portal and creates a room. Send the code or link (`/codenames/CODE`).
2. The host picks the words (🇬🇧 English / 🇻🇳 Tiếng Việt) and the number of turns (11 easy, 9 normal, 7 hard), then deals.
3. **Your key** is the stripe on the left of each card (and a tint): 🟩 your agents, ⬛ ☠ assassins, beige bystanders. Your partner's key is different, and you can't see it.
4. **Giving a clue:** on your turn, type one word (not on the board) and a number, e.g. `ocean 2`.
5. **Guessing:** your partner taps cards, read with **your** key (the clue giver's):
   - 🕵️ an agent: found! Keep guessing, or press **Stop** (after at least one).
   - 😐 a bystander: the turn ends. The card gets a marker so that clue giver can't use it again.
   - ☠ an assassin: you both lose.
6. Every clue uses up one turn. Clue giving alternates, unless one side has no agents left to point at.
7. Find all 15 agents to win. When the game ends, both keys are revealed (yours on the left of each card, your partner's on the right). Play again for a new board; your record keeps counting.

## Run it

From the repository root, `npm install`, then `npm run dev`. Open http://localhost:5173/codenames.

## Files

```
games/codenames-duet/       # @gfc/duet, built on the shared kit (../../kit)
├─ shared/words.ts          # English and Vietnamese word lists
├─ shared/index.ts          # the Duet key layout, types, schemas
├─ server/game.ts           # dealing keys, clues, guesses, turns, endings
├─ server/index.ts          # per-player view (only your own key) + registerGame() (namespace /duet)
├─ server/__tests__/        # 8 unit tests
├─ client/screens.tsx       # Lobby, Play (board, clue box, log), Over (both keys)
└─ docs/spec.md
```

## Tests

```bash
npm test -w @gfc/duet
```

The tests cover:
- the key layout (9/3 per side, 15 agents, 3 shared), and the word lists,
- clue rules (whose turn, not a board word, one word), guess rules,
- bystanders ending the turn and switching the giver, stopping, the assassin, running out of turns,
- a full win, and a new board,
- each player only ever seeing their own key.
