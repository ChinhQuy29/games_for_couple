import type { Server } from 'socket.io';
import { action, publicPlayers, registerGame } from '@gfc/kit/server';
import { EmptySchema } from '@gfc/kit/shared';
import { PickSchema, SettingsPatchSchema, type PublicState, type Room } from '../shared';
import * as game from './game';

export function toPublicState(room: Room, viewerId: string, now: number): PublicState {
  return {
    code: room.code,
    you: viewerId,
    serverNow: now,
    players: publicPlayers(room),
    phase: room.phase,
    deadline: null,
    settings: room.settings,
    board: room.board,
    target: game.currentTarget(room),
    found: room.finds.length,
    total: room.sequence.length,
    startsAt: room.startsAt,
    targetSince: room.targetSince,
    claimed: Object.fromEntries(room.finds.map((f) => [f.n, f.by])),
    finds: room.finds,
    scores: room.scores,
    myLockUntil: room.lockedUntil[viewerId] ?? 0,
  };
}

export function registerRush(io: Server) {
  return registerGame<Room>(io, {
    ns: '/rush',
    newRoom: game.newRoom,
    onLeave: game.resetToLobby,
    view: toPublicState,
    wakeAt: game.wakeAt,
    tick: game.tick,
    actions: {
      'settings:update': action(SettingsPatchSchema, (room: Room, me, patch) => game.updateSettings(room, me, patch)),
      'game:start': action(EmptySchema, (room: Room, me, _p, ctx) => game.startGame(room, me, ctx)),
      'pick': action(PickSchema, (room: Room, me, p, ctx) => ({ result: game.pickNumber(room, me, p.n, p.ms, ctx) })),
      'game:rematch': action(EmptySchema, (room: Room, me) => game.rematch(room, me)),
    },
  });
}
