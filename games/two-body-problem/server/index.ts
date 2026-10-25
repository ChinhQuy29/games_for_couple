import type { Server } from 'socket.io';
import { action, publicPlayers, registerGame } from '@gfc/kit/server';
import { EmptySchema } from '@gfc/kit/shared';
import { HZ, HeldSchema, SettingsSchema, type PublicState, type Room } from '../shared';
import * as game from './game';

export function toPublicState(room: Room, viewerId: string, now: number): PublicState {
  const inGame = room.phase !== 'LOBBY' && room.walkerId !== null;
  return {
    code: room.code,
    you: viewerId,
    serverNow: now,
    players: publicPlayers(room),
    phase: room.phase,
    deadline: null,
    startLevel: room.startLevel,
    level: room.level,
    myRole: inGame ? (room.walkerId === viewerId ? 'walker' : 'jumper') : null,
    walkerId: room.walkerId,
    startsAt: room.startsAt,
    deaths: room.deaths,
    swaps: room.swaps,
    lastDeathAt: room.lastDeathAt,
    results: room.results,
    readyForNext: room.readyForNext,
    frame: room.phase === 'PLAY' ? game.frame(room) : null,
  };
}

export function registerTwoBody(io: Server) {
  return registerGame<Room>(io, {
    ns: '/twobody',
    newRoom: game.newRoom,
    onLeave: game.resetToLobby,
    view: toPublicState,
    loop: { hz: HZ, active: (room) => room.phase === 'PLAY', step: game.step, frame: (room) => game.frame(room) },
    actions: {
      'settings:update': action(SettingsSchema, (room: Room, me, p) => game.setStartLevel(room, me, p.startLevel)),
      'game:start': action(EmptySchema, (room: Room, me, _p, ctx) => game.startGame(room, me, ctx)),
      'input': action(HeldSchema, (room: Room, me, p) => game.setHeld(room, me, p), { quiet: true }),
      'level:retry': action(EmptySchema, (room: Room, me, _p, ctx) => game.retry(room, me, ctx)),
      'round:ready': action(EmptySchema, (room: Room, me, _p, ctx) => game.readyForNext(room, me, ctx)),
      'game:rematch': action(EmptySchema, (room: Room, me) => game.toLobby(room, me)),
    },
  });
}
