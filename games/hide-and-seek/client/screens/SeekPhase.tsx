import { useState } from 'react';
import { useHns, useRoom } from '../store';
import Hud from '../components/Hud';
import MapView from '../components/MapView';
import TimerBar from '../components/TimerBar';

export default function SeekPhase() {
  const { act } = useHns();
  const { s, me, partner } = useRoom();
  const round = s.round!;
  const hunting = round.hunterId === me.id;
  const [lastMiss, setLastMiss] = useState(false);

  async function shoot(propId: string) {
    const res = await act<{ hit: boolean }>('seek:shoot', { propId });
    if (res.ok && !res.hit) {
      setLastMiss(true);
      setTimeout(() => setLastMiss(false), 900);
    }
  }

  const shots = Array.from({ length: s.settings.shots }, (_, i) => i < round.shotsLeft);

  return (
    <main className="flex flex-1 flex-col gap-4">
      <Hud>
        <span className="sticker flex items-center gap-1 px-3 py-1 font-display font-extrabold" aria-label={`${round.shotsLeft} shots left`}>
          {shots.map((live, i) => (
            <span key={i} className={live ? '' : 'opacity-25 grayscale'}>
              🔫
            </span>
          ))}
        </span>
        {!hunting && s.settings.sneaks > 0 && (
          <span className="sticker px-3 py-1 font-display font-extrabold">🥷 {round.sneaksLeft} sneak{round.sneaksLeft === 1 ? '' : 's'}</span>
        )}
      </Hud>
      <TimerBar total={s.settings.seekSec} />

      <p className={`text-center font-display text-xl font-extrabold ${lastMiss ? 'jiggle text-pink' : ''}`}>
        {s.tauntPropId
          ? '👀 Something just wiggled!'
          : hunting
            ? lastMiss
              ? 'Nope, that was a real one!'
              : `Find ${partner?.name ?? 'them'}! Click the object you think is fake.`
            : round.sneaksLeft > 0
              ? 'Stay still… or drag yourself somewhere new (they might see it move!)'
              : 'Stay very, very still 🫣'}
      </p>

      <MapView
        map={round.map}
        props={round.props ?? []}
        mode="seek"
        role={hunting ? 'hunter' : 'hider'}
        myPropId={round.myPropId}
        shots={round.shots}
        tauntPropId={s.tauntPropId}
        canSneak={!hunting && round.sneaksLeft > 0}
        onShoot={shoot}
        onMove={(x, y) => void act('seek:sneak', { x, y })}
      />
    </main>
  );
}
