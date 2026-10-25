import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CLICKS, CREATURE_SCALE, ROUNDS, SCENE, TEX, toLocal, type Placement } from '../shared';
import { kit } from './kit';
import { SCENE_STYLE, creaturePath, drawCreature, loadImage, sceneCanvas } from './canvas';

const { useGame, useRoom, LobbyShell, Avatar, RecapActions } = kit;

function useNow(ms = 250) {
  const { clockOffset } = useGame();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now + clockOffset;
}

/** Scene coordinates of a pointer event on a canvas showing the whole scene. */
function scenePoint(e: React.PointerEvent<HTMLCanvasElement>): [number, number] {
  const r = e.currentTarget.getBoundingClientRect();
  return [((e.clientX - r.left) / r.width) * SCENE.w, ((e.clientY - r.top) / r.height) * SCENE.h];
}

function fitCanvas(c: HTMLCanvasElement) {
  const ctx = c.getContext('2d')!;
  const dpr = window.devicePixelRatio || 1;
  const w = Math.round(c.clientWidth * dpr);
  if (c.width !== w) {
    c.width = w;
    c.height = Math.round(c.clientHeight * dpr);
  }
  ctx.setTransform(c.width / SCENE.w, 0, 0, c.height / SCENE.h, 0, 0);
  return ctx;
}

export function Lobby() {
  return (
    <LobbyShell
      startLabel="Grab the paintbrush 🎨"
      howTo={
        <>
          <h2 className="font-display text-xl font-extrabold">How it works</h2>
          <p>🦎 The <b>Hider</b> drags a chameleon onto a crazy painted scene, rotates it, and paints it to blend in. Use the 💧 eyedropper to steal colors from the scene!</p>
          <p>🔎 The <b>Seeker</b> then gets <b>25 seconds</b> and <b>3 clicks</b> to find it.</p>
          <p>🏆 Found fast = points for the seeker. Not found = 150 points for the hider. You swap every round ({ROUNDS} rounds).</p>
        </>
      }
      settings={<p className="font-semibold text-ink-soft">80 seconds to hide. A new scene every round.</p>}
    />
  );
}

function Scores() {
  const { s, me } = useRoom();
  return (
    <span className="ml-auto flex gap-2 font-display font-extrabold">
      {s.players.map((p) => (
        <span key={p.id} className="sticker flex items-center gap-1 px-3 py-1">
          <Avatar id={p.id} size="text-lg" /> {p.id === me.id ? 'you' : p.name} {s.scores[p.id] ?? 0}
        </span>
      ))}
    </span>
  );
}

type Tool = 'move' | 'brush' | 'dropper';

export function Hide() {
  const { s, partner } = useRoom();
  const now = useNow();
  if (s.myRole !== 'hider') {
    const left = Math.max(0, Math.ceil(((s.deadline ?? now) - now) / 1000));
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="sticker space-y-3 p-10">
          <p className="text-7xl">🙈</p>
          <p className="font-display text-3xl font-extrabold">{partner?.name} is hiding and painting…</p>
          <p className="font-mono text-4xl font-bold">{left}s</p>
          <p className="font-semibold text-ink-soft">Round {s.round}/{ROUNDS}. Get ready: you'll have 25 seconds and 3 clicks.</p>
        </div>
      </main>
    );
  }
  return <HiderStudio />;
}

function HiderStudio() {
  const { act } = useGame();
  const { s } = useRoom();
  const now = useNow(200);
  const canvas = useRef<HTMLCanvasElement>(null);
  const tex = useRef<HTMLCanvasElement | null>(null);
  const [place, setPlace] = useState<Placement>({ x: SCENE.w / 2, y: SCENE.h / 2, rot: 0, flip: false });
  const [tool, setTool] = useState<Tool>('move');
  const [color, setColor] = useState('#3ddc97');
  const [size, setSize] = useState(14);
  const [sent, setSent] = useState(false);
  const [, redraw] = useState(0);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const last = useRef<[number, number] | null>(null);
  const palette = useMemo(() => [...new Set([...paletteFor(s.seed), '#ffffff', '#2b2140'])], [s.seed]);

  // The texture starts as a plain green chameleon.
  if (!tex.current) {
    const c = document.createElement('canvas');
    c.width = TEX.w;
    c.height = TEX.h;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#3ddc97';
    ctx.fillRect(0, 0, TEX.w, TEX.h);
    tex.current = c;
  }

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = fitCanvas(c);
    ctx.drawImage(sceneCanvas(s.seed), 0, 0);
    drawCreature(ctx, place, tex.current, '#ffffff');
  });

  const submit = () => {
    if (sent) return;
    setSent(true);
    void act('hide', { ...place, paint: tex.current!.toDataURL('image/png') }).then((r) => !r.ok && setSent(false));
  };
  // Auto-submit just before the time runs out.
  useEffect(() => {
    if (s.deadline && now > s.deadline - 1500) submit();
  });

  const paintAt = (x: number, y: number) => {
    const [lx, ly] = toLocal(place, x, y);
    const ctx = tex.current!.getContext('2d')!;
    ctx.save();
    ctx.clip(creaturePath(TEX.ox, TEX.oy));
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineCap = 'round';
    ctx.lineWidth = size / CREATURE_SCALE;
    const tx = lx + TEX.ox;
    const ty = ly + TEX.oy;
    ctx.beginPath();
    if (last.current) {
      ctx.moveTo(last.current[0], last.current[1]);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    } else {
      ctx.arc(tx, ty, size / CREATURE_SCALE / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    last.current = [tx, ty];
    redraw((n) => n + 1);
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const [x, y] = scenePoint(e);
    e.currentTarget.setPointerCapture(e.pointerId);
    if (tool === 'dropper') {
      const d = sceneCanvas(s.seed).getContext('2d')!.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
      setColor(`#${[d[0], d[1], d[2]].map((v) => v!.toString(16).padStart(2, '0')).join('')}`);
      setTool('brush');
      return;
    }
    if (tool === 'move') drag.current = { dx: x - place.x, dy: y - place.y };
    else {
      last.current = null;
      paintAt(x, y);
    }
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons === 0) return;
    const [x, y] = scenePoint(e);
    if (tool === 'move' && drag.current) setPlace((p) => ({ ...p, x: Math.max(0, Math.min(SCENE.w, x - drag.current!.dx)), y: Math.max(0, Math.min(SCENE.h, y - drag.current!.dy)) }));
    else if (tool === 'brush') paintAt(x, y);
  };
  const up = () => {
    drag.current = null;
    last.current = null;
  };
  const fill = () => {
    const ctx = tex.current!.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, TEX.w, TEX.h);
    redraw((n) => n + 1);
  };

  const left = Math.max(0, Math.ceil(((s.deadline ?? now) - now) / 1000));
  const btn = (on: boolean) => `chip !min-h-0 !py-1 text-sm ${on ? '!bg-yellow !text-[#2b2140]' : ''}`;
  return (
    <main className="flex flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="sticker px-3 py-1 font-display font-extrabold">🦎 You hide · round {s.round}/{ROUNDS}</span>
        <span className={`rounded-xl border-[3px] border-line bg-[#1f1b2e] px-3 py-1 font-mono text-xl font-bold ${left < 15 ? 'text-[#ff4f4f]' : 'text-white'}`}>⏱️ {left}s</span>
        <Scores />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button className={btn(tool === 'move')} onClick={() => setTool('move')}>✋ Move</button>
        <button className={btn(tool === 'brush')} onClick={() => setTool('brush')}>🖌️ Brush</button>
        <button className={btn(tool === 'dropper')} onClick={() => setTool('dropper')}>💧 Eyedropper</button>
        <button className={btn(false)} onClick={fill}>🪣 Fill all</button>
        {[6, 14, 28].map((n) => (
          <button key={n} className={btn(size === n)} onClick={() => setSize(n)} aria-label={`Brush size ${n}`}>
            <span className="inline-block rounded-full bg-current" style={{ width: n / 2 + 4, height: n / 2 + 4 }} />
          </button>
        ))}
        <button className={btn(false)} onClick={() => setPlace((p) => ({ ...p, rot: p.rot - 15 }))}>↺</button>
        <button className={btn(false)} onClick={() => setPlace((p) => ({ ...p, rot: p.rot + 15 }))}>↻</button>
        <button className={btn(place.flip)} onClick={() => setPlace((p) => ({ ...p, flip: !p.flip }))}>⇋ Flip</button>
        <span className="flex gap-1">
          {palette.map((c) => (
            <button key={c} onClick={() => { setColor(c); setTool('brush'); }} className={`h-7 w-7 rounded-full border-[3px] ${color === c ? 'border-yellow' : 'border-line'}`} style={{ background: c }} aria-label={`Color ${c}`} />
          ))}
        </span>
        <span className="h-8 w-8 rounded-lg border-[3px] border-line" style={{ background: color }} title="Current color" />
        <button className="btn btn-mint ml-auto !py-1" disabled={sent} onClick={submit}>
          {sent ? 'Hidden…' : 'Done hiding ✅'}
        </button>
      </div>
      <canvas
        ref={canvas}
        className={`mx-auto block touch-none rounded-2xl border-[3px] border-line ${tool === 'move' ? 'cursor-move' : 'cursor-crosshair'}`}
        style={SCENE_STYLE}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      />
      <p className="text-center text-xs font-bold text-ink-soft">The white dashed outline is only on your screen. Tip: 💧 pick colors right next to the chameleon, then paint the patterns across it.</p>
    </main>
  );
}

/** The scene's own colors make the best paint. */
function paletteFor(seed: number): string[] {
  const c = sceneCanvas(seed).getContext('2d')!;
  const out = new Set<string>();
  for (let i = 0; i < 40 && out.size < 8; i++) {
    const d = c.getImageData(((i * 197) % (SCENE.w - 2)) + 1, ((i * 131) % (SCENE.h - 2)) + 1, 1, 1).data;
    out.add(`#${[d[0], d[1], d[2]].map((v) => v!.toString(16).padStart(2, '0')).join('')}`);
  }
  return [...out];
}

/** Scene + painted creature + click markers; used while seeking and in the reveal. */
function Board({ onClick, outline }: { onClick?: (x: number, y: number) => void; outline: boolean }) {
  const { s } = useRoom();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    let live = true;
    if (s.paint) void loadImage(s.paint).then((i) => live && setImg(i));
    else setImg(null);
    return () => {
      live = false;
    };
  }, [s.paint]);
  useEffect(() => {
    const c = canvas.current;
    if (!c || !s.placement) return;
    const ctx = fitCanvas(c);
    ctx.drawImage(sceneCanvas(s.seed), 0, 0);
    drawCreature(ctx, s.placement, img, outline ? '#ff4f8b' : null);
    for (const k of s.clicks) {
      ctx.font = 'bold 44px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(k.hit ? '✅' : '❌', k.x, k.y);
    }
  });
  return (
    <canvas
      ref={canvas}
      className={`mx-auto block rounded-2xl border-[3px] border-line ${onClick ? 'cursor-crosshair' : ''}`}
      style={SCENE_STYLE}
      onPointerDown={(e) => {
        if (!onClick) return;
        const [x, y] = scenePoint(e);
        onClick(x, y);
      }}
    />
  );
}

export function Seek() {
  const { act } = useGame();
  const { s, partner } = useRoom();
  const now = useNow(200);
  const left = Math.max(0, Math.ceil(((s.deadline ?? now) - now) / 1000));
  const seeker = s.myRole === 'seeker';
  return (
    <main className="flex flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="sticker px-3 py-1 font-display font-extrabold">{seeker ? `🔎 Find ${partner?.name}'s chameleon!` : `👀 ${partner?.name} is looking for your chameleon…`}</span>
        <span className={`rounded-xl border-[3px] border-line bg-[#1f1b2e] px-3 py-1 font-mono text-xl font-bold ${left < 8 ? 'text-[#ff4f4f]' : 'text-white'}`}>⏱️ {left}s</span>
        <span className="sticker px-3 py-1 font-display font-extrabold">🎯 {CLICKS - s.clicks.length} click{CLICKS - s.clicks.length === 1 ? '' : 's'} left</span>
        <Scores />
      </div>
      <Board outline={false} onClick={seeker ? (x, y) => void act('click', { x, y }) : undefined} />
    </main>
  );
}

export function Reveal() {
  const { act } = useGame();
  const { s, me, partner } = useRoom();
  const reduce = useReducedMotion();
  const last = s.results[s.results.length - 1];
  if (!last) return null;
  const iAmReady = s.readyForNext.includes(me.id);
  const hider = s.players.find((p) => p.id === last.hiderId);
  return (
    <main className="flex flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <motion.span
          initial={reduce ? false : { scale: 1.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`sticker px-4 py-1 font-display text-xl font-extrabold ${last.found ? '!bg-mint' : '!bg-yellow'} text-[#2b2140]`}
        >
          {last.found ? `🔎 Found in ${last.secs}s! +${last.points}` : `🦎 ${hider?.name} stayed hidden! +${last.points}`}
        </motion.span>
        <Scores />
      </div>
      <Board outline />
      <div className="flex gap-2">
        <button className="btn btn-mint flex-1" disabled={iAmReady} onClick={() => act('round:ready')}>
          {iAmReady ? `Waiting for ${partner?.name ?? '…'}…` : s.round >= ROUNDS ? 'Final scores 🏆' : 'Next round (swap) 🔁'}
        </button>
        {me.isHost && <RecapActions />}
      </div>
    </main>
  );
}

export function Finish() {
  const { s, me } = useRoom();
  const [a, b] = s.players;
  const sa = a ? (s.scores[a.id] ?? 0) : 0;
  const sb = b ? (s.scores[b.id] ?? 0) : 0;
  const winner = sa === sb ? null : sa > sb ? a : b;
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5">
      <h1 className="sticker self-center !bg-yellow px-8 py-4 text-center font-display text-4xl font-extrabold text-[#2b2140]">
        {winner ? `🏆 ${winner.id === me.id ? 'You win' : `${winner.name} wins`}!` : '🤝 A tie!'}
      </h1>
      <section className="sticker space-y-2 p-5 font-semibold">
        {s.results.map((r) => {
          const h = s.players.find((p) => p.id === r.hiderId);
          return (
            <p key={r.n}>
              Round {r.n}: {h?.name} hid · {r.found ? `found in ${r.secs}s` : 'never found 🦎'} · +{r.points} to {s.players.find((p) => p.id === r.pointsTo)?.name}
            </p>
          );
        })}
      </section>
      {me.isHost ? <RecapActions /> : <p className="text-center text-ink-soft">The host can start again.</p>}
    </main>
  );
}
