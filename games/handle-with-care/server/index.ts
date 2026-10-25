import type { Server } from 'socket.io';
import { action, publicPlayers, registerGame } from '@gfc/kit/server';
import { EmptySchema } from '@gfc/kit/shared';
import { HZ, HeldSchema, type PublicState, type Room } from '../shared';
import * as game from './game';

export function toPublicState(room: Room, viewerId: string, now: number): PublicState {
  return {
    code: room.code,
    you: viewerId,
    serverNow: now,
    players: publicPlayers(room),
    phase: room.phase,
    deadline: null,
    house: room.house,
    mySlot: Math.max(0, room.players.findIndex((p) => p.id === viewerId)),
    startsAt: room.startsAt,
    items: room.items.map((i) => ({ id: i.id, kind: i.kind, state: i.state, holders: i.holders })),
    earned: room.earned,
    possible: room.items.length ? game.possible(room) : 0,
    feed: room.feed,
    results: room.results,
    readyForNext: room.readyForNext,
    frame: room.phase === 'MOVE' ? game.frame(room) : null,
  };
}

export function registerCarry(io: Server) {
  return registerGame<Room>(io, {
    ns: '/carry',
    newRoom: game.newRoom,
    onLeave: game.resetToLobby,
    view: toPublicState,
    loop: { hz: HZ, active: (room) => room.phase === 'MOVE', step: game.step, frame: (room) => game.frame(room) },
    actions: {
      'game:start': action(EmptySchema, (room: Room, me, _p, ctx) => game.startGame(room, me, ctx)),
      'input': action(HeldSchema, (room: Room, me, p) => game.setHeld(room, me, p), { quiet: true }),
      'round:ready': action(EmptySchema, (room: Room, me, _p, ctx) => game.readyForNext(room, me, ctx)),
      'game:rematch': action(EmptySchema, (room: Room, me) => game.toLobby(room, me)),
    },
  });
}
