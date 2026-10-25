# 💞 Games for Two

Silly real-time games for couples who are far apart. Each of you plays on your own phone or laptop, ideally while you're on a call. One server hosts every game, and the portal at `/` lists them all.

## The games

| Game | Where | What it is | Needs | Docs |
|---|---|---|---|---|
| ✍️ **Finish My Sentence** | `/fms` | You start a sentence, your partner finishes it, usually without seeing the whole thing. Then you reveal both, dramatically. | Keyboard | [README](games/finish-my-sentence/README.md) · [spec](games/finish-my-sentence/docs/spec.md) |
| 🎤 **Jjinja Battle** | `/jjinja` | Say "jjinja?!" (찐짜) into your mic and get scored on pronunciation, tone and funniness. Best of 3, or a rally where each one must beat the last. | Mic (camera optional) | [README](games/jjinja-battle/README.md) |
| 🎨 Blind Portrait Duel · 🕹️ Two-Body Problem · 🤔 Would You Rather: Unhinged | | Coming soon | | |

### ✍️ Finish My Sentence

- **Setup:** 2 players, 10–20 minutes. Rooms use a 4-letter code or a share link.
- **Each round:** you both write a starter (or get one from a deck of 162). You swap, and each finishes the other's in **Classic**, **Peek** (see only the last 2 words) or **Blind** (see nothing) mode, often with a silly rule like "Write it like a pirate".
- **Reveal and recap:** the reveal is in sync on both screens, with live emoji reactions and a laugh rating. The recap hands out awards such as Line of the Night and Most Unhinged.
- **Built with:** React with a Socket.IO namespace; the server decides everything and hides what each player shouldn't see.

### 🎤 Jjinja Battle

- **Setup:** 2 players, or play the Jjinja Bot. Invite a friend with a link, get a random match, or practice solo.
- **Scoring:** your browser analyzes each 3-second clip (loudness, syllables, pitch contour), and the server turns that into Pronunciation, Tone and Funny scores. A rising, dramatic "jjin-JAAA?" scores best.
- **Extras:** round challenges, rally mode, an announcer voice, optional live video (WebRTC with a relay server), match recording as vertical videos, highlight clips, and safety tools for random matches.
- **Built with:** a vanilla JS frontend and a `ws` WebSocket server, mounted by the shared server at `/jjinja`. It needs `https://` or `localhost` for the mic.

## Run it locally

Requires Node 20+.

```bash
npm install
npm run dev
```

Open http://localhost:5173 and pick a game. To play both sides on one computer, open the room link in a second tab.

## Play with your partner before deploying

```bash
npm run build
npm start
```

Then, in another terminal, expose it with a free Cloudflare tunnel. This prints an `https://….trycloudflare.com` link to send; add `/fms` or `/jjinja` to go straight into a game:

```bash
cloudflared tunnel --url http://localhost:3001
```

## Put it online

See [DEPLOY.md](DEPLOY.md). One script sets up a free Oracle Cloud server (or a ~$5/month VPS) with HTTPS and a video relay.

## Tests

```bash
npm test
npm run typecheck
```

## Project layout

Every game lives in its own folder under `games/`, with its own README and docs. The root holds only what the games share.

```
games/
├─ finish-my-sentence/   # @gfc/fms: client/, server/, shared/, docs/, README.md
└─ jjinja-battle/        # @gfc/jjinja: public/, server/, README.md
client/                  # the portal: home page, routing, shared theme (styles.css)
server/                  # the one server: serves the portal and mounts every game
shared/                  # games.ts, the registry the portal home is built from
deploy/ + DEPLOY.md      # server setup and update scripts
MEMORY.md                # running project log: status, decisions, next steps
```

## Adding a game

1. Create `games/<id>/` as a workspace package (add it to `workspaces` in the root `package.json`), with a `README.md` and, if needed, a `docs/` folder.
2. Add it to `shared/src/games.ts` so it shows up on the portal.
3. Plug it in:
   - **React game:** export a component and add a route in `client/src/App.tsx`, plus an `@source` line for its `client/` folder in `client/src/styles.css`.
   - **Standalone page** (like Jjinja): mount it in `server/src/index.ts`, set `standalonePage: true` in the registry, and add a dev proxy in `client/vite.config.ts`.
   - **Real-time:** register a Socket.IO namespace, or attach its own WebSocket, in `server/src/index.ts`.
4. Add a row and a short section for it in this README.
