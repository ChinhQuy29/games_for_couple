// Tiny platformer physics in tile units: axis-separated AABB vs. tiles, one-way
// platforms, moving platforms, grabbing, and a distance constraint (the chain).
// Pure and deterministic: the server steps it at 30 Hz with a fixed dt.

export const PHYS = {
  dt: 1 / 30,
  gravity: 40,
  runSpeed: 7,
  accel: 60,
  airAccel: 35,
  jump: 17,
  maxFall: 22,
  w: 0.7,
  h: 0.9,
  /** Press jump this long before landing and it still counts. */
  jumpBufferS: 0.12,
  /** Walk off a ledge and you can still jump for this long. */
  coyoteS: 0.1,
  staminaMax: 100,
  grabDrain: 25,
  grabJumpCost: 15,
  staminaRegen: 30,
} as const;

export interface Input {
  left: boolean;
  right: boolean;
  jump: boolean;
  grab: boolean;
}
export const NO_INPUT: Input = { left: false, right: false, jump: false, grab: false };

export interface Body {
  /** Top-left corner, in tiles. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  /** Index of the moving platform we stand on, or -1. */
  riding: number;
  grabbing: boolean;
  stamina: number;
  facing: 1 | -1;
  /** Seconds since we last stood on something (for coyote time). */
  airTime: number;
  /** Seconds since jump was pressed (Infinity = not pending). */
  jumpQueued: number;
  lastJumpHeld: boolean;
}

export function newBody(x: number, y: number): Body {
  return { x, y, vx: 0, vy: 0, onGround: false, riding: -1, grabbing: false, stamina: PHYS.staminaMax, facing: 1, airTime: 0, jumpQueued: Infinity, lastJumpHeld: false };
}

export interface Platform {
  x: number;
  y: number;
  w: number;
}

/** What the world looks like to the physics. */
export interface World {
  solid: (tx: number, ty: number) => boolean;
  oneWay: (tx: number, ty: number) => boolean;
  platforms: Platform[];
}

const EPS = 1e-4;

/** Moves a body by (dx, dy), stopping at walls, floors and ceilings. */
export function moveBody(b: Body, dx: number, dy: number, world: World): { hitX: boolean; hitY: boolean } {
  let hitX = false;
  let hitY = false;
  if (dx !== 0) {
    b.x += dx;
    const top = Math.floor(b.y + EPS);
    const bottom = Math.floor(b.y + PHYS.h - EPS);
    if (dx > 0) {
      const col = Math.floor(b.x + PHYS.w - EPS);
      for (let ty = top; ty <= bottom; ty++)
        if (world.solid(col, ty)) {
          b.x = col - PHYS.w;
          hitX = true;
          break;
        }
    } else {
      const col = Math.floor(b.x + EPS);
      for (let ty = top; ty <= bottom; ty++)
        if (world.solid(col, ty)) {
          b.x = col + 1;
          hitX = true;
          break;
        }
    }
  }
  if (dy !== 0) {
    const prevBottom = b.y + PHYS.h;
    b.y += dy;
    const left = Math.floor(b.x + EPS);
    const right = Math.floor(b.x + PHYS.w - EPS);
    if (dy > 0) {
      const row = Math.floor(b.y + PHYS.h - EPS);
      for (let tx = left; tx <= right; tx++) {
        if (world.solid(tx, row) || (world.oneWay(tx, row) && prevBottom <= row + EPS)) {
          b.y = row - PHYS.h;
          hitY = true;
          b.onGround = true;
          break;
        }
      }
      if (!hitY) {
        world.platforms.forEach((p, i) => {
          if (hitY) return;
          if (b.x + PHYS.w > p.x && b.x < p.x + p.w && prevBottom <= p.y + EPS && b.y + PHYS.h >= p.y) {
            b.y = p.y - PHYS.h;
            hitY = true;
            b.onGround = true;
            b.riding = i;
          }
        });
      }
    } else {
      const row = Math.floor(b.y + EPS);
      for (let tx = left; tx <= right; tx++)
        if (world.solid(tx, row)) {
          b.y = row + 1;
          hitY = true;
          break;
        }
    }
  }
  return { hitX, hitY };
}

/** True if a solid tile is right next to the body's side (for grabbing walls). */
export function touchingWall(b: Body, world: World): boolean {
  const top = Math.floor(b.y + EPS);
  const bottom = Math.floor(b.y + PHYS.h - EPS);
  const l = Math.floor(b.x - 0.05);
  const r = Math.floor(b.x + PHYS.w + 0.05);
  for (let ty = top; ty <= bottom; ty++) if (world.solid(l, ty) || world.solid(r, ty)) return true;
  return false;
}

/** True if standing on something (checked fresh, not from last frame). */
export function standing(b: Body, world: World): boolean {
  const row = Math.floor(b.y + PHYS.h + 0.02);
  if (Math.abs(b.y + PHYS.h - row) > 0.03) {
    return world.platforms.some((p) => b.x + PHYS.w > p.x && b.x < p.x + p.w && Math.abs(b.y + PHYS.h - p.y) < 0.03);
  }
  const left = Math.floor(b.x + EPS);
  const right = Math.floor(b.x + PHYS.w - EPS);
  for (let tx = left; tx <= right; tx++) if (world.solid(tx, row) || world.oneWay(tx, row)) return true;
  return world.platforms.some((p) => b.x + PHYS.w > p.x && b.x < p.x + p.w && Math.abs(b.y + PHYS.h - p.y) < 0.03);
}

/** One step of one body: input, grabbing, gravity, movement. */
export function stepBody(b: Body, input: Input, world: World): void {
  const dt = PHYS.dt;
  // Jump is edge-triggered and buffered.
  if (input.jump && !b.lastJumpHeld) b.jumpQueued = 0;
  else b.jumpQueued += dt;
  b.lastJumpHeld = input.jump;

  const grounded = standing(b, world);
  if (grounded) b.airTime = 0;
  else b.airTime += dt;

  // Grabbing: hold on to the floor or a wall, at the cost of stamina.
  const canGrab = (grounded || touchingWall(b, world)) && b.stamina > 0;
  b.grabbing = input.grab && canGrab;
  if (b.grabbing && b.jumpQueued <= PHYS.jumpBufferS) {
    // Jumping lets go. Off a wall it's a climb, and it costs stamina.
    b.grabbing = false;
    if (!grounded && b.stamina >= PHYS.grabJumpCost) {
      b.stamina -= PHYS.grabJumpCost;
      b.vy = -PHYS.jump;
      b.jumpQueued = Infinity;
    }
  }
  if (b.grabbing) {
    b.vx = 0;
    b.vy = 0;
    b.stamina = Math.max(0, b.stamina - PHYS.grabDrain * dt);
    b.onGround = grounded;
    return;
  } else if (grounded) {
    b.stamina = Math.min(PHYS.staminaMax, b.stamina + PHYS.staminaRegen * dt);
  }

  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (dir !== 0) b.facing = dir as 1 | -1;
  const target = dir * PHYS.runSpeed;
  const a = (grounded ? PHYS.accel : PHYS.airAccel) * dt;
  b.vx = b.vx < target ? Math.min(target, b.vx + a) : Math.max(target, b.vx - a);

  if (b.jumpQueued <= PHYS.jumpBufferS && (grounded || b.airTime <= PHYS.coyoteS)) {
    b.vy = -PHYS.jump;
    b.jumpQueued = Infinity;
    b.airTime = PHYS.coyoteS + 1;
  }
  // Let go of jump early for a shorter hop.
  if (!input.jump && b.vy < -PHYS.jump * 0.45) b.vy = -PHYS.jump * 0.45;

  b.vy = Math.min(PHYS.maxFall, b.vy + PHYS.gravity * dt);
  b.onGround = false;
  b.riding = -1;
  const hit = moveBody(b, b.vx * dt, b.vy * dt, world);
  if (hit.hitX) b.vx = 0;
  if (hit.hitY) b.vy = 0;
}

export const center = (b: Body): [number, number] => [b.x + PHYS.w / 2, b.y + PHYS.h / 2];

/**
 * Keeps two bodies within `length` of each other. A grabbing body is an anchor and doesn't move.
 * Corrections go through moveBody, so the chain never pulls anyone through a wall.
 */
export function applyChain(a: Body, b: Body, length: number, world: World): boolean {
  let pulled = false;
  for (let iter = 0; iter < 3; iter++) {
    const [ax, ay] = center(a);
    const [bx, by] = center(b);
    const dx = bx - ax;
    const dy = by - ay;
    const d = Math.hypot(dx, dy);
    if (d <= length || d === 0) break;
    pulled = true;
    const nx = dx / d;
    const ny = dy / d;
    const excess = d - length;
    const wa = a.grabbing ? 0 : b.grabbing ? 1 : 0.5;
    const wb = b.grabbing ? 0 : a.grabbing ? 1 : 0.5;
    if (wa + wb === 0) break; // both anchored: the chain just holds
    moveBody(a, nx * excess * wa, ny * excess * wa, world);
    moveBody(b, -nx * excess * wb, -ny * excess * wb, world);
    // Remove the part of the velocities that stretches the chain.
    const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (rel > 0) {
      a.vx += nx * rel * wa;
      a.vy += ny * rel * wa;
      b.vx -= nx * rel * wb;
      b.vy -= ny * rel * wb;
    }
  }
  return pulled;
}
