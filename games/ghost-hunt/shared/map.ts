// The houses: one floor each on the same tile grid, generated from room rectangles so
// they're easy to edit. '#' wall, '.' floor, 'd' doorway, 'c' closet (hide here), 'E' the front door.

export const W = 30;
export const H = 18;

export type RoomId = string;

export interface RoomDef {
  id: RoomId;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface HouseSpec {
  name: string;
  emoji: string;
  blurb: string;
  rooms: RoomDef[];
  doors: [number, number][];
  closets: [number, number][];
  /** The front door, on the outer wall. */
  exit: [number, number];
  /** Where the explorer starts: the floor tile inside the front door. */
  start: [number, number];
  /** Rooms the ghost can call home. */
  ghostRooms: RoomId[];
}

export interface House extends HouseSpec {
  id: number;
  /** The whole map as one W×H string. */
  map: string;
}

const room = (id: RoomId, name: string, x: number, y: number, w: number, h: number): RoomDef => ({ id, name, x, y, w, h });

const SPECS: HouseSpec[] = [
  {
    name: 'The old house',
    emoji: '🏚️',
    blurb: 'A family home with a nursery nobody uses any more',
    rooms: [
      room('nursery', 'Nursery', 1, 1, 7, 6),
      room('bedroom', 'Bedroom', 9, 1, 9, 6),
      room('bathroom', 'Bathroom', 19, 1, 5, 6),
      room('study', 'Study', 25, 1, 4, 6),
      room('hallway', 'Hallway', 1, 8, 28, 2),
      room('kitchen', 'Kitchen', 1, 11, 8, 6),
      room('dining', 'Dining room', 10, 11, 8, 6),
      room('living', 'Living room', 19, 11, 10, 6),
    ],
    doors: [
      [4, 7], [13, 7], [21, 7], [26, 7], // top rooms → hallway
      [5, 10], [14, 10], [23, 10], // bottom rooms → hallway
      [9, 13], [18, 14], [18, 3], // side doors, so there are loops to run around
    ],
    closets: [[1, 1], [17, 1], [28, 1], [1, 16], [28, 16], [10, 16]],
    exit: [23, 17],
    start: [23, 16],
    ghostRooms: ['nursery', 'bedroom', 'bathroom', 'study', 'kitchen', 'dining'],
  },
  {
    name: 'The school',
    emoji: '🏫',
    blurb: 'Long hallway, big gym, and a principal who never left',
    rooms: [
      room('classA', 'Classroom 1A', 1, 1, 8, 7),
      room('classB', 'Classroom 2B', 10, 1, 8, 7),
      room('library', 'Library', 19, 1, 10, 7),
      room('hallway', 'Hallway', 1, 9, 28, 2),
      room('gym', 'Gym', 1, 12, 12, 5),
      room('cafeteria', 'Cafeteria', 14, 12, 7, 5),
      room('office', "Principal's office", 22, 12, 7, 5),
    ],
    doors: [
      [4, 8], [13, 8], [23, 8], // classrooms and library → hallway
      [6, 11], [17, 11], [25, 11], // gym, cafeteria, office → hallway
      [9, 4], [18, 5], [13, 14], [21, 14], // side doors
    ],
    closets: [[1, 1], [17, 1], [28, 1], [1, 16], [20, 16], [28, 16]],
    exit: [0, 9],
    start: [1, 9],
    ghostRooms: ['classA', 'classB', 'library', 'gym', 'cafeteria', 'office'],
  },
  {
    name: 'The hospital',
    emoji: '🏥',
    blurb: 'Two wards, a morgue, and the lights hum',
    rooms: [
      room('ward1', 'Ward 1', 1, 1, 6, 6),
      room('ward2', 'Ward 2', 8, 1, 6, 6),
      room('surgery', 'Surgery', 15, 1, 7, 6),
      room('morgue', 'Morgue', 23, 1, 6, 6),
      room('corridor', 'Corridor', 1, 8, 28, 2),
      room('reception', 'Reception', 1, 11, 9, 6),
      room('pharmacy', 'Pharmacy', 11, 11, 6, 6),
      room('xray', 'X-ray', 18, 11, 5, 6),
      room('chapel', 'Chapel', 24, 11, 5, 6),
    ],
    doors: [
      [3, 7], [11, 7], [18, 7], [25, 7], // top rooms → corridor
      [5, 10], [14, 10], [20, 10], [26, 10], // bottom rooms → corridor
      [7, 3], [22, 4], [10, 14], [23, 13], // side doors
    ],
    closets: [[1, 1], [13, 1], [28, 6], [16, 16], [28, 16], [9, 11]],
    exit: [3, 17],
    start: [3, 16],
    ghostRooms: ['ward1', 'ward2', 'surgery', 'morgue', 'pharmacy', 'xray', 'chapel'],
  },
  {
    name: 'The lake cabin',
    emoji: '🌲',
    blurb: 'A hallway down the middle, a sauna and a creaky boathouse',
    rooms: [
      room('bunks', 'Bunk room', 1, 1, 12, 5),
      room('kitchen', 'Kitchen', 1, 7, 12, 4),
      room('cellar', 'Cellar', 1, 12, 12, 5),
      room('hallway', 'Hallway', 14, 1, 2, 16),
      room('sauna', 'Sauna', 17, 1, 5, 6),
      room('boathouse', 'Boathouse', 23, 1, 6, 6),
      room('lounge', 'Lounge', 17, 8, 12, 4),
      room('workshop', 'Workshop', 17, 13, 12, 4),
    ],
    doors: [
      [13, 3], [13, 8], [13, 14], // left rooms → hallway
      [16, 3], [16, 9], [16, 15], // right rooms → hallway
      [6, 6], [6, 11], [22, 3], [25, 7], [20, 12], // side doors
    ],
    closets: [[1, 1], [1, 16], [21, 1], [28, 1], [28, 16], [12, 10]],
    exit: [14, 17],
    start: [14, 16],
    ghostRooms: ['bunks', 'kitchen', 'cellar', 'sauna', 'boathouse', 'lounge', 'workshop'],
  },
];

export const idx = (x: number, y: number) => y * W + x;
export const xy = (i: number): [number, number] => [i % W, Math.floor(i / W)];

function build(s: HouseSpec): string {
  const t: string[] = Array.from({ length: W * H }, () => '#');
  for (const r of s.rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) t[idx(x, y)] = '.';
  for (const [x, y] of s.doors) t[idx(x, y)] = 'd';
  for (const [x, y] of s.closets) t[idx(x, y)] = 'c';
  t[idx(...s.exit)] = 'E';
  return t.join('');
}

export const HOUSES: House[] = SPECS.map((s, id) => ({ ...s, id, map: build(s) }));
export const HOUSE_IDS = HOUSES.map((h) => h.id);
export const houseOf = (id: number): House => HOUSES[id] ?? HOUSES[0]!;

export const tileAt = (h: House, x: number, y: number): string => (x < 0 || y < 0 || x >= W || y >= H ? '#' : h.map[idx(x, y)]!);
export const walkable = (h: House, x: number, y: number) => tileAt(h, x, y) !== '#';

export function roomAt(h: House, x: number, y: number): RoomId | null {
  return h.rooms.find((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h)?.id ?? null;
}

export const roomById = (h: House, id: RoomId) => h.rooms.find((r) => r.id === id) ?? h.rooms[0]!;

export function roomTiles(h: House, id: RoomId): [number, number][] {
  const r = roomById(h, id);
  const out: [number, number][] = [];
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (walkable(h, x, y)) out.push([x, y]);
  return out;
}

/** Doorways that touch a room. */
export function doorsOf(h: House, id: RoomId): [number, number][] {
  return h.doors.filter(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => roomAt(h, x + dx!, y + dy!) === id));
}

export const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as const;
export type Dir = keyof typeof DIRS;

/** Walls block the line; the end tile itself can be a wall (you see walls). */
export function lineOfSight(h: House, x0: number, y0: number, x1: number, y1: number): boolean {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    if (x === x1 && y === y1) return true;
    if (!(x === x0 && y === y0) && !walkable(h, x, y)) return false;
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
export function visibleFrom(h: House, x: number, y: number, facing: Dir): number[] {
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
      if (lit && lineOfSight(h, x, y, tx, ty)) out.push(idx(tx, ty));
    }
  }
  return out;
}

/** Shortest path (BFS), returning the next step from (x0,y0) toward (x1,y1), or null. */
export function nextStep(h: House, x0: number, y0: number, x1: number, y1: number, blocked?: (x: number, y: number) => boolean): [number, number] | null {
  if (x0 === x1 && y0 === y1) return null;
  const prev = new Int32Array(W * H).fill(-1);
  const start = idx(x0, y0);
  prev[start] = start;
  const q = [start];
  for (let i = 0; i < q.length; i++) {
    const cur = q[i]!;
    const [cx, cy] = xy(cur);
    if (cx === x1 && cy === y1) {
      let c = cur;
      while (prev[c] !== start) c = prev[c]!;
      return xy(c);
    }
    for (const [dx, dy] of Object.values(DIRS)) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!walkable(h, nx, ny) || blocked?.(nx, ny)) continue;
      const n = idx(nx, ny);
      if (prev[n] !== -1) continue;
      prev[n] = cur;
      q.push(n);
    }
  }
  return null;
}
