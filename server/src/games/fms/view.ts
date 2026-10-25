// Builds what ONE player is allowed to see. Hidden information (partner's
// starter in peek/blind, unrevealed endings, tokens) must never leave here.

import type { PublicRoomState, PublicSentence, Room, Sentence } from '@gfc/shared';
import { currentSentences, peekText, wordCount } from './game';

function toPublicSentence(s: Sentence, viewerId: string, phase: Room['phase']): PublicSentence {
  const { ratings, starter, ending, ...rest } = s;
  const total = Object.values(ratings).reduce<number>((a, b) => a + b, 0);
  const base = {
    ...rest,
    myRating: ratings[viewerId] ?? null,
    ratingTotal: phase === 'RECAP' ? total : null,
  };
  if (s.revealed) return { ...base, starter, ending };
  return { ...base, starter: null, ending: null, modifier: null, modifierPassed: null };
}

export function toPublicState(room: Room, viewerId: string, now: number): PublicRoomState {
  const partner = room.players.find((p) => p.id !== viewerId);
  const current = currentSentences(room);

  // Current round's sentences only become visible (as redacted cards) once REVEAL starts.
  const visible = room.sentences.filter(
    (s) => s.round < room.round || room.phase === 'REVEAL' || room.phase === 'RECAP',
  );

  let myStarter: PublicRoomState['myStarter'] = null;
  let partnerSubmitted = false;
  let myTask: PublicRoomState['myTask'] = null;

  if (room.phase === 'START') {
    const mine = room.pending[viewerId];
    if (mine) {
      myStarter = { submitted: mine.text !== null, text: mine.text, rerollsLeft: mine.rerollsLeft, dealt: mine.dealt };
    }
    partnerSubmitted = !!partner && room.pending[partner.id]?.text != null;
  }

  if (room.phase === 'FINISH') {
    const task = current.find((s) => s.finisherId === viewerId);
    if (task) {
      const starterVisible =
        room.settings.mode === 'classic' ? task.starter : room.settings.mode === 'peek' ? peekText(task.starter) : '';
      myTask = {
        sentenceId: task.id,
        starterVisible,
        wordCount: wordCount(task.starter),
        modifier: task.modifier,
        submitted: task.ending !== null,
      };
    }
    partnerSubmitted = !!partner && current.some((s) => s.finisherId === partner.id && s.ending !== null);
  }

  return {
    code: room.code,
    you: viewerId,
    serverNow: now,
    players: room.players.map(({ token: _token, ...p }) => p),
    settings: room.settings,
    phase: room.phase,
    round: room.round,
    deadline: room.deadline,
    sentences: visible.map((s) => toPublicSentence(s, viewerId, room.phase)),
    myStarter,
    partnerSubmitted,
    myTask,
    readyForNext: room.readyForNext,
    revealIndex: room.revealIndex,
  };
}
