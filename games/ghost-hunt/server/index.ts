import type { Server } from 'socket.io';
import { action, publicPlayers, registerGame } from '@gfc/kit/server';
import { EmptySchema } from '@gfc/kit/shared';
import {
  CAMERAS,
  JournalSchema,
  MAP,
  MoveSchema,
  ToolSchema,
  idx,
  roomAt,
  visibleFrom,
  type ExplorerView,
  type NavigatorView,
  type PublicState,
  type Room,
} from '../shared';
import * as game from './game';

/**
 * The Explorer gets only the tiles in their flashlight, and the ghost only while it hunts
 * and is in sight. The Navigator gets the floor plan and instruments, never the ghost.
 */
export function toPublicState(room: Room, viewerId: string, now: number): PublicState {
  let view: PublicState['view'] = null;
  if (room.phase === 'HUNT' && room.explorerId) {
    const me = room.me;
    if (viewerId === room.explorerId) {
      const vis = me.hidden ? [idx(...me.pos)] : visibleFrom(me.pos[0], me.pos[1], me.facing);
      const seen = new Set(vis);
      const sees = (p: [number, number]) => seen.has(idx(...p));
      const explorer: ExplorerView = {
        role: 'explorer',
        pos: me.pos,
        facing: me.facing,
        hidden: me.hidden,
        uv: me.uv,
        visible: Object.fromEntries(vis.map((i) => [i, MAP[i]!])),
        ghost: room.hunt === 'hunt' && !me.hidden && sees(room.ghostPos) ? room.ghostPos : null,
        book: room.book ? { pos: room.book.pos, written: sees(room.book.pos) ? room.book.written : null } : null,
        cameras: room.cameras.map((c) => c.pos),
        prints: me.uv ? room.prints.filter(sees) : [],
      };
      view = explorer;
    } else {
      const ghostRoom = roomAt(...room.ghostPos);
      const navigator: NavigatorView = {
        role: 'navigator',
        map: MAP,
        explorer: { pos: me.pos, facing: me.facing, hidden: me.hidden, uv: me.uv },
        cameras: room.cameras.map((c) => ({
          pos: c.pos,
          room: c.room,
          orbs: c.room === room.ghostRoom && game.hasEvidence(room, 'orbs'),
          motion: ghostRoom === c.room,
        })),
        book: room.book ? { pos: room.book.pos } : null,
        readings: room.readings,
      };
      view = navigator;
    }
  }
  return {
    code: room.code,
    you: viewerId,
    serverNow: now,
    players: publicPlayers(room),
    phase: room.phase,
    deadline: room.phase === 'HUNT' ? room.endsAt : null,
    explorerId: room.explorerId,
    view,
    sanity: Math.round(room.sanity),
    hunt: room.hunt,
    feed: room.feed,
    journal: room.journal,
    camerasLeft: CAMERAS - room.cameras.length,
    spiritboxReadyAt: room.spiritboxReadyAt,
    results: room.results,
    readyForNext: room.readyForNext,
  };
}

export function registerGhost(io: Server) {
  return registerGame<Room>(io, {
    ns: '/ghost',
    newRoom: game.newRoom,
    onLeave: game.resetToLobby,
    view: toPublicState,
    wakeAt: game.wakeAt,
    tick: game.tick,
    actions: {
      'game:start': action(EmptySchema, (room: Room, me, _p, ctx) => game.startGame(room, me, ctx)),
      'move': action(MoveSchema, (room: Room, me, p, ctx) => game.move(room, me, p.dir, ctx)),
      'tool': action(ToolSchema, (room: Room, me, p, ctx) => ({ answer: game.useTool(room, me, p.tool, ctx) ?? null })),
      'journal': action(JournalSchema, (room: Room, me, p) => game.updateJournal(room, me, p)),
      'round:ready': action(EmptySchema, (room: Room, me, _p, ctx) => game.readyForNext(room, me, ctx)),
      'game:rematch': action(EmptySchema, (room: Room, me) => game.toLobby(room, me)),
    },
  });
}
