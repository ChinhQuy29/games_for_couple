import { VERDICTS } from './constants';
import type { PublicTurn, Turn } from './types';

type AnyTurn = Pick<Turn | PublicTurn, 'picks' | 'predictions' | 'autoPicked'>;

export interface PlayerStats {
  /** How many times they correctly predicted their partner's pick. */
  readsRight: number;
  readsTotal: number;
}

export interface GameStats {
  matches: number;
  total: number;
  matchRate: number;
  verdict: (typeof VERDICTS)[number];
  byPlayer: Record<string, PlayerStats>;
}

/** Match rate and "how well do you know me" scores. Auto-picked answers don't count. */
export function computeStats(turns: AnyTurn[], playerIds: string[]): GameStats {
  const [a, b] = playerIds;
  const byPlayer: Record<string, PlayerStats> = Object.fromEntries(playerIds.map((id) => [id, { readsRight: 0, readsTotal: 0 }]));
  let matches = 0;
  let total = 0;
  for (const t of turns) {
    if (!a || !b) break;
    const pa = t.picks[a];
    const pb = t.picks[b];
    if (!pa || !pb) continue;
    total += 1;
    if (pa === pb) matches += 1;
    for (const [me, partner] of [
      [a, b],
      [b, a],
    ] as const) {
      const guess = t.predictions[me];
      if (!guess || t.autoPicked.includes(me) || t.autoPicked.includes(partner)) continue;
      byPlayer[me]!.readsTotal += 1;
      if (guess === t.picks[partner]) byPlayer[me]!.readsRight += 1;
    }
  }
  const matchRate = total ? matches / total : 0;
  const verdict = [...VERDICTS].reverse().find((v) => matchRate >= v.min) ?? VERDICTS[0];
  return { matches, total, matchRate, verdict, byPlayer };
}
