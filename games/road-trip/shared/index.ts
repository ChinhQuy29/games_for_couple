import { z } from 'zod';
import type { BaseRoom, PublicBase } from '@gfc/kit/shared';

// A top-down road. Distance `d` runs along the route; `x` is sideways. The road winds
// (its centre moves with d) and sometimes forks: only the co-pilot's map says which way.

export const HZ = 30;
export const COUNTDOWN_MS = 3000;
export const ROAD_HALF = 3.2;
export const VAN = { halfW: 0.75, halfL: 1.2 } as const;
export const DRIVE = {
  maxSpeed: 12,
  mudSpeed: 5,
  offroadSpeed: 6,
  accel: 6,
  brake: 14,
  coast: 1.5,
  steer: 5,
  /** Fuel used per unit of distance. */
  fuelPerUnit: 0.15,
  fuelCan: 40,
  offroadDamagePerS: 4,
  wrongTurnStallS: 4,
  wrongTurnBackUp: 40,
} as const;

/** How the land beside the road looks. */
export type Scene = 'coast' | 'mountain' | 'night' | 'rice' | 'desert' | 'snow';

export const TRIPS = [
  { name: 'To the beach', emoji: '🏖️', scene: 'coast', length: 900, curve: 0.6, junctions: 3, cows: 6, potholes: 5, rocks: 0, mud: 3, night: false, par: 95 },
  { name: 'Mountain pass', emoji: '⛰️', scene: 'mountain', length: 1100, curve: 1.1, junctions: 4, cows: 4, potholes: 6, rocks: 6, mud: 4, night: false, par: 115 },
  { name: 'Night drive', emoji: '🌙', scene: 'night', length: 1200, curve: 0.8, junctions: 5, cows: 7, potholes: 6, rocks: 3, mud: 3, night: true, par: 130 },
  { name: 'Rice fields', emoji: '🌾', scene: 'rice', length: 1000, curve: 0.9, junctions: 4, cows: 11, potholes: 4, rocks: 0, mud: 6, night: false, par: 115 },
  { name: 'Desert highway', emoji: '🏜️', scene: 'desert', length: 1300, curve: 0.4, junctions: 3, cows: 2, potholes: 9, rocks: 8, mud: 0, night: false, par: 130 },
  { name: 'Snowy village', emoji: '❄️', scene: 'snow', length: 1000, curve: 1.0, junctions: 5, cows: 3, potholes: 3, rocks: 4, mud: 7, night: false, par: 125 },
] as const satisfies readonly { name: string; emoji: string; scene: Scene; length: number; curve: number; junctions: number; cows: number; potholes: number; rocks: number; mud: number; night: boolean; par: number }[];

export const TOWNS = ['Pine Hill', 'Lake Town', 'Sunny Bay', 'Old Mill', 'Cloud Peak', 'Fox Hollow', 'Rose Valley', 'Mango Bay', 'Echo Ridge', 'Lantern Bay', 'Cat Island', 'Honey Farm'];

export type ObstacleKind = 'cow' | 'pothole' | 'rock' | 'mud' | 'fuel';

export interface Obstacle {
  id: number;
  kind: ObstacleKind;
  d: number;
  x: number;
  /** Cows wander across the road. */
  vx: number;
  hit: boolean;
}

export interface Junction {
  d: number;
  correct: 'left' | 'right';
  /** Sign names: [left branch, right branch]. */
  names: [string, string];
  passed: boolean;
}

/** The road's centre at distance d, from a few seeded sine waves. */
export interface Curve {
  waves: [amp: number, freq: number, phase: number][];
}

export interface TripResult {
  trip: number;
  outcome: 'arrived' | 'broke-down' | 'out-of-gas';
  ms: number;
  hp: number;
  wrongTurns: number;
  driverId: string;
}

export interface Room extends BaseRoom {
  phase: 'LOBBY' | 'DRIVE' | 'ARRIVED' | 'FINISH';
  /** The host's pick: the drive starts here and goes on to the last trip. */
  startTrip: number;
  trip: number;
  driverId: string | null;
  held: Record<string, { left: boolean; right: boolean; gas: boolean; brake: boolean }>;
  van: { d: number; x: number; speed: number; hp: number; fuel: number };
  curve: Curve;
  obstacles: Obstacle[];
  junctions: Junction[];
  /** The towns to follow at each fork, in order (the co-pilot's map). */
  route: string[];
  stalledUntil: number;
  wrongTurns: number;
  steps: number;
  startsAt: number;
  feed: { id: number; text: string; good: boolean }[];
  nextId: number;
  results: TripResult[];
  readyForNext: string[];
}

export interface Frame {
  t: number;
  d: number;
  x: number;
  speed: number;
  hp: number;
  fuel: number;
  stalled: number;
  /** Cows near the van: id, x. */
  cows: [number, number][];
}

export interface PublicState extends PublicBase {
  phase: Room['phase'];
  startTrip: number;
  trip: number;
  driverId: string | null;
  myRole: 'driver' | 'copilot' | null;
  curve: Curve;
  obstacles: Obstacle[];
  junctions: { d: number; names: [string, string]; passed: boolean }[];
  /** Only the co-pilot gets the route. */
  route: string[] | null;
  wrongTurns: number;
  startsAt: number;
  feed: Room['feed'];
  results: TripResult[];
  readyForNext: string[];
  frame: Frame | null;
}

export const SettingsSchema = z.object({ startTrip: z.number().int().min(0).max(TRIPS.length - 1) });
export const HeldSchema = z.object({ left: z.boolean(), right: z.boolean(), gas: z.boolean(), brake: z.boolean() });

export function roadCenter(curve: Curve, d: number): number {
  return curve.waves.reduce((x, [a, f, p]) => x + a * Math.sin(d * f + p), 0);
}

/** How far the two branches of a fork are from the road's centre (0 when there's no fork). */
export function forkSpread(junctions: Pick<Junction, 'd'>[], d: number): number {
  for (const j of junctions) {
    if (d >= j.d - 45 && d < j.d - 15) return ((d - (j.d - 45)) / 30) * 5;
    if (d >= j.d - 15 && d < j.d) return 5;
    if (d >= j.d && d < j.d + 30) return (1 - (d - j.d) / 30) * 5;
  }
  return 0;
}

/** Is x on the road at distance d (either branch during a fork)? */
export function onRoad(curve: Curve, junctions: Pick<Junction, 'd'>[], d: number, x: number): boolean {
  const c = roadCenter(curve, d);
  const s = forkSpread(junctions, d);
  if (s < 0.5) return Math.abs(x - c) <= ROAD_HALF;
  return Math.abs(x - (c - s)) <= ROAD_HALF || Math.abs(x - (c + s)) <= ROAD_HALF;
}
