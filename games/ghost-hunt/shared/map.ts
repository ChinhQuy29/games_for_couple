// The house: one floor on a tile grid, generated from room rectangles so it's easy to edit.
// '#' wall, '.' floor, 'd' doorway, 'c' closet (hide here), 'E' the front door.

export const W = 30;
export const H = 18;

export interface RoomDef {
  id: RoomId;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type RoomId = 'nursery' | 'bedroom' | 'bathroom' | 'study' | 'hallway' | 'kitchen' | 'dining' | 'living';

export const ROOMS: RoomDef[] = [
  { id: 'nursery', name: 'Nursery', x: 1, y: 1, w: 7, h: 6 },
  { id: 'bedroom', name: 'Bedroom', x: 9, y: 1, w: 9, h: 6 },
  { id: 'bathroom', name: 'Bathroom', x: 19, y: 1, w: 5, h: 6 },
  { id: 'study', name: 'Study', x: 25, y: 1, w: 4, h: 6 },
  { id: 'hallway', name: 'Hallway', x: 1, y: 8, w: 28, h: 2 },
  { id: 'kitchen', name: 'Kitchen', x: 1, y: 11, w: 8, h: 6 },
  { id: 'dining', name: 'Dining room', x: 10, y: 11, w: 8, h: 6 },
  { id: 'living', name: 'Living room', x: 19, y: 11, w: 10, h: 6 },
];

const DOORS: [number, number][] = [
  [4, 7], [13, 7], [21, 7], [26, 7], // top rooms → hallway
  [5, 10], [14, 10], [23, 10], // bottom rooms → hallway
  [9, 13], [18, 14], [18, 3], // side doors, so there are loops to run around
];
const CLOSETS: [number, number][] = [
  [1, 1], [17, 1], [28, 1], [1, 16], [28, 16], [10, 16],
];
export const EXIT: [number, number] = [23, 17];
export const START: [number, number] = [23, 16];

export const idx = (x: number, y: number) => y * W + x;
export const xy = (i: number): [number, number] => [i % W, Math.floor(i / W)];

function build(): string {
  const t: string[] = Array.from({ length: W * H }, () => '#');
  for (const r of ROOMS) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) t[idx(x, y)] = '.';
  for (const [x, y] of DOORS) t[idx(x, y)] = 'd';
  for (const [x, y] of CLOSETS) t[idx(x, y)] = 'c';
  t[idx(...EXIT)] = 'E';
  return t.join('');
}

/** The whole map as one W×H string. */
export const MAP = build();

export const tileAt = (x: number, y: number): string => (x < 0 || y < 0 || x >= W || y >= H ? '#' : MAP[idx(x, y)]!);
export const walkable = (x: number, y: number) => tileAt(x, y) !== '#';

export function roomAt(x: number, y: number): RoomId | null {
  return ROOMS.find((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h)?.id ?? null;
}

export const roomById = (id: RoomId) => ROOMS.find((r) => r.id === id)!;

export function roomTiles(id: RoomId): [number, number][] {
  const r = roomById(id);
  const out: [number, number][] = [];
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (walkable(x, y)) out.push([x, y]);
  return out;
}

/** Doorways that touch a room. */
export function doorsOf(id: RoomId): [number, number][] {
  return DOORS.filter(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => roomAt(x + dx!, y + dy!) === id));
}

export const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as const;
export type Dir = keyof typeof DIRS;

/** Walls block the line; the end tile itself can be a wall (you see walls). */
export function lineOfSight(x0: number, y0: number, x1: number, y1: number): boolean {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    if (x === x1 && y === y1) return true;
    if (!(x === x0 && y === y0) && !walkable(x, y)) return false;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

export const FLASHLIGHT = { range: 7, halfAngle: (40 * Math.PI) / 180, ambient: 1 } as const;

/** Tiles the explorer can see: a small glow around them plus the flashlight cone. */
export function visibleFrom(x: number, y: number, facing: Dir): number[] {
  const out: number[] = [];
  const [fx, fy] = DIRS[facing];
  const R = FLASHLIGHT.range;
  for (let ty = Math.max(0, y - R); ty <= Math.min(H - 1, y + R); ty++) {
    for (let tx = Math.max(0, x - R); tx <= Math.min(W - 1, x + R); tx++) {
      const dx = tx - x;
      const dy = ty - y;
      const near = Math.max(Math.abs(dx), Math.abs(dy)) <= FLASHLIGHT.ambient;
      let lit = near;
      if (!lit) {
        const d = Math.hypot(dx, dy);
        if (d <= R) {
          const cos = (dx * fx + dy * fy) / d;
          lit = cos >= Math.cos(FLASHLIGHT.halfAngle);
        }
      }
      if (lit && lineOfSight(x, y, tx, ty)) out.push(idx(tx, ty));
    }
  }
  return out;
}

/** Shortest path (BFS), returning the next step from (x0,y0) toward (x1,y1), or null. */
export function nextStep(x0: number, y0: number, x1: number, y1: number, blocked?: (x: number, y: number) => boolean): [number, number] | null {
  if (x0 === x1 && y0 === y1) return null;
  const prev = new Int32Array(W * H).fill(-1);
  const start = idx(x0, y0);
  prev[start] = start;
  const q = [start];
  for (let h = 0; h < q.length; h++) {
    const cur = q[h]!;
    const [cx, cy] = xy(cur);
    if (cx === x1 && cy === y1) {
      let c = cur;
      while (prev[c] !== start) c = prev[c]!;
      return xy(c);
    }
    for (const [dx, dy] of Object.values(DIRS)) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!walkable(nx, ny) || blocked?.(nx, ny)) continue;
      const n = idx(nx, ny);
      if (prev[n] !== -1) continue;
      prev[n] = cur;
      q.push(n);
    }
  }
  return null;
}
