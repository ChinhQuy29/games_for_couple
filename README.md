# 💞 Games for Two

Silly real-time games for couples who are far apart. Each of you plays on your own phone or laptop, ideally while you're on a call. One server hosts every game, and the portal at `/` lists them all.

## The games

| Game | Where | What it is | Needs | Docs |
|---|---|---|---|---|
| ✍️ **Finish My Sentence** | `/fms` | You start a sentence, your partner finishes it, usually without seeing the whole thing. Then you reveal both, dramatically. | Keyboard | [README](games/finish-my-sentence/README.md) · [spec](games/finish-my-sentence/docs/spec.md) |
| 🎤 **Jjinja Battle** | `/jjinja` | Say "jjinja?!" (찐짜) into your mic and get scored on pronunciation, tone and funniness. Best of 3, or a rally where each one must beat the last. | Mic (camera optional) | [README](games/jjinja-battle/README.md) |
| 🖍️ **Telephone Doodle** | `/doodle` | Broken telephone with drawings: draw a prompt, your partner guesses it, you draw their guess… then watch it fall apart. | Mouse or finger | [README](games/telephone-doodle/README.md) · [spec](games/telephone-doodle/docs/spec.md) |
| 🤔 **Would You Rather: Unhinged** | `/wyr` | Answer ridiculous dilemmas at the same time and guess your partner's pick. Disagree, and you both have to defend yourselves. | Keyboard | [README](games/would-you-rather/README.md) · [spec](games/would-you-rather/docs/spec.md) |
| 👻 **Fan Cứng AOG** | `/aog` | Liên Quân & AOG trivia battle: SGP, Lai Bâng and the golden era, FPT x Flash, finals, international events, drama. Vietnamese or English. | Keyboard or tap | [README](games/aog-trivia/README.md) · [spec](games/aog-trivia/docs/spec.md) |
| 🙈 **Hide and Seek** | `/hns` | Prop hunt for two: one turns into a lamp, a cushion or a duck and hides in a room full of real ones; the other gets 5 shots to find the fake. | Laptop (mouse/trackpad) | [README](games/hide-and-seek/README.md) · [spec](games/hide-and-seek/docs/spec.md) |
| 🔢 **Number Rush** | `/rush` | 1 to 100 on one board: race to click the next number first. Ascending, descending or random order. | Laptop (mouse/trackpad) | [README](games/number-rush/README.md) · [spec](games/number-rush/docs/spec.md) |
| 💣 **Bomb Squad** | `/bomb` | One of you sees a ticking bomb, the other has the defusal manual. Talk fast: wires, a big button, symbols, Simon Says, passwords. Co-op. | Laptop + a call | [README](games/bomb-squad/README.md) · [spec](games/bomb-squad/docs/spec.md) |
| 🍳 **Kitchen Chaos** | `/kitchen` | One preps, one cooks, and the only way across is the pass. Chop, cook, plate and serve the tickets before customers walk out. Don't burn anything. Co-op. | Laptop (mouse/trackpad) | [README](games/kitchen-chaos/README.md) · [spec](games/kitchen-chaos/docs/spec.md) |
| 🔦 **Ghost Hunt** | `/ghost` | One walks a dark haunted house with a flashlight; the other has the map, cameras and EMF. Find the evidence, name the ghost, get out. Co-op. | Laptop + keyboard | [README](games/ghost-hunt/README.md) · [spec](games/ghost-hunt/docs/spec.md) |
| ⛓️ **Tethered** | `/tethered` | Two climbers chained together on a tall tower: jump, anchor, swing. If one falls, you both do. Co-op. | Keyboard | [README](games/tethered/README.md) · [spec](games/tethered/docs/spec.md) |
| 🕹️ **Two-Body Problem** | `/two-body-problem` | One character, two players: one walks, one jumps. Swap pads trade the jobs. 6 levels with keys, gates and moving platforms. Co-op. | Keyboard | [README](games/two-body-problem/README.md) · [spec](games/two-body-problem/docs/spec.md) |
| 📦 **Moving In** | `/moving-in` | Two-player Dreamy Room: each unpacks your own box and you put every item in its exact spot, together. Six rooms tell a long-distance love story. Co-op. | Laptop (mouse/trackpad) | [README](games/moving-in/README.md) · [spec](games/moving-in/docs/spec.md) |
| 🔐 **Escape Room for Two** | `/escape` | Locked in two different rooms: one of you sees each clue, the other has the controls. Dials, keypads, colors, levers and a pitch-dark maze. Co-op. | Laptop + a call | [README](games/escape-room/README.md) · [spec](games/escape-room/docs/spec.md) |
| 📦 **Handle With Care** | `/carry` | Two clumsy movers, one house of valuables, one truck. Small things you carry or throw; the piano and fish tank need both of you holding on. Co-op. | Keyboard | [README](games/handle-with-care/README.md) · [spec](games/handle-with-care/docs/spec.md) |
| 🎨 Blind Portrait Duel | | Coming soon | | |

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

### 🖍️ Telephone Doodle

- **Setup:** 2 players, 10–15 minutes. Two chains run at once each round (one started by each of you), so you're always both drawing or both guessing.
- **The rule:** you only ever see the step right before yours, so the guesser never sees the original words. Chaos rules make the drawing harder: 🙈 blind draw, ✏️ one stroke, 🪞 mirror hands, 🫨 shaky hands…
- **Reveal:** you step through each chain together, drawings replay stroke by stroke, and each chain ends with "Started as → Ended as". The gallery crowns the chain that got the most reactions.
- **Built with:** React with an HTML canvas, and the Socket.IO namespace `/doodle`. Drawings are compact stroke lists on a 1000×1000 grid, validated by the server.

### 🤔 Would You Rather: Unhinged

- **Setup:** 2 players, 10–15 minutes, 10–20 questions from a deck of 129 in 7 categories (🌶️ Spicy is opt-in).
- **Each question:** pick A or B **and** predict your partner's pick, in secret. Match → 🤝 Same brain! Mismatch → a 30-second debate where you each type one line, revealed together.
- **Write your own:** every 5th or 3rd question, one of you writes an evil question for the other, taking turns.
- **Recap:** your match rate and a verdict (🧲 Opposites attract … 👯 Literally the same person), who reads whom best, and all your hot takes.
- **Built with:** React with the Socket.IO namespace `/wyr`. The server hides your partner's pick until both are in, and their prediction and defense until the verdict.

### 👻 Fan Cứng AOG

- **Setup:** 2 players, 10–20 questions from a sourced bank of 70 (2020 → Spring 2026), in 7 topics: Saigon Phantom, players, the AOG league, rivals, international, drama, and the game.
- **Each question:** you both answer at once. Faster correct answers score more, timed on each device so distance doesn't matter. "Mystery player" questions reveal clues over time and pay more for fewer clues.
- **SGP Special:** the last 3 questions are about Saigon Phantom and worth double. Streaks get caster banners (DOUBLE KILL → PENTA KILL).
- **Recap:** the winner plus a Liên Quân rank for each of you (Đồng → Thách Đấu 👑). 🚩 lets you report a wrong question so it can be fixed.
- **Built with:** React with the Socket.IO namespace `/aog`, a per-player 🇻🇳/🇬🇧 switch, and answers and clues revealed only by the server.

### 🙈 Hide and Seek

- **Setup:** 2 players, 15–20 minutes, roles swap every round (6 by default). Three maps: 🛋️ living room, 🍳 kitchen, 🌳 park, with the layout reshuffled every round.
- **Hiding:** the hider picks one of 3 objects that already exist in the room, then drags, rotates and resizes it to blend in. The hunter sees only a curtain.
- **Hunting:** 5 shots and 60 seconds. Missed shots make real props react (💥 CRASH, 🦆 QUACK). The fake wiggles every 15s, and the hider has 2 sneak moves that slide visibly across both screens.
- **Built with:** React and one big SVG map (1600×1000 world units, made for laptops), with hand-drawn SVG props and the Socket.IO namespace `/hns`. The server never tells the hunter which prop is fake until the round ends.

### 🔢 Number Rush

- **Setup:** 2 players, 5–10 minutes. 30, 50 or 100 numbers scattered on a calm or chaotic board.
- **Race:** you both hunt for the same target. The first correct click scores, timed on each device with a short photo finish, so a slower connection doesn't lose ties. A wrong click locks you out for 1.5s.
- **Recap:** the winner, fastest find, average time, best streak, and the board colored by who found what.
- **Built with:** the shared game kit (`kit/`) and an SVG board, on the Socket.IO namespace `/rush`.

### 💣 Bomb Squad

- **Setup:** 2 players on a call, 10–20 minutes. Co-op: you win or explode together. Easy (3 modules, 5:00), Normal (4, 4:00) or Hard (5, 3:00).
- **Roles:** the Defuser sees the bomb, the Expert reads the manual. Neither sees the other's screen, and the roles swap every bomb.
- **Modules:** wires, the button (tap or hold, release on the right digit), symbols, Simon Says and passwords, with rules that depend on the serial number and batteries. Three strikes or the timer ends it.
- **Built with:** the shared kit, on the Socket.IO namespace `/bomb`. The server never sends the armed bomb to the Expert.

### 🍳 Kitchen Chaos

- **Setup:** 2 players, 3-minute shifts, co-op. Three levels with 3 to 7 recipes (salad, burger, soup, sushi, taco, omelette, fried rice).
- **Sides:** the prep cook has the crates and chopping boards; the cook has the stoves, plates and serving window. Hand things over through the pass. Sides swap every shift.
- **Cooking:** chop with 5 clicks; stoves cook in 7s and burn 8s later. Serve exact dishes for coins plus a speed tip; walk-outs cost coins. ⭐ to ⭐⭐⭐ per shift.
- **Built with:** the shared kit, on the Socket.IO namespace `/kitchen`. The server owns every item and timer.

### 🔦 Ghost Hunt

- **Setup:** 2 players on a call, up to 10 minutes per house, co-op. Roles swap every game.
- **Explorer:** walks with WASD in the dark and sees only the flashlight cone. Tools: UV light, spirit box, a book, 2 cameras, closets to hide in.
- **Navigator:** sees the floor plan, the Explorer's dot, EMF and temperature for their room, and the camera feeds, but never the ghost.
- **Goal:** 6 kinds of evidence, 8 ghost types. Mark evidence in the shared journal, pick the ghost, walk out the front door. Low sanity brings hunts: hide or run.
- **Built with:** the shared kit, a tile map with line of sight, and a server-side ghost at 5 ticks/s, on the Socket.IO namespace `/ghost`. Each role gets its own redacted view.

### ⛓️ Tethered

- **Setup:** 2 players with keyboards, 10–20 minutes, co-op. One tower with 3 camps.
- **Climbing:** each of you moves and jumps your own climber; a 3.5-tile chain links you. Hold grab to anchor on a floor or wall (uses stamina) while your partner swings up.
- **The tower:** planks to jump through, crumbling blocks, moving platforms, spikes. Fall too far and you both go back to the last camp. The summit shows time, falls and yanks.
- **Built with:** the shared kit's 30 Hz loop: the server runs the physics and sends tiny frames; a canvas interpolates them. Socket.IO namespace `/tethered`.

### 🕹️ Two-Body Problem

- **Setup:** 2 players with keyboards, about 15 minutes for all 6 levels, co-op.
- **One body:** the Walker has left/right, the Jumper has jump (hold for higher). ⇄ pads swap the jobs; who walks first alternates every level.
- **Levels:** spikes, one-way platforms, a key and door, a 5-second button gate, a ferry over spikes, and a final level with everything. R restarts a level.
- **Built with:** the same 30 Hz kit loop, with physics copied from Tethered, on the Socket.IO namespace `/twobody`.

### 📦 Moving In

- **Setup:** 2 players, 20–30 minutes for all 6 rooms, co-op. Inspired by Dreamy Room and Unpacking.
- **Unpacking:** each of you clicks your own box to take things out, then drags them into place. Every item has one exact spot (identical items can swap). Anyone can move anything, and you see each other's drags live.
- **Help:** misplaced items glow red once both boxes are empty, and 3 shared hints per room show a ghost outline.
- **The story:** two bedrooms on a call → the visit → our bedroom, kitchen, bathroom, living room. A polaroid after each room and a photo album at the end.
- **Built with:** the shared kit, 43 hand-drawn SVG items, on the Socket.IO namespace `/movingin`. Which item goes where never leaves the server.

### 🔐 Escape Room for Two

- **Setup:** 2 players on a call, 15–25 minutes, co-op. Three rooms (The Study, The Lab, The Attic) with 4 puzzles each.
- **Asymmetric:** for every puzzle, one of you sees the clue (a mural, a note, a window, chalk marks, a map) and the other has the controls. It alternates every puzzle.
- **Puzzles:** a symbol dial lock, a count-the-objects keypad, a color sequence, a lever pattern and a dark maze walked blind. Different every game.
- **Score:** time plus 15s per mistake, per room.
- **Built with:** the shared kit, on the Socket.IO namespace `/escape`. Each player only ever receives their own side of a puzzle.

### 📦 Handle With Care

- **Setup:** 2 players with keyboards, about 10 minutes, co-op. Three houses: a studio, a two-floor family house, a mansion with a freight lift.
- **Carrying:** E grabs or drops, F throws small things. Big things (TV, piano, fish tank, sofa) need both of you holding on and walking in step: no jumping, and pulling apart drops it.
- **Damage:** door-frame bumps, hard landings and throws chip the value; fragile things break. Put things down in the truck zone to earn their value.
- **Built with:** the shared kit's 30 Hz loop, with physics copied from Tethered and generalised to bodies of any size, on the Socket.IO namespace `/carry`.

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

Then, in another terminal, expose it with a free Cloudflare tunnel. This prints an `https://….trycloudflare.com` link to send; add `/fms`, `/doodle`, `/wyr`, `/aog`, `/hns`, `/rush`, `/bomb`, `/kitchen`, `/ghost`, `/tethered`, `/two-body-problem`, `/moving-in`, `/escape`, `/carry` or `/jjinja` to go straight into a game:

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
├─ jjinja-battle/        # @gfc/jjinja: public/, server/, README.md
├─ telephone-doodle/     # @gfc/doodle: client/, server/, shared/, docs/, README.md
├─ would-you-rather/     # @gfc/wyr: client/, server/, shared/, docs/, README.md
├─ aog-trivia/           # @gfc/aog: client/, server/, shared/, docs/, README.md
├─ hide-and-seek/        # @gfc/hns: client/, server/, shared/, docs/, README.md
├─ number-rush/          # @gfc/rush: built on the kit
├─ bomb-squad/           # @gfc/bomb: co-op bomb defusal, built on the kit
├─ kitchen-chaos/        # @gfc/kitchen: co-op cooking, built on the kit
├─ ghost-hunt/           # @gfc/ghost: co-op ghost hunting, built on the kit
├─ tethered/             # @gfc/tethered: co-op chained platformer, built on the kit
├─ two-body-problem/     # @gfc/twobody: one body, two players, built on the kit
├─ moving-in/            # @gfc/movingin: two-player Dreamy Room, built on the kit
├─ escape-room/         # @gfc/escape: co-op two-room escape puzzles, built on the kit
└─ handle-with-care/    # @gfc/carry: co-op furniture moving (R.E.P.O.-style), built on the kit
kit/                     # @gfc/kit: rooms, sockets, lobby, timers and UI pieces shared by newer games
client/                  # the portal: home page, routing, shared theme (styles.css)
server/                  # the one server: serves the portal and mounts every game
shared/                  # games.ts, the registry the portal home is built from
docs/                    # cross-game plans (coop-games-plan.md)
deploy/ + DEPLOY.md      # server setup and update scripts
MEMORY.md                # running project log: status, decisions, next steps
```

## Adding a game

0. New games should use the shared kit (see [kit/README.md](kit/README.md)): it handles rooms, joining, timers and the lobby.
1. Create `games/<id>/` as a workspace package (add it to `workspaces` in the root `package.json`), with a `README.md` and, if needed, a `docs/` folder.
2. Add it to `shared/src/games.ts` so it shows up on the portal.
3. Plug it in:
   - **React game:** export a component and add a route in `client/src/App.tsx`, plus an `@source` line for its `client/` folder in `client/src/styles.css`.
   - **Standalone page** (like Jjinja): mount it in `server/src/index.ts`, set `standalonePage: true` in the registry, and add a dev proxy in `client/vite.config.ts`.
   - **Real-time:** register a Socket.IO namespace, or attach its own WebSocket, in `server/src/index.ts`.
4. Add a row and a short section for it in this README.
