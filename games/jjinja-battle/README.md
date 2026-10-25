# Jjinja Battle (prototype)

Say "jjinja" (찐짜) into your mic, get scored 0–100, and beat your friend in a best-of-3.

Scoring is **vibes-based** for now: the browser measures loudness, syllables, onset sharpness and the pitch contour, and the server turns that into Pronunciation / Tone / Funny scores with some randomness added. A rising, dramatic "jjin-JAAA?" scores best.

## Run it

Jjinja Battle is part of [Games for Two](../../README.md) and is served by the shared server at `/jjinja`. From the repository root:

```bash
npm install
npm run dev
```

Open http://localhost:5173/jjinja (or pick it from the portal at http://localhost:5173).

## Play with a friend over the internet

Browsers only allow microphone access on `https://` (or `localhost`), so give your friend an HTTPS tunnel to your machine. Cloudflare's quick tunnel is free and needs no account:

```bash
winget install --id Cloudflare.cloudflared
```

From the repository root, run the production server (port 3001):

```bash
npm run build
npm start
```

Then, in another terminal:

```bash
cloudflared tunnel --url http://localhost:3001
```

It prints a link like `https://something-random.trycloudflare.com`. Both of you open that link plus `/jjinja` (you should use it too, not localhost), then:

1. You: enter a name, click **Invite a friend**, then **Copy invite link** and send it.
2. Friend: opens the link, enters a name, clicks **Join room**.
3. Both click **I'm ready**. Take turns recording (3 seconds max, tap again to stop early). You hear each other's clips automatically.

**Random match** pairs anyone who clicks it at the same time. **Practice** scores you solo and keeps a personal best.

## Put it online

See [DEPLOY.md](../../DEPLOY.md) (it deploys the whole Games for Two project): free on Oracle Cloud Always Free (or a ~$5/month VPS), a free DuckDNS subdomain, automatic HTTPS, and a video relay, set up with one script.

## Layout

- `server/index.ts`: static files + WebSocket game logic (rooms, invite codes, matchmaking queue, turns, timers). Exports `handleHttp` and `attachJjinja`, which the shared server (`server/src/index.ts` at the repo root) mounts at `/jjinja`
- `types.d.ts`: the interface the shared server type-checks against (`server/contract.check.ts` keeps it in sync)
- `server/scoring.ts`: the prototype grader (swap this out for the real model later)
- `public/features.js`: in-browser audio analysis (pitch via autocorrelation, energy, syllables)
- `public/app.js`: UI and recording
