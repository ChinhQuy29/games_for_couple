import { motion, useReducedMotion } from 'framer-motion';
import { PROP_TYPES } from '../../shared';
import { useHns, useRoom } from '../store';
import Hud from '../components/Hud';
import MapView from '../components/MapView';
import { PropIcon } from '../components/PropArt';

export default function RevealPhase() {
  const { act } = useHns();
  const { s, me, partner } = useRoom();
  const reduce = useReducedMotion();
  const round = s.round!;
  const hider = s.players.find((p) => p.id === round.hiderId);
  const hunter = s.players.find((p) => p.id === round.hunterId);
  const found = round.result === 'found';
  const usedShots = round.shots.length;
  const iAmReady = s.readyForNext.includes(me.id);
  const isLast = round.n >= s.totalRounds;
  const type = round.hider?.type;

  return (
    <main className="flex flex-1 flex-col gap-4">
      <Hud />
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <MapView map={round.map} props={round.props ?? []} mode="reveal" role="hunter" myPropId={round.hiderPropId} shots={round.shots} />

        <aside className="flex flex-col gap-3">
          <motion.h2
            initial={reduce ? false : { scale: 2.2, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: -2, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 12 }}
            className={`sticker p-4 text-center font-display text-3xl font-extrabold ${found ? '!bg-mint' : '!bg-yellow'} text-on-accent`}
          >
            {found ? '🎯 Found!' : '🙈 Survived!'}
          </motion.h2>
          <section className="sticker space-y-2 p-4 font-semibold">
            {type && (
              <p className="flex items-center gap-2">
                <PropIcon type={type} size={40} /> {hider?.name} was the <b>{PROP_TYPES[type].label.en.toLowerCase()}</b>
              </p>
            )}
            <p>
              {found
                ? `${hunter?.name} found them with shot ${usedShots} of ${s.settings.shots}.`
                : `${hunter?.name} used ${usedShots} shot${usedShots === 1 ? '' : 's'} and missed every one.`}
            </p>
            {round.points &&
              s.players.map((p) => (
                <p key={p.id}>
                  {p.name}: <b className="text-pink">+{round.points![p.id] ?? 0}</b>
                </p>
              ))}
          </section>
          <button className="btn btn-mint w-full" disabled={iAmReady} onClick={() => act('round:ready')}>
            {iAmReady ? `Waiting for ${partner?.name ?? '…'}…` : isLast ? 'See the results 🏆' : 'Next round (swap roles) ▶'}
          </button>
        </aside>
      </div>
    </main>
  );
}
