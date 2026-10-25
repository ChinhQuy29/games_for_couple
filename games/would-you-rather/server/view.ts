// Builds what ONE player is allowed to see. While answering, your partner's pick
// and prediction are hidden. In a debate both picks show (that's what you're arguing
// about), but predictions and the partner's defense stay hidden until RESULT.

import type { PublicRoomState, PublicTurn, Room, Turn } from '../shared';
import { currentTurn } from './game';

type Hide = { pick: boolean; prediction: boolean; defense: boolean };

function toPublicTurn(turn: Turn, room: Room, viewerId: string, hide: Hide, done: string[]): PublicTurn {
  const { picks, predictions, defenses, ...rest } = turn;
  const out: PublicTurn = { ...rest, picks: {}, predictions: {}, defenses: {}, done };
  for (const p of room.players) {
    const mine = p.id === viewerId;
    out.picks[p.id] = mine || !hide.pick ? (picks[p.id] ?? null) : null;
    out.predictions[p.id] = mine || !hide.prediction ? (predictions[p.id] ?? null) : null;
    out.defenses[p.id] = mine || !hide.defense ? (defenses[p.id] ?? null) : null;
  }
  return out;
}

export function toPublicState(room: Room, viewerId: string, now: number): PublicRoomState {
  const turn = currentTurn(room);
  let current: PublicTurn | null = null;

  if (turn && room.phase !== 'RECAP') {
    if (room.phase === 'ANSWER') {
      const done = room.players.filter((p) => turn.picks[p.id]).map((p) => p.id);
      current = toPublicTurn(turn, room, viewerId, { pick: true, prediction: true, defense: true }, done);
    } else if (room.phase === 'DEBATE') {
      const done = room.players.filter((p) => turn.defenses[p.id] !== undefined).map((p) => p.id);
      current = toPublicTurn(turn, room, viewerId, { pick: false, prediction: true, defense: true }, done);
    } else {
      current = toPublicTurn(turn, room, viewerId, { pick: false, prediction: false, defense: false }, []);
    }
  }

  const finished = room.turns.filter((t) => room.phase === 'RECAP' || t.index < room.index);
  const history = finished.map((t) => toPublicTurn(t, room, viewerId, { pick: false, prediction: false, defense: false }, []));

  return {
    code: room.code,
    you: viewerId,
    serverNow: now,
    players: room.players.map(({ token: _token, ...p }) => p),
    settings: room.settings,
    phase: room.phase,
    index: room.index,
    deadline: room.deadline,
    current,
    history,
    writerId: room.writerId,
    readyForNext: room.readyForNext,
  };
}
