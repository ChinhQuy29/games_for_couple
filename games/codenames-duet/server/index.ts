import type { Server } from 'socket.io';
import { action, publicPlayers, registerGame } from '@gfc/kit/server';
import { EmptySchema } from '@gfc/kit/shared';
import { ClueSchema, GuessSchema, SettingsSchema, type PublicState, type Room } from '../shared';
import * as game from './game';

/** You only ever see your own key; your partner's is revealed when the game is over. */
export function toPublicState(room: Room, viewerId: string, now: number): PublicState {
  const seat = Math.max(0, room.players.findIndex((p) => p.id === viewerId)) as 0 | 1;
  const other = (1 - seat) as 0 | 1;
  const over = room.phase === 'OVER';
  return {
    code: room.code,
    you: viewerId,
    serverNow: now,
    players: publicPlayers(room),
    phase: room.phase,
    deadline: null,
    lang: room.lang,
    turns: room.turns,
    mySeat: seat,
    cards: room.words.map((word, i) => ({
      word,
      mine: room.keys[seat][i]!,
      found: room.found[i]!,
      bystanderMine: room.bystanderFor[seat][i]!,
      bystanderTheirs: room.bystanderFor[other][i]!,
      theirs: over ? room.keys[other][i]! : null,
    })),
    giver: room.giver,
    clue: room.clue,
    turnsLeft: room.turnsLeft,
    agentsLeft: room.words.length ? game.agentsLeft(room) : 15,
    myAgentsLeft: room.words.length ? game.agentsLeftFor(room, seat) : 9,
    theirAgentsLeft: room.words.length ? game.agentsLeftFor(room, other) : 9,
    log: room.log,
    outcome: room.outcome,
    record: room.record,
    readyForNext: room.readyForNext,
  };
}

export function registerDuet(io: Server) {
  return registerGame<Room>(io, {
    ns: '/duet',
    newRoom: game.newRoom,
    onLeave: game.resetToLobby,
    view: toPublicState,
    actions: {
      'settings:update': action(SettingsSchema, (room: Room, me, p) => game.updateSettings(room, me, p)),
      'game:start': action(EmptySchema, (room: Room, me, _p, ctx) => game.startGame(room, me, ctx)),
      'clue': action(ClueSchema, (room: Room, me, p) => game.giveClue(room, me, p.word, p.count)),
      'guess': action(GuessSchema, (room: Room, me, p) => ({ mark: game.guess(room, me, p.card) })),
      'stop': action(EmptySchema, (room: Room, me) => game.stop(room, me)),
      'round:ready': action(EmptySchema, (room: Room, me, _p, ctx) => game.playAgain(room, me, ctx)),
      'game:rematch': action(EmptySchema, (room: Room, me) => game.toLobby(room, me)),
    },
  });
}
