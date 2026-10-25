import type { Server } from 'socket.io';
import { action, publicPlayers, registerGame } from '@gfc/kit/server';
import { EmptySchema } from '@gfc/kit/shared';
import { HZ, InputSchema, type PublicState, type Room } from '../shared';
import * as game from './game';

export function toPublicState(room: Room, viewerId: string, now: number): PublicState {
  return {
    code: room.code,
    you: viewerId,
    serverNow: now,
    players: publicPlayers(room),
    phase: room.phase,
    deadline: null,
    mySlot: Math.max(0, room.players.findIndex((p) => p.id === viewerId)),
    startsAt: room.startsAt,
    checkpoint: room.checkpoint,
    falls: room.falls,
    pulls: room.pulls,
    lastFallAt: room.lastFallAt,
    results: room.results,
    readyForNext: room.readyForNext,
    frame: room.bodies.length ? game.frame(room) : null,
  };
}

export function registerTethered(io: Server) {
  return registerGame<Room>(io, {
    ns: '/tethered',
    newRoom: game.newRoom,
    onLeave: game.resetToLobby,
    view: toPublicState,
    // The 3-2-1 is drawn by clients from startsAt; the loop simply doesn't step before it.
    loop: { hz: HZ, active: (room) => room.phase === 'CLIMB', step: game.step, frame: (room) => game.frame(room) },
    actions: {
      'game:start': action(EmptySchema, (room: Room, me, _p, ctx) => game.startGame(room, me, ctx)),
      'input': action(InputSchema, (room: Room, me, p) => game.setInput(room, me, p), { quiet: true }),
      'round:ready': action(EmptySchema, (room: Room, me, _p, ctx) => game.readyForNext(room, me, ctx)),
      'game:rematch': action(EmptySchema, (room: Room, me) => game.toLobby(room, me)),
    },
  });
}
