// Builds what ONE player is allowed to see. The whole point of telephone is that
// you only ever see the step right before yours, so this is strict: during play
// a player gets exactly one entry (their task), and chains unlock during REVEAL.

import type { Chain, PublicChain, PublicRoomState, Room } from '../shared';
import { chainFor, stepKind } from './game';

/** Entries of `chain` this viewer may see, or null if the chain is hidden entirely. */
function visibleEntries(room: Room, chain: Chain): Chain['entries'] | null {
  if (room.phase === 'RECAP' || chain.round < room.round) return chain.entries;
  if (room.phase !== 'REVEAL') return null;
  if (chain.owner < room.revealChain) return chain.entries;
  if (chain.owner === room.revealChain) return chain.entries.slice(0, room.revealCount);
  return []; // still to come: listed so the UI can show it's next, but empty
}

export function toPublicState(room: Room, viewerId: string, now: number): PublicRoomState {
  const chains: PublicChain[] = [];
  for (const chain of room.chains) {
    const entries = visibleEntries(room, chain);
    if (entries === null) continue;
    const { chaosByStep: _hidden, ...rest } = chain;
    chains.push({ ...rest, entries, total: chain.entries.length });
  }

  const partner = room.players.find((p) => p.id !== viewerId);
  let myPrompt: PublicRoomState['myPrompt'] = null;
  let myTask: PublicRoomState['myTask'] = null;
  let partnerSubmitted = false;

  if (room.phase === 'PROMPT') {
    const mine = room.pending[viewerId];
    if (mine) myPrompt = { submitted: mine.text !== null, text: mine.text, dealt: mine.dealt, rerollsLeft: mine.rerollsLeft };
    partnerSubmitted = !!partner && room.pending[partner.id]?.text != null;
  }

  if (room.phase === 'STEP') {
    const chain = chainFor(room, viewerId);
    const prev = chain?.entries[room.step];
    if (chain && prev) {
      const kind = stepKind(room.step);
      myTask = {
        kind,
        text: kind === 'drawing' && prev.kind !== 'drawing' ? prev.text : null,
        drawing: kind === 'guess' && prev.kind === 'drawing' ? prev.drawing : null,
        chaos: kind === 'drawing' ? (chain.chaosByStep[room.step] ?? null) : null,
        submitted: chain.entries.length > room.step + 1,
      };
    }
    const theirs = partner ? chainFor(room, partner.id) : undefined;
    partnerSubmitted = !!theirs && theirs.entries.length > room.step + 1;
  }

  return {
    code: room.code,
    you: viewerId,
    serverNow: now,
    players: room.players.map(({ token: _token, ...p }) => p),
    settings: room.settings,
    phase: room.phase,
    round: room.round,
    step: room.step,
    deadline: room.deadline,
    chains,
    myPrompt,
    myTask,
    partnerSubmitted,
    revealChain: room.revealChain,
    revealCount: room.phase === 'REVEAL' ? room.revealCount : 0,
    readyForNext: room.readyForNext,
  };
}
