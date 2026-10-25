import { CREATURE, CREATURE_SCALE, SCENE, TEX, buildScene, type Placement, type Shape } from '../shared';

// Drawing helpers shared by the hide, seek and reveal screens.

export function drawShape(ctx: CanvasRenderingContext2D, s: Shape) {
  ctx.save();
  ctx.fillStyle = s.color;
  switch (s.t) {
    case 'rect':
      ctx.translate(s.x + s.w / 2, s.y + s.h / 2);
      ctx.rotate((s.rot * Math.PI) / 180);
      ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
      break;
    case 'blob':
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.rx, s.ry, (s.rot * Math.PI) / 180, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'leaf':
      ctx.translate(s.x, s.y);
      ctx.rotate((s.rot * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(s.len / 2, -s.len / 3, s.len, 0);
      ctx.quadraticCurveTo(s.len / 2, s.len / 3, 0, 0);
      ctx.fill();
      break;
    case 'flower':
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.arc(s.x + Math.cos(a) * s.r, s.y + Math.sin(a) * s.r, s.r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = s.center;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 0.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'dot':
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  ctx.restore();
}

const sceneCache = new Map<number, HTMLCanvasElement>();

/** The background for a seed, drawn once at scene resolution (also used for the eyedropper). */
export function sceneCanvas(seed: number): HTMLCanvasElement {
  const hit = sceneCache.get(seed);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = SCENE.w;
  c.height = SCENE.h;
  const ctx = c.getContext('2d')!;
  const { bg, shapes } = buildScene(seed, SCENE.w, SCENE.h);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SCENE.w, SCENE.h);
  for (const s of shapes) drawShape(ctx, s);
  sceneCache.clear();
  sceneCache.set(seed, c);
  return c;
}

/** The creature outline in its own coordinates, shifted by (ox, oy). */
export function creaturePath(ox = 0, oy = 0): Path2D {
  const p = new Path2D();
  for (const e of CREATURE) {
    p.moveTo(e.cx + ox + e.rx, e.cy + oy);
    p.ellipse(e.cx + ox, e.cy + oy, e.rx, e.ry, 0, 0, Math.PI * 2);
  }
  return p;
}

/** Puts the creature's local coordinates on the scene. */
export function applyPlacement(ctx: CanvasRenderingContext2D, p: Placement) {
  ctx.translate(p.x, p.y);
  ctx.rotate((p.rot * Math.PI) / 180);
  ctx.scale(CREATURE_SCALE * (p.flip ? -1 : 1), CREATURE_SCALE);
}

/** Draws the painted creature (texture clipped to its outline). */
export function drawCreature(ctx: CanvasRenderingContext2D, p: Placement, tex: CanvasImageSource | null, outline: string | null = null) {
  ctx.save();
  applyPlacement(ctx, p);
  const path = creaturePath();
  ctx.save();
  ctx.clip(path);
  if (tex) ctx.drawImage(tex, -TEX.ox, -TEX.oy, TEX.w, TEX.h);
  else {
    ctx.fillStyle = '#3ddc97';
    ctx.fill(path);
  }
  ctx.restore();
  if (outline) {
    ctx.strokeStyle = outline;
    ctx.lineWidth = 3 / CREATURE_SCALE;
    ctx.setLineDash([8, 6]);
    ctx.stroke(path);
  }
  ctx.restore();
}

/** Loads a data-URL image (the hider's paint job). */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export const SCENE_STYLE = { width: `min(100%, calc((100dvh - 230px) * ${SCENE.w / SCENE.h}))`, aspectRatio: `${SCENE.w} / ${SCENE.h}` } as const;
