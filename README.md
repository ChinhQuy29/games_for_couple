# 💞 Games for Two

Silly real-time games for couples who are far apart. Each of you plays on your own screen, ideally while you're on a call.

| Game | Status |
|---|---|
| ✍️ **Finish My Sentence**: you start it, they finish it without seeing the whole thing | Playable |
| 🎨 Blind Portrait Duel · 🕹️ Two-Body Problem · 🤔 Would You Rather: Unhinged | Coming soon |

## Run it locally

Requires Node 20+.

```bash
npm install
npm run dev
```

Open http://localhost:5173, pick **Finish My Sentence**, and create a room. To try both players on one computer, open the room link in a second tab.

## Play with your partner before deploying

```bash
npm run build
npm start
```

Then, in another terminal, expose it with a free Cloudflare tunnel. This prints an `https://….trycloudflare.com` link to send:

```bash
cloudflared tunnel --url http://localhost:3001
```

## Tests

```bash
npm test
npm run typecheck
```

## Project layout

- `shared/`: game registry, types, zod schemas
- `server/`: Express + Socket.IO, one namespace per game (`server/src/games/<id>`)
- `client/`: React portal plus each game under `client/src/games/<id>`
- `docs/`: game specs
- `MEMORY.md`: running project log (status, decisions, next steps)
