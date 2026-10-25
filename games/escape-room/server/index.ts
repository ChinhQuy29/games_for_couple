import type { Server } from 'socket.io';
import { action, publicPlayers, registerGame } from '@gfc/kit/server';
import { EmptySchema } from '@gfc/kit/shared';
import { ActSchema, type Card, type Puzzle, type PublicState, type Room } from '../shared';
import * as game from './game';

/** The clue goes to one seat, the controls to the other. Nobody gets the answer itself. */
export function cardFor(p: Puzzle, seat: number): Card {
  const role = p.actor === seat ? 'actor' : 'clue';
  switch (p.kind) {
    case 'dial':
      return role === 'clue' ? { kind: 'dial', role, mural: p.answer } : { kind: 'dial', role, dials: p.dials };
    case 'code':
      return role === 'clue' ? { kind: 'code', role, order: p.order } : { kind: 'code', role, shelf: p.shelf, length: p.answer.length };
    case 'colors':
      return role === 'clue' ? { kind: 'colors', role, window: p.answer } : { kind: 'colors', role, length: p.answer.length, progress: p.progress };
    case 'levers':
      return role === 'clue'
        ? { kind: 'levers', role, pattern: p.answer.map((up) => (up ? p.legend.up : p.legend.down)) }
        : { kind: 'levers', role, legend: p.legend, state: p.state };
    case 'maze':
      return role === 'clue'
        ? { kind: 'maze', role, size: p.size, walls: p.walls, exit: p.exit, pos: p.pos }
        : { kind: 'maze', role, size: p.size, pos: p.pos, trail: p.trail };
  }
}

export function toPublicState(room: Room, viewerId: string, now: number): PublicState {
  const seat = Math.max(0, room.players.findIndex((p) => p.id === viewerId)) as 0 | 1;
  const current = game.currentIndex(room);
  return {
    code: room.code,
    you: viewerId,
    serverNow: now,
    players: publicPlayers(room),
    phase: room.phase,
    deadline: null,
    room: room.room,
    mySeat: seat,
    puzzles: room.puzzles.map((p, i) => ({
      kind: p.kind,
      solved: p.solved,
      actorSeat: p.actor,
      card: i === current || p.solved ? cardFor(p, seat) : null,
    })),
    current,
    mistakes: room.mistakes,
    startedAt: room.startedAt,
    flash: room.flash,
    results: room.results,
    readyForNext: room.readyForNext,
  };
}

export function registerEscape(io: Server) {
  return registerGame<Room>(io, {
    ns: '/escape',
    newRoom: game.newRoom,
    onLeave: game.resetToLobby,
    view: toPublicState,
    actions: {
      'game:start': action(EmptySchema, (room: Room, me, _p, ctx) => game.startGame(room, me, ctx)),
      'puzzle:act': action(ActSchema, (room: Room, me, p, ctx) => ({ result: game.act(room, me, p, ctx) })),
      'round:ready': action(EmptySchema, (room: Room, me, _p, ctx) => game.readyForNext(room, me, ctx)),
      'game:rematch': action(EmptySchema, (room: Room, me) => game.toLobby(room, me)),
    },
  });
}

