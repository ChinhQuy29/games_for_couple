import type { Server } from 'socket.io';
import { action, publicPlayers, registerGame } from '@gfc/kit/server';
import { EmptySchema } from '@gfc/kit/shared';
import { HZ, HeldSchema, type PublicState, type Room } from '../shared';
import * as game from './game';

/** Both see the road and the signs. Only the co-pilot gets the route (which town to follow). */
export function toPublicState(room: Room, viewerId: string, now: number): PublicState {
  const inTrip = room.phase !== 'LOBBY' && room.driverId !== null;
  const myRole = inTrip ? (room.driverId === viewerId ? 'driver' : 'copilot') : null;
  return {
    code: room.code,
    you: viewerId,
    serverNow: now,
    players: publicPlayers(room),
    phase: room.phase,
    deadline: null,
    trip: room.trip,
    driverId: room.driverId,
    myRole,
    curve: room.curve,
    obstacles: room.obstacles,
    junctions: room.junctions.map((j) => ({ d: j.d, names: j.names, passed: j.passed })),
    route: myRole === 'copilot' || room.phase !== 'DRIVE' ? room.route : null,
    wrongTurns: room.wrongTurns,
    startsAt: room.startsAt,
    feed: room.feed,
    results: room.results,
    readyForNext: room.readyForNext,
    frame: room.phase === 'DRIVE' ? game.frame(room) : null,
  };
}

export function registerRoadTrip(io: Server) {
  return registerGame<Room>(io, {
    ns: '/roadtrip',
    newRoom: game.newRoom,
    onLeave: game.resetToLobby,
    view: toPublicState,
    loop: { hz: HZ, active: (room) => room.phase === 'DRIVE', step: game.step, frame: (room) => game.frame(room) },
    actions: {
      'game:start': action(EmptySchema, (room: Room, me, _p, ctx) => game.startGame(room, me, ctx)),
      'input': action(HeldSchema, (room: Room, me, p) => game.setHeld(room, me, p), { quiet: true }),
      'round:ready': action(EmptySchema, (room: Room, me, _p, ctx) => game.readyForNext(room, me, ctx)),
      'game:rematch': action(EmptySchema, (room: Room, me) => game.toLobby(room, me)),
    },
  });
}
