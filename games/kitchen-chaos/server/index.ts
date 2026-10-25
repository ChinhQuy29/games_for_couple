import type { Server } from 'socket.io';
import { action, publicPlayers, registerGame } from '@gfc/kit/server';
import { EmptySchema } from '@gfc/kit/shared';
import { ClickSchema, SettingsSchema, type PublicState, type Room } from '../shared';
import * as game from './game';

/** Everything in the kitchen is public: you can watch your partner panic. */
export function toPublicState(room: Room, viewerId: string, now: number): PublicState {
  return {
    code: room.code,
    you: viewerId,
    serverNow: now,
    players: publicPlayers(room),
    phase: room.phase,
    deadline: room.phase === 'SHIFT' ? room.endsAt : null,
    level: room.level,
    mySide: room.sides ? (room.sides.prep === viewerId ? 'prep' : room.sides.cook === viewerId ? 'cook' : null) : null,
    sides: room.sides,
    stations: room.stations,
    hands: room.hands,
    orders: room.orders,
    startsAt: room.startsAt,
    endsAt: room.endsAt,
    coins: room.coins,
    served: room.served,
    expired: room.expired,
    burnt: room.burnt,
    feed: room.feed,
    results: room.results,
    readyForNext: room.readyForNext,
  };
}

export function registerKitchen(io: Server) {
  return registerGame<Room>(io, {
    ns: '/kitchen',
    newRoom: game.newRoom,
    onLeave: game.resetToLobby,
    view: toPublicState,
    wakeAt: game.wakeAt,
    tick: game.tick,
    actions: {
      'settings:update': action(SettingsSchema, (room: Room, me, p) => game.setLevel(room, me, p.level)),
      'game:start': action(EmptySchema, (room: Room, me, _p, ctx) => game.startGame(room, me, ctx)),
      'kitchen:click': action(ClickSchema, (room: Room, me, p, ctx) => ({ gain: game.click(room, me, p.station, ctx) ?? null })),
      'round:ready': action(EmptySchema, (room: Room, me, _p, ctx) => game.readyForNext(room, me, ctx)),
      'game:rematch': action(EmptySchema, (room: Room, me) => game.toLobby(room, me)),
    },
  });
}
