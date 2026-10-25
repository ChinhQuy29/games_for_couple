import type { Server } from 'socket.io';
import { z } from 'zod';
import { action, publicPlayers, registerGame } from '@gfc/kit/server';
import { EmptySchema } from '@gfc/kit/shared';
import { DropSchema, ItemSchema, ROOMS, SettingsSchema, type PublicState, type Room } from '../shared';
import * as game from './game';

/** Slot kinds never leave the server: you only see where things *can* go, not what goes there. */
export function toPublicState(room: Room, viewerId: string, now: number): PublicState {
  const def = ROOMS[room.room]!;
  const inRoom = room.phase !== 'LOBBY';
  const hintSlot = room.hint ? def.slots[room.hint.slot]! : null;
  const hintItem = room.hint ? room.items.find((i) => i.id === room.hint!.item) : null;
  return {
    code: room.code,
    you: viewerId,
    serverNow: now,
    players: publicPlayers(room),
    phase: room.phase,
    deadline: null,
    startRoom: room.startRoom,
    swapBoxes: room.swapBoxes,
    room: room.room,
    mySeat: Math.max(0, room.players.findIndex((p) => p.id === viewerId)),
    items: inRoom ? room.items : [],
    slots: inRoom ? def.slots.map(({ x, y }) => ({ x, y })) : [],
    held: room.held,
    boxLeft: [0, 1].map((seat) => room.items.filter((i) => i.inBox && i.owner === seat).length) as [number, number],
    wrong: game.wrongItems(room),
    hintsLeft: room.hintsLeft,
    hint: room.hint && hintSlot && hintItem ? { item: hintItem.id, kind: hintItem.kind, x: hintSlot.x, y: hintSlot.y, until: room.hint.until } : null,
    startedAt: room.startedAt,
    results: room.results,
    readyForNext: room.readyForNext,
  };
}

const DragSchema = z.object({ item: z.number().int().min(0).max(999), x: z.number().finite(), y: z.number().finite() });

export function registerMovingIn(io: Server) {
  return registerGame<Room>(io, {
    ns: '/movingin',
    newRoom: game.newRoom,
    onLeave: game.resetToLobby,
    view: toPublicState,
    wakeAt: game.wakeAt,
    tick: game.tick,
    actions: {
      'settings:update': action(SettingsSchema, (room: Room, me, p) => game.updateSettings(room, me, p)),
      'game:start': action(EmptySchema, (room: Room, me, _p, ctx) => game.startGame(room, me, ctx)),
      'unpack': action(EmptySchema, (room: Room, me) => ({ item: game.unpack(room, me) })),
      'grab': action(ItemSchema, (room: Room, me, p) => game.grab(room, me, p.item)),
      'drop': action(DropSchema, (room: Room, me, p, ctx) => ({ done: game.drop(room, me, p.item, p.x, p.y, ctx) })),
      'hint': action(EmptySchema, (room: Room, me, _p, ctx) => game.useHint(room, me, ctx)),
      'round:ready': action(EmptySchema, (room: Room, me, _p, ctx) => game.readyForNext(room, me, ctx)),
      'game:rematch': action(EmptySchema, (room: Room, me) => game.toLobby(room, me)),
    },
    // Live dragging is relayed straight to the partner, ~30 times a second, without touching the state.
    onConnection: (socket, getRoom, playerId) => {
      socket.on('drag', (raw: unknown) => {
        const p = DragSchema.safeParse(raw);
        const room = getRoom();
        const me = playerId();
        if (!p.success || !room || !me || room.phase !== 'UNPACK' || room.held[me] !== p.data.item) return;
        socket.to(room.code).emit('drag', { by: me, ...p.data });
      });
    },
  });
}
