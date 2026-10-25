import { useCallback, useEffect, useState } from 'react';
import { PROP_TYPES, ROTATE_STEP, SCALE_RANGE, type Placement, type PropType } from '../../shared';
import { useHns, useRoom } from '../store';
import Hud from '../components/Hud';
import MapView from '../components/MapView';
import { PropIcon } from '../components/PropArt';
import TimerBar from '../components/TimerBar';
import WaitingBlob from '../components/WaitingBlob';

export default function HidePhase() {
  const { s, me } = useRoom();
  return s.round!.hiderId === me.id ? <Hider key={s.round!.n} /> : <HunterWaits />;
}

function HunterWaits() {
  const { s, partner } = useRoom();
  return (
    <main className="flex flex-1 flex-col gap-4">
      <Hud />
      <TimerBar total={s.settings.hideSec} />
      <section className="sticker flex flex-1 flex-col items-center justify-center gap-2 !bg-ink p-10 text-center text-bg">
        <p className="text-7xl">🙈</p>
        <h1 className="font-display text-4xl font-extrabold">Eyes closed!</h1>
        <p className="font-semibold opacity-80">{partner?.name ?? 'Your partner'} is turning into something and finding a place to hide…</p>
        <p className="text-sm opacity-60">No peeking at their screen on the call 😄</p>
        <div className="mt-4">
          <WaitingBlob label="Get your aim ready 🔫" />
        </div>
      </section>
    </main>
  );
}

function Hider() {
  const { act } = useHns();
  const { s } = useRoom();
  const round = s.round!;
  // Local copy so dragging and rotating feel instant; every change is also sent to the server.
  const [type, setType] = useState<PropType>(round.hider!.type);
  const [place, setPlace] = useState<Placement>({ x: round.hider!.x, y: round.hider!.y, rot: round.hider!.rot, scale: round.hider!.scale });

  const send = useCallback((p: Placement) => void act('hide:place', p), [act]);

  const update = useCallback(
    (patch: Partial<Placement>) => {
      setPlace((cur) => {
        const next = { ...cur, ...patch };
        next.rot = ((next.rot % 360) + 360) % 360;
        next.scale = Math.round(Math.min(SCALE_RANGE.max, Math.max(SCALE_RANGE.min, next.scale)) * 100) / 100;
        send(next);
        return next;
      });
    },
    [send],
  );

  const choose = useCallback(
    (t: PropType) => {
      setType(t);
      void act('hide:pick', { type: t });
    },
    [act],
  );

  const ready = useCallback(() => void act('hide:ready'), [act]);

  // Keyboard: Q/E rotate, -/= size, 1/2/3 pick, Enter = ready.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (k === 'q') update({ rot: place.rot - ROTATE_STEP });
      else if (k === 'e') update({ rot: place.rot + ROTATE_STEP });
      else if (k === '-' || k === '_') update({ scale: place.scale - SCALE_RANGE.step });
      else if (k === '=' || k === '+') update({ scale: place.scale + SCALE_RANGE.step });
      else if (['1', '2', '3'].includes(k) && round.choices![Number(k) - 1]) choose(round.choices![Number(k) - 1]!);
      else if (k === 'enter') ready();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [place, update, choose, ready, round.choices]);

  const twins = (round.props ?? []).filter((p) => p.type === type).length;

  return (
    <main className="flex flex-1 flex-col gap-4">
      <Hud />
      <TimerBar total={s.settings.hideSec} />
      <div className="grid gap-4 lg:grid-cols-[1fr_270px]">
        <MapView
          map={round.map}
          props={round.props ?? []}
          mode="hide"
          role="hider"
          me={{ ...place, type }}
          onMove={(x, y) => update({ x, y })}
        />

        <aside className="flex flex-col gap-3">
          <section className="sticker space-y-2 p-4">
            <h2 className="font-display text-lg font-extrabold">1 · Become…</h2>
            {round.choices!.map((t, i) => (
              <button
                key={t}
                className="chip flex w-full items-center gap-2 !py-1 text-left"
                aria-pressed={type === t}
                onClick={() => choose(t)}
              >
                <PropIcon type={t} size={40} />
                <span className="flex-1">{PROP_TYPES[t].label.en}</span>
                <kbd className="text-xs opacity-60">{i + 1}</kbd>
              </button>
            ))}
            <p className="text-xs font-semibold text-ink-soft">
              {twins > 0 ? `There ${twins === 1 ? 'is 1 real one' : `are ${twins} real ones`} in the room. Blend in!` : 'None of these in the room yet. Be bold?'}
            </p>
          </section>

          <section className="sticker space-y-3 p-4">
            <h2 className="font-display text-lg font-extrabold">2 · Place it</h2>
            <p className="text-xs font-semibold text-ink-soft">Drag your object (green ring) on the map.</p>
            <div className="flex items-center gap-2">
              <button className="chip" onClick={() => update({ rot: place.rot - ROTATE_STEP })} aria-label="Rotate left">
                ⟲
              </button>
              <span className="flex-1 text-center font-display font-bold">{place.rot}°</span>
              <button className="chip" onClick={() => update({ rot: place.rot + ROTATE_STEP })} aria-label="Rotate right">
                ⟳
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="chip" onClick={() => update({ scale: place.scale - SCALE_RANGE.step })} aria-label="Smaller">
                −
              </button>
              <span className="flex-1 text-center font-display font-bold">{Math.round(place.scale * 100)}%</span>
              <button className="chip" onClick={() => update({ scale: place.scale + SCALE_RANGE.step })} aria-label="Bigger">
                +
              </button>
            </div>
            <p className="text-xs font-semibold text-ink-soft">Keys: Q/E rotate · −/= size · 1/2/3 object · Enter ready</p>
          </section>

          <button className="btn btn-pink w-full" onClick={ready}>
            I'm hidden! 🤫
          </button>
        </aside>
      </div>
    </main>
  );
}
