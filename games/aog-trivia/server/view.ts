// Builds what ONE player is allowed to see. While a question is open: no correct
// answer, no explanation, only the clues that have appeared so far, and only your
// own answer (your partner's shows as "done" until the reveal).

import { clueTimes, type PublicQuestion, type PublicRoomState, type PublicTurn, type Room, type Turn } from '../shared';
import { optionsOf, questionById, timeLimit } from './game';
import { QUESTIONS } from './content/questions';

function toPublicTurn(room: Room, turn: Turn, viewerId: string, open: boolean, now: number): PublicTurn {
  const q = questionById(turn.questionId);
  const options = optionsOf(q);
  const limit = timeLimit(q, room.settings);
  const clueAt = clueTimes(q.clues?.length ?? 0, limit);
  const elapsedSec = (now - room.startedAt) / 1000;
  const clues = open ? (q.clues ?? []).filter((_, i) => elapsedSec >= clueAt[i]!) : (q.clues ?? []);

  const question: PublicQuestion = {
    id: q.id,
    category: q.category,
    type: q.type,
    difficulty: q.difficulty,
    q: q.q,
    options: turn.order.map((i) => options[i]!),
    clues,
    clueTotal: q.clues?.length ?? 0,
    clueAt,
    correct: open ? null : turn.order.indexOf(q.answer),
    explain: open ? null : q.explain,
    source: open ? null : q.source,
  };

  const answers: PublicTurn['answers'] = {};
  for (const p of room.players) answers[p.id] = open && p.id !== viewerId ? null : (turn.answers[p.id] ?? null);

  return {
    index: turn.index,
    finale: turn.finale,
    question,
    answers,
    done: room.players.filter((p) => turn.answers[p.id]).map((p) => p.id),
    points: open ? null : turn.points,
    flagged: room.flagged.includes(turn.questionId),
  };
}

export function toPublicState(room: Room, viewerId: string, now: number): PublicRoomState {
  const turn = room.turns.find((t) => t.index === room.index);
  const open = room.phase === 'QUESTION';
  const current = turn && room.phase !== 'RECAP' ? toPublicTurn(room, turn, viewerId, open, now) : null;
  const history = room.turns
    .filter((t) => room.phase === 'RECAP' || t.index < room.index)
    .map((t) => toPublicTurn(room, t, viewerId, false, now));

  return {
    code: room.code,
    you: viewerId,
    serverNow: now,
    players: room.players.map(({ token: _token, ...p }) => p),
    settings: room.settings,
    phase: room.phase,
    index: room.index,
    total: room.plan.length,
    startedAt: room.startedAt,
    deadline: room.deadline,
    current,
    history,
    scores: room.scores,
    streaks: room.streaks,
    readyForNext: room.readyForNext,
    deckSize: QUESTIONS.length,
  };
}
