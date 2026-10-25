# 🧰 Game kit (`@gfc/kit`)

Everything a two-player room game needs apart from its own rules and screens. Number Rush and the co-op games are built on it. The older games (Finish My Sentence, Doodle, Would You Rather, Fan Cứng AOG, Hide and Seek) predate it and keep their own copies.

## Server: `@gfc/kit/server`

```ts
registerGame<Room>(io, {
  ns: '/rush',
  newRoom: (code, ctx) => Room,          // initial state (phase 'LOBBY')
  onLeave: (room) => void,               // a player left mid-game
  view: (room, viewerId, now) => object, // what ONE player may see (redact here!)
  wakeAt?: (room) => number | null,      // next time the server must act on its own
  tick?: (room, ctx) => boolean,         // handle what's due; true = rebroadcast
  actions: { 'pick': action(Schema, (room, me, payload, ctx) => extraAck | void) },
});
```

- **Built in:**
  - **Rooms:** 4-letter codes, `room:create`, `room:join`, `room:resume`, `room:leave` (the host moves to the remaining player).
  - **Housekeeping:** disconnect tracking, idle-room sweeping, and one timer per room driven by `wakeAt`/`tick`.
- **Helpers:**
  - `addPlayer`, `requirePlayer`, `requirePhase`, `requireHost`, `requireTwo`, `partnerOf`, `publicPlayers`, `GameError`/`fail`,
  - `pick`, `shuffle`, `seededRng`, `cleanText`.
- **Actions:** every action payload is validated with zod, and the room is rebroadcast after each one.

## Shared: `@gfc/kit/shared`

`BasePlayer`, `BaseRoom`, `PublicBase` (code, you, serverNow, players, phase, deadline), the join schemas, `EmptySchema`, and `Ack`.

## Client: `@gfc/kit/client`

```ts
export const kit = createGameClient<PublicState>({ ns: '/rush', key: 'rush', basePath: '/rush' });
// kit.AppShell({ home, phases: { LOBBY, PLAY, RECAP }, wide })
// kit.useGame() → { state, act, send, clockOffset, showToast, … }   kit.useRoom() → { s, me, partner, seat }
// kit.LobbyShell({ settings, howTo, startLabel })  kit.Choice  kit.Scores  kit.TimerBar  kit.Avatar  kit.RecapActions
```

`PLAYER_COLORS` gives the two seat colors, and `avatarFor` makes sure the two players never get the same animal.

## Adding a kit game

1. Create `games/<id>/` with `shared/`, `server/` (rules + `registerGame`), `client/` (a `kit.ts`, screens, `App.tsx`), `docs/` and a `README.md`.
2. Add it to the root `workspaces` and `typecheck` script, `server/src/index.ts`, `client/src/App.tsx`, the `@source` list in `client/src/styles.css`, and `shared/src/games.ts`.
