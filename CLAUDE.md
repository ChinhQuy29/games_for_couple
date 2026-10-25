# Games for Couple

Read [MEMORY.md](MEMORY.md) first. It has the current status, the decisions made so far and what's next. **Update it at the end of every session**: refresh the status table and add a dated Log entry on top.

- **Every game lives in its own folder**, `games/<id>/`, as a workspace package with its own `README.md` and, if needed, a `docs/` folder. Finish My Sentence: [games/finish-my-sentence](games/finish-my-sentence/README.md) (spec in its `docs/spec.md`). Jjinja Battle: [games/jjinja-battle](games/jjinja-battle/README.md).
- The root holds only the shared parts: the portal (`client/`), the one server (`server/`), and the game registry (`shared/src/games.ts`). See "Adding a game" in [README.md](README.md).
- The root [README.md](README.md) is the overview of all games. Keep its games table and per-game sections in step with each game's own README.
- Run `npm test` and `npm run typecheck` before calling work done.
- Commit messages are plain, with ChinhQuy29 as the only author. Never add `Co-Authored-By`, "Generated with Claude Code" or similar attribution lines.
