// Server side of the kit: everything a two-player room game needs apart from its rules.
// A game provides a GameDef (pure rule functions + a per-player view); registerGame wires
// it to a Socket.IO namespace with rooms, joining, resuming, timers and broadcasting.

import { randomBytes, randomUUID } from 'node:crypto';
import type { Namespace, Server, Socket } from 'socket.io';
import type { z } from 'zod';
import {
  CreateSchema,
  JoinSchema,
  LIMITS,
  ResumeSchema,
  ROOM_CODE_ALPHABET,
  type Ack,
  type BasePlayer,
  type BaseRoom,
} from '../shared';

export interface Ctx {
  now: number;
  rng: () => number;
}

export class GameError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const fail = (code: string, message: string): never => {
  throw new GameError(code, message);
};

export function cleanText(s: string): string {
  return s
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const pick = <T>(arr: readonly T[], rng: () => number): T => arr[Math.floor(rng() * arr.length)]!;

export function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Deterministic RNG for tests and seeded layouts. */
export function seededRng(seed = 42): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32;
    return s / 2 ** 32;
  };
}

// ---------- shared rule helpers ----------

export function addPlayer(room: BaseRoom, p: { id: string; token: string; name: string }): BasePlayer {
  if (room.players.length >= 2) fail('ROOM_FULL', 'This room is taken 💔');
  if (room.phase !== 'LOBBY') fail('GAME_IN_PROGRESS', 'A game is already going in this room');
  const name = cleanText(p.name).slice(0, LIMITS.nameMax);
  if (name.length < LIMITS.nameMin) fail('TOO_SHORT', 'Pick a name first');
  const player: BasePlayer = { ...p, name, connected: true, isHost: room.players.length === 0 };
  room.players.push(player);
  return player;
}

export function requirePlayer(room: BaseRoom, playerId: string): BasePlayer {
  return room.players.find((p) => p.id === playerId) ?? fail('NOT_IN_ROOM', 'You are not in this room');
}

export function requirePhase(room: BaseRoom, ...phases: string[]): void {
  if (!phases.includes(room.phase)) fail('WRONG_PHASE', 'Not right now!');
}

export function requireHost(room: BaseRoom, playerId: string): void {
  if (!requirePlayer(room, playerId).isHost) fail('NOT_HOST', 'Only the host can do that');
}

export function requireTwo(room: BaseRoom): void {
  if (room.players.length !== 2 || room.players.some((p) => !p.connected)) {
    fail('NEED_TWO_PLAYERS', 'You need your partner here first 💞');
  }
}

export const partnerOf = (room: BaseRoom, playerId: string) => room.players.find((p) => p.id !== playerId);

export const publicPlayers = (room: BaseRoom) => room.players.map(({ token: _t, ...p }) => p);

// ---------- wiring ----------

type ActionResult = Record<string, unknown> | void;

/** A validated client action. The payload is typed inside `action()`, erased here so actions can share one map. */
export interface Action<R extends BaseRoom> {
  schema: z.ZodTypeAny;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: (room: R, playerId: string, payload: any, ctx: Ctx) => ActionResult;
}

/** Defines an action whose payload type is inferred from its schema. */
export function action<R extends BaseRoom, S extends z.ZodTypeAny>(
  schema: S,
  run: (room: R, playerId: string, payload: z.infer<S>, ctx: Ctx) => ActionResult,
): Action<R> {
  return { schema, run };
}

export interface GameDef<R extends BaseRoom> {
  /** Socket.IO namespace, e.g. '/rush'. */
  ns: string;
  newRoom: (code: string, ctx: Ctx) => R;
  /** A player left mid-game: put the room back in a sensible state (usually the lobby). */
  onLeave: (room: R) => void;
  view: (room: R, viewerId: string, now: number) => object;
  /** When the server must next act on its own (deadline, scheduled event), or null. */
  wakeAt?: (room: R) => number | null;
  /** Handle whatever is due at ctx.now. Return true if clients need a new state. */
  tick?: (room: R, ctx: Ctx) => boolean;
  actions: Record<string, Action<R>>;
  /** Optional: extra listeners per socket (e.g. ephemeral relays). */
  onConnection?: (socket: Socket, getRoom: () => R | undefined, playerId: () => string | undefined, nsp: Namespace) => void;
}

interface SocketData {
  code?: string;
  playerId?: string;
}

type AckFn = (res: Ack<Record<string, unknown>>) => void;

const IDLE_MS = 2 * 60 * 60 * 1000;
const EMPTY_MS = 30 * 60 * 1000;
const SWEEP_MS = 5 * 60 * 1000;

const ctxNow = (): Ctx => ({ now: Date.now(), rng: Math.random });

export function registerGame<R extends BaseRoom>(io: Server, def: GameDef<R>): Namespace {
  const nsp = io.of(def.ns);
  const rooms = new Map<string, R>();
  const emptySince = new Map<string, number>();
  const timers = new Map<string, { at: number; handle: NodeJS.Timeout }>();
  const tag = `[${def.ns.slice(1)}]`;

  function syncTimer(room: R) {
    const at = def.wakeAt?.(room) ?? null;
    const existing = timers.get(room.code);
    if (existing && existing.at === at) return;
    if (existing) clearTimeout(existing.handle);
    timers.delete(room.code);
    if (at === null) return;
    const handle = setTimeout(
      () => {
        timers.delete(room.code);
        const r = rooms.get(room.code);
        if (!r) return;
        if (def.tick?.(r, ctxNow())) void broadcast(r);
        else syncTimer(r);
      },
      Math.max(0, at - Date.now()),
    );
    timers.set(room.code, { at, handle });
  }

  async function broadcast(room: R) {
    room.lastActivityAt = Date.now();
    syncTimer(room);
    const sockets = await nsp.in(room.code).fetchSockets();
    for (const s of sockets) {
      const data = s.data as SocketData;
      if (data.playerId && room.players.some((p) => p.id === data.playerId)) {
        s.emit('room:state', def.view(room, data.playerId, Date.now()));
      }
    }
  }

  function dropRoom(code: string) {
    rooms.delete(code);
    emptySince.delete(code);
    const t = timers.get(code);
    if (t) clearTimeout(t.handle);
    timers.delete(code);
  }

  function attach(socket: Socket, room: R, playerId: string) {
    const data = socket.data as SocketData;
    if (data.code && data.code !== room.code) void socket.leave(data.code);
    data.code = room.code;
    data.playerId = playerId;
    void socket.join(room.code);
    const player = room.players.find((p) => p.id === playerId);
    if (player) player.connected = true;
  }

  function errorAck(ack: AckFn | undefined, err: unknown) {
    if (err instanceof GameError) ack?.({ ok: false, code: err.code, message: err.message });
    else {
      console.error(`${tag} unexpected error`, err);
      ack?.({ ok: false, code: 'BAD_INPUT', message: 'Something went wrong' });
    }
  }

  const identity = (name: string) => ({ id: randomUUID().slice(0, 8), token: randomBytes(18).toString('base64url'), name });

  nsp.on('connection', (socket) => {
    const data = socket.data as SocketData;
    const currentRoom = () => (data.code ? rooms.get(data.code) : undefined);

    socket.on('room:create', (raw: unknown, ack?: AckFn) => {
      const parsed = CreateSchema.safeParse(raw);
      if (!parsed.success) return ack?.({ ok: false, code: 'BAD_INPUT', message: 'Pick a name (1–20 characters)' });
      try {
        let code: string;
        do code = Array.from({ length: 4 }, () => ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)]).join('');
        while (rooms.has(code));
        const room = def.newRoom(code, ctxNow());
        const player = addPlayer(room, identity(parsed.data.name));
        rooms.set(code, room);
        attach(socket, room, player.id);
        ack?.({ ok: true, code, playerId: player.id, token: player.token });
        void broadcast(room);
      } catch (err) {
        errorAck(ack, err);
      }
    });

    socket.on('room:join', (raw: unknown, ack?: AckFn) => {
      const parsed = JoinSchema.safeParse(raw);
      if (!parsed.success) return ack?.({ ok: false, code: 'BAD_INPUT', message: 'Check the name and the 4-letter code' });
      const room = rooms.get(parsed.data.code);
      if (!room) return ack?.({ ok: false, code: 'ROOM_NOT_FOUND', message: "That room doesn't exist (anymore?)" });
      try {
        const player = addPlayer(room, identity(parsed.data.name));
        attach(socket, room, player.id);
        ack?.({ ok: true, code: room.code, playerId: player.id, token: player.token });
        void broadcast(room);
      } catch (err) {
        errorAck(ack, err);
      }
    });

    socket.on('room:resume', (raw: unknown, ack?: AckFn) => {
      const parsed = ResumeSchema.safeParse(raw);
      if (!parsed.success) return ack?.({ ok: false, code: 'BAD_INPUT', message: 'Invalid session' });
      const room = rooms.get(parsed.data.code);
      const player = room?.players.find((p) => p.token === parsed.data.token);
      if (!room || !player) return ack?.({ ok: false, code: 'ROOM_NOT_FOUND', message: 'That game has ended' });
      attach(socket, room, player.id);
      ack?.({ ok: true, code: room.code, playerId: player.id });
      void broadcast(room);
    });

    socket.on('room:leave', (_raw: unknown, ack?: AckFn) => {
      const room = currentRoom();
      if (room && data.playerId) {
        const idx = room.players.findIndex((p) => p.id === data.playerId);
        if (idx >= 0) room.players.splice(idx, 1);
        if (room.players[0]) room.players[0].isHost = true;
        void socket.leave(room.code);
        if (room.players.length === 0) dropRoom(room.code);
        else {
          if (room.phase !== 'LOBBY') def.onLeave(room);
          void broadcast(room);
        }
      }
      data.code = undefined;
      data.playerId = undefined;
      ack?.({ ok: true });
    });

    for (const [event, act] of Object.entries(def.actions)) {
      socket.on(event, (raw: unknown, ack?: AckFn) => {
        const parsed = act.schema.safeParse(raw ?? {});
        if (!parsed.success) return ack?.({ ok: false, code: 'BAD_INPUT', message: 'Invalid input' });
        const room = currentRoom();
        if (!room || !data.playerId) return ack?.({ ok: false, code: 'NOT_IN_ROOM', message: 'You are not in a room' });
        try {
          const extra = act.run(room, data.playerId, parsed.data, ctxNow());
          ack?.({ ok: true, ...(extra ?? {}) });
          void broadcast(room);
        } catch (err) {
          errorAck(ack, err);
        }
      });
    }

    def.onConnection?.(socket, currentRoom, () => data.playerId, nsp);

    socket.on('disconnect', async () => {
      const room = currentRoom();
      if (!room || !data.playerId) return;
      const others = (await nsp.in(room.code).fetchSockets()).filter((s) => (s.data as SocketData).playerId === data.playerId);
      if (others.length > 0) return;
      const player = room.players.find((p) => p.id === data.playerId);
      if (player) player.connected = false;
      void broadcast(room);
    });
  });

  setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
      const anyone = room.players.some((p) => p.connected);
      if (anyone) emptySince.delete(code);
      else if (!emptySince.has(code)) emptySince.set(code, now);
      const empty = emptySince.get(code);
      if (now - room.lastActivityAt > IDLE_MS || (empty !== undefined && now - empty > EMPTY_MS)) dropRoom(code);
    }
  }, SWEEP_MS).unref();

  return nsp;
}
