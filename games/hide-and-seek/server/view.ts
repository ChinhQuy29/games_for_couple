// Builds what ONE player is allowed to see. The fake must be indistinguishable:
// while hiding, the hunter gets no room data at all; while seeking, the fake is
// just another prop in a list sorted by (random) id; only after the round does
// anyone learn which prop it was.

import type { PublicRound, PublicRoomState, Room, Round } from '../shared';
import { allProps, shotsLeft } from './game';

const byId = <T extends { id: string }>(a: T, b: T) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

function toPublicRound(room: Room, round: Round, viewerId: string, live: boolean): PublicRound {
  const isHider = round.hiderId === viewerId;
  const finished = round.result !== null || !live;
  const hiding = live && room.phase === 'HIDE';

  let props: PublicRound['props'];
  if (hiding) props = isHider ? [...round.props].sort(byId) : null;
  else props = allProps(round).sort(byId);

  return {
    n: round.n,
    map: round.map,
    hiderId: round.hiderId,
    hunterId: round.hunterId,
    props,
    choices: hiding && isHider ? round.choices : null,
    myPropId: isHider && !hiding ? round.hiderPropId : null,
    hiderPropId: finished ? round.hiderPropId : null,
    hider: isHider || finished ? { ...round.hider, type: round.hiderType } : null,
    shots: round.shots,
    shotsLeft: shotsLeft(room, round),
    sneaksLeft: round.sneaksLeft,
    result: round.result,
    points: finished ? round.points : null,
  };
}

export function toPublicState(room: Room, viewerId: string, now: number): PublicRoomState {
  const playing = room.phase === 'HIDE' || room.phase === 'SEEK' || room.phase === 'REVEAL';
  const last = room.rounds[room.rounds.length - 1];
  const round = playing && last ? toPublicRound(room, last, viewerId, room.phase !== 'REVEAL') : null;
  const done = room.rounds.filter((r) => r.result !== null && (room.phase === 'RECAP' || r !== last));

  return {
    code: room.code,
    you: viewerId,
    serverNow: now,
    players: room.players.map(({ token: _token, ...p }) => p),
    settings: room.settings,
    phase: room.phase,
    roundIndex: room.rounds.length,
    totalRounds: room.settings.rounds,
    startedAt: room.startedAt,
    deadline: room.deadline,
    round,
    history: done.map((r) => toPublicRound(room, r, viewerId, false)),
    scores: room.scores,
    tauntPropId: room.phase === 'SEEK' && room.taunt ? room.taunt.propId : null,
    readyForNext: room.readyForNext,
  };
}
