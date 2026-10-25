# 💞 Games for Two

Silly real-time games for couples who are far apart. Each of you plays on your own screen, ideally while you're on a call.

| Game | Status |
|---|---|
| ✍️ **Finish My Sentence** (`/fms`): you start it, they finish it without seeing the whole thing | Playable |
| 🎤 **Jjinja Battle** (`/jjinja`): yell "jjinja?!" (찐짜) into your mic; the most dramatic one wins | Playable |
| 🎨 Blind Portrait Duel · 🕹️ Two-Body Problem · 🤔 Would You Rather: Unhinged | Coming soon |

## Run it locally

Requires Node 20+.

```bash
npm install
npm run dev
```

Open http://localhost:5173 and pick a game. To try both players on one computer, open the room link in a second tab. Jjinja Battle needs a microphone, and browsers only allow that on `localhost` or `https://`.

## Play with your partner before deploying

```bash
npm run build
npm start
```

Then, in another terminal, expose it with a free Cloudflare tunnel. This prints an `https://….trycloudflare.com` link to send (add `/jjinja` or `/fms` to jump straight into a game):

```bash
cloudflared tunnel --url http://localhost:3001
```

## Put it online

See [DEPLOY.md](DEPLOY.md): one script sets up a free Oracle Cloud server (or a ~$5/month VPS) with HTTPS and a video relay for Jjinja's camera feature.

## Tests

```bash
npm test
npm run typecheck
```

## Project layout

- `shared/`: game registry, types, zod schemas
- `server/`: the one server for everything: Express + Socket.IO (one namespace per game in `server/src/games/<id>`), and it mounts Jjinja Battle at `/jjinja`
- `client/`: React portal plus each React game under `client/src/games/<id>`
- `games/jjinja-battle/`: Jjinja Battle, a self-contained game (vanilla JS frontend + `ws` WebSocket server) with its own [README](games/jjinja-battle/README.md)
- `deploy/`: server setup and update scripts
- `docs/`: game specs
- `MEMORY.md`: running project log (status, decisions, next steps)
