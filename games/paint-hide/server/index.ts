import type { Server } from 'socket.io';
import { action, publicPlayers, registerGame } from '@gfc/kit/server';
import { EmptySchema } from '@gfc/kit/shared';
import { ClickSchema, HideSchema, type PublicState, type Room } from '../shared';
import * as game from './game';

/** The seeker gets the creature only once seeking starts (it has to be drawn). */
export function toPublicState(room: Room, viewerId: string, now: number): PublicState {
  const inRound = room.phase !== 'LOBBY' && room.hiderId !== null;
  const myRole = inRound ? (room.hiderId === viewerId ? 'hider' : 'seeker') : null;
  const showCreature = room.phase !== 'HIDE' || myRole === 'hider';
  return {
    code: room.code,
    you: viewerId,
    serverNow: now,
    players: publicPlayers(room),
    phase: room.phase,
    deadline: room.phase === 'HIDE' ? room.hideEndsAt : room.phase === 'SEEK' ? room.seekEndsAt : null,
    round: room.round,
    hiderId: room.hiderId,
    myRole,
    seed: room.seed,
    placement: showCreature ? room.placement : null,
    paint: showCreature ? room.paint : null,
    clicks: room.clicks,
    seekStartsAt: room.seekStartsAt,
    found: room.found,
    scores: room.scores,
    results: room.results,
    readyForNext: room.readyForNext,
  };
}

export function registerPaint(io: Server) {
  return registerGame<Room>(io, {
    ns: '/paint',
    newRoom: game.newRoom,
    onLeave: game.resetToLobby,
    view: toPublicState,
    wakeAt: game.wakeAt,
    tick: game.tick,
    actions: {
      'game:start': action(EmptySchema, (room: Room, me, _p, ctx) => game.startGame(room, me, ctx)),
      'hide': action(HideSchema, (room: Room, me, p, ctx) => game.hide(room, me, { x: p.x, y: p.y, rot: p.rot, flip: p.flip }, p.paint, ctx)),
      'click': action(ClickSchema, (room: Room, me, p, ctx) => ({ hit: game.click(room, me, p.x, p.y, ctx) })),
      'round:ready': action(EmptySchema, (room: Room, me, _p, ctx) => game.readyForNext(room, me, ctx)),
      'game:rematch': action(EmptySchema, (room: Room, me) => game.toLobby(room, me)),
    },
  });
}
