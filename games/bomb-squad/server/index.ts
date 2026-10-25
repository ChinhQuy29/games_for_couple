import type { Server } from 'socket.io';
import { action, publicPlayers, registerGame } from '@gfc/kit/server';
import { EmptySchema } from '@gfc/kit/shared';
import { BombActSchema, SettingsSchema, type PublicState, type Room } from '../shared';
import * as game from './game';

/** The Expert never gets the bomb while it's armed — that's the whole game. */
export function toPublicState(room: Room, viewerId: string, now: number): PublicState {
  const bomb = room.bomb;
  const role = room.defuserId ? (room.defuserId === viewerId ? 'defuser' : 'expert') : null;
  const showBomb = bomb && (role === 'defuser' || room.phase === 'RESULT');
  return {
    code: room.code,
    you: viewerId,
    serverNow: now,
    players: publicPlayers(room),
    phase: room.phase,
    deadline: room.phase === 'ARMED' && bomb ? bomb.endsAt : null,
    difficulty: room.difficulty,
    role,
    defuserId: room.defuserId,
    bomb: showBomb ? bomb : null,
    manual: bomb && (role === 'expert' || room.phase === 'RESULT') ? game.editionOf(bomb.edition) : null,
    edition: bomb?.edition ?? null,
    kinds: bomb?.modules.map((m) => m.kind) ?? [],
    strikes: bomb?.strikes ?? 0,
    modulesTotal: bomb?.modules.length ?? 0,
    modulesSolved: bomb?.modules.filter((m) => m.solved).length ?? 0,
    results: room.results,
    readyForNext: room.readyForNext,
  };
}

export function registerBomb(io: Server) {
  return registerGame<Room>(io, {
    ns: '/bomb',
    newRoom: game.newRoom,
    onLeave: game.resetToLobby,
    view: toPublicState,
    wakeAt: game.wakeAt,
    tick: game.tick,
    actions: {
      'settings:update': action(SettingsSchema, (room: Room, me, p) => game.setDifficulty(room, me, p.difficulty)),
      'game:start': action(EmptySchema, (room: Room, me, _p, ctx) => game.startGame(room, me, ctx)),
      'bomb:act': action(BombActSchema, (room: Room, me, p, ctx) => ({ result: game.act(room, me, p, ctx) })),
      'round:ready': action(EmptySchema, (room: Room, me, _p, ctx) => game.readyForNext(room, me, ctx)),
      'game:rematch': action(EmptySchema, (room: Room, me) => game.toLobby(room, me)),
    },
  });
}
