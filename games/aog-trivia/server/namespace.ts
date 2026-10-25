import type { Namespace, Server, Socket } from 'socket.io';
import type { z } from 'zod';
import {
  CreateSchema,
  EmptySchema,
  JoinSchema,
  AnswerSchema,
  FlagSchema,
  ResumeSchema,
  SettingsPatchSchema,
  TIMING,
  TypingSchema,
  type Ack,
  type Room,
} from '../shared';
import * as game from './game';
import { RoomStore } from './rooms';
import { RoomTimers } from './timers';
import { toPublicState } from './view';

interface SocketData {
  code?: string;
  playerId?: string;
}

type AckFn = (res: Ack<Record<string, unknown>>) => void;

const ctx = (): game.Ctx => ({ now: Date.now(), rng: Math.random });

export function registerAog(io: Server): Namespace {
  const nsp = io.of('/aog');
  const store = new RoomStore();
  const timers = new RoomTimers((code) => {
    const room = store.get(code);
    if (!room) return;
    if (game.tick(room, ctx())) void broadcast(room);
    else timers.sync(room.code, game.wakeAt(room, Date.now()));
  });

  async function broadcast(room: Room) {
    room.lastActivityAt = Date.now();
    timers.sync(room.code, game.wakeAt(room, Date.now()));
    const sockets = await nsp.in(room.code).fetchSockets();
    for (const s of sockets) {
      const data = s.data as SocketData;
      if (data.playerId && room.players.some((p) => p.id === data.playerId)) {
        s.emit('room:state', toPublicState(room, data.playerId, Date.now()));
      }
    }
  }

  function attach(socket: Socket, room: Room, playerId: string) {
    const data = socket.data as SocketData;
    if (data.code && data.code !== room.code) void socket.leave(data.code);
    data.code = room.code;
    data.playerId = playerId;
    void socket.join(room.code);
    const player = room.players.find((p) => p.id === playerId);
    if (player) player.connected = true;
  }

  function errorAck(ack: AckFn | undefined, err: unknown) {
    if (err instanceof game.GameError) ack?.({ ok: false, code: err.code, message: err.message });
    else {
      console.error('[aog] unexpected error', err);
      ack?.({ ok: false, code: 'BAD_INPUT', message: 'Something went wrong' });
    }
  }

  nsp.on('connection', (socket) => {
    const data = socket.data as SocketData;

    /** Registers an in-room action: validates payload, runs it, acks, broadcasts. */
    function onAction<S extends z.ZodTypeAny>(event: string, schema: S, run: (room: Room, playerId: string, payload: z.infer<S>) => void) {
      socket.on(event, (raw: unknown, ack?: AckFn) => {
        const parsed = schema.safeParse(raw ?? {});
        if (!parsed.success) return ack?.({ ok: false, code: 'BAD_INPUT', message: 'Invalid input' });
        const room = data.code ? store.get(data.code) : undefined;
        if (!room || !data.playerId) return ack?.({ ok: false, code: 'NOT_IN_ROOM', message: 'You are not in a room' });
        try {
          run(room, data.playerId, parsed.data);
          ack?.({ ok: true });
          void broadcast(room);
        } catch (err) {
          errorAck(ack, err);
        }
      });
    }

    socket.on('room:create', (raw: unknown, ack?: AckFn) => {
      const parsed = CreateSchema.safeParse(raw);
      if (!parsed.success) return ack?.({ ok: false, code: 'BAD_INPUT', message: 'Pick a name (1–20 characters)' });
      try {
        const { room, player } = store.create(parsed.data.name, ctx());
        attach(socket, room, player.id);
        ack?.({ ok: true, code: room.code, playerId: player.id, token: player.token });
        void broadcast(room);
      } catch (err) {
        errorAck(ack, err);
      }
    });

    socket.on('room:join', (raw: unknown, ack?: AckFn) => {
      const parsed = JoinSchema.safeParse(raw);
      if (!parsed.success) return ack?.({ ok: false, code: 'BAD_INPUT', message: 'Check the name and the 4-letter code' });
      const room = store.get(parsed.data.code);
      if (!room) return ack?.({ ok: false, code: 'ROOM_NOT_FOUND', message: "That room doesn't exist (anymore?)" });
      try {
        const player = store.join(room, parsed.data.name);
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
      const room = store.get(parsed.data.code);
      const player = room?.players.find((p) => p.token === parsed.data.token);
      if (!room || !player) return ack?.({ ok: false, code: 'ROOM_NOT_FOUND', message: 'That game has ended' });
      attach(socket, room, player.id);
      ack?.({ ok: true, code: room.code, playerId: player.id });
      void broadcast(room);
    });

    socket.on('room:leave', (_raw: unknown, ack?: AckFn) => {
      const room = data.code ? store.get(data.code) : undefined;
      if (room && data.playerId) {
        game.removePlayer(room, data.playerId);
        void socket.leave(room.code);
        if (room.players.length === 0) {
          timers.clear(room.code);
          store.delete(room.code);
        } else void broadcast(room);
      }
      data.code = undefined;
      data.playerId = undefined;
      ack?.({ ok: true });
    });

    onAction('settings:update', SettingsPatchSchema, (room, me, patch) => game.updateSettings(room, me, patch));
    onAction('game:start', EmptySchema, (room, me) => game.startGame(room, me, ctx()));
    onAction('answer:submit', AnswerSchema, (room, me, p) => game.answer(room, me, p.choice, p.elapsedMs, ctx()));
    onAction('round:ready', EmptySchema, (room, me) => game.readyForNext(room, me, ctx()));
    onAction('game:rematch', EmptySchema, (room, me) => game.rematch(room, me));
    onAction('question:flag', FlagSchema, (room, me, p) => {
      const id = game.flag(room, me, p.index);
      // Logged so wrong questions can be found and fixed in server/content/questions.ts.
      console.log(`[aog] 🚩 question "${id}" ${room.flagged.includes(id) ? 'flagged' : 'unflagged'} in room ${room.code}`);
    });

    socket.on('typing', (raw: unknown) => {
      const parsed = TypingSchema.safeParse(raw);
      if (parsed.success && data.code) socket.to(data.code).emit('partner:typing', parsed.data);
    });

    socket.on('disconnect', async () => {
      const room = data.code ? store.get(data.code) : undefined;
      if (!room || !data.playerId) return;
      const others = (await nsp.in(room.code).fetchSockets()).filter(
        (s) => (s.data as SocketData).playerId === data.playerId,
      );
      if (others.length > 0) return;
      const player = room.players.find((p) => p.id === data.playerId);
      if (player) player.connected = false;
      void broadcast(room);
    });
  });

  setInterval(() => {
    for (const code of store.sweep(Date.now())) timers.clear(code);
  }, TIMING.sweepMs).unref();

  return nsp;
}
