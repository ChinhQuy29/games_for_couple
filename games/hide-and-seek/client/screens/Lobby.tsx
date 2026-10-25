import { useNavigate } from 'react-router-dom';
import { HIDE_OPTIONS, MAP_OPTIONS, MAPS, ROUND_OPTIONS, SEEK_OPTIONS, SHOT_OPTIONS, SNEAK_OPTIONS, type SettingsPatch } from '../../shared';
import { useHns, useRoom } from '../store';
import Avatar from '../components/Avatar';

export default function Lobby() {
  const { act, leave, showToast } = useHns();
  const { s, me, partner } = useRoom();
  const navigate = useNavigate();
  const link = `${window.location.origin}/hns/${s.code}`;
  const host = s.players.find((p) => p.isHost);
  const canEdit = me.isHost;
  const ready = s.players.length === 2 && s.players.every((p) => p.connected);
  const set = (patch: SettingsPatch) => canEdit && act('settings:update', patch);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      showToast('Link copied! Go send it 💌');
    } catch {
      showToast(link);
    }
  }

  return (
    <main className="grid flex-1 gap-5 lg:grid-cols-[1fr_1.3fr]">
      <div className="flex flex-col gap-5">
        <section className="sticker p-5 text-center">
          <p className="font-display font-bold text-ink-soft">Send this to your partner</p>
          <p className="font-display text-6xl font-extrabold tracking-[0.2em] text-pink">{s.code}</p>
          <button className="btn btn-sky mt-3 !text-base" onClick={copyLink}>
            🔗 Copy link
          </button>
        </section>

        <section className="grid grid-cols-2 gap-4">
          {[0, 1].map((i) => {
            const p = s.players[i];
            return (
              <div key={i} className={`sticker flex flex-col items-center p-4 ${i ? 'rotate-1' : '-rotate-1'} ${p ? '' : 'opacity-60'}`}>
                {p ? <Avatar id={p.id} size="text-5xl" /> : <span className="jiggle text-5xl">❔</span>}
                <span className="mt-1 max-w-full truncate font-display text-xl font-extrabold">{p ? p.name : 'Waiting for your partner…'}</span>
                <span className="text-sm font-bold text-ink-soft">
                  {p ? `${p.isHost ? '👑 host' : 'player'}${p.id === me.id ? ' · you' : ''}${p.connected ? '' : ' · 📡 offline'}` : ''}
                </span>
              </div>
            );
          })}
        </section>

        <section className="sticker space-y-2 p-5 text-sm font-semibold">
          <h2 className="font-display text-xl font-extrabold">How it works</h2>
          <p>🙈 <b>Hider:</b> pick one of 3 objects, drag it somewhere it blends in, rotate it with Q/E. The hunter can't see the room while you hide.</p>
          <p>🔫 <b>Hunter:</b> click the object you think is fake. Missed shots break real things.</p>
          <p>👀 Every 15s the fake does a tiny wiggle. Watch closely!</p>
          <p>🔁 You swap roles every round.</p>
        </section>
      </div>

      <div className="flex flex-col gap-5">
        <section className="sticker space-y-4 p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-extrabold">Settings</h2>
            {!canEdit && host && <span className="text-sm font-bold text-ink-soft">{host.name} is picking the settings</span>}
          </div>

          <Row label="Map">
            {MAP_OPTIONS.map((m) => (
              <button key={m} className="chip" aria-pressed={s.settings.map === m} disabled={!canEdit} onClick={() => set({ map: m })}>
                {m === 'random' ? '🎲 Random' : `${MAPS[m].emoji} ${MAPS[m].name.en}`}
              </button>
            ))}
          </Row>
          <Row label="Rounds (you swap roles each round)">
            {ROUND_OPTIONS.map((n) => (
              <button key={n} className="chip" aria-pressed={s.settings.rounds === n} disabled={!canEdit} onClick={() => set({ rounds: n })}>
                {n}
              </button>
            ))}
          </Row>
          <Row label="Time to hide">
            {HIDE_OPTIONS.map((t) => (
              <button key={t} className="chip" aria-pressed={s.settings.hideSec === t} disabled={!canEdit} onClick={() => set({ hideSec: t })}>
                {t}s
              </button>
            ))}
          </Row>
          <Row label="Time to hunt">
            {SEEK_OPTIONS.map((t) => (
              <button key={t} className="chip" aria-pressed={s.settings.seekSec === t} disabled={!canEdit} onClick={() => set({ seekSec: t })}>
                {t}s
              </button>
            ))}
          </Row>
          <Row label="Shots">
            {SHOT_OPTIONS.map((n) => (
              <button key={n} className="chip" aria-pressed={s.settings.shots === n} disabled={!canEdit} onClick={() => set({ shots: n })}>
                🔫 {n}
              </button>
            ))}
          </Row>
          <Row label="Sneak moves for the hider">
            {SNEAK_OPTIONS.map((n) => (
              <button key={n} className="chip" aria-pressed={s.settings.sneaks === n} disabled={!canEdit} onClick={() => set({ sneaks: n })}>
                {n === 0 ? 'None' : n}
              </button>
            ))}
          </Row>
          <Row label="🙈 Who hides first?">
            {(['random', 'host', 'guest'] as const).map((f) => {
              const who = f === 'host' ? s.players.find((p) => p.isHost) : s.players.find((p) => !p.isHost);
              return (
                <button key={f} className="chip" aria-pressed={(s.settings.firstHider ?? 'random') === f} disabled={!canEdit} onClick={() => set({ firstHider: f })}>
                  {f === 'random' ? '🎲 Random' : `${f === 'host' ? '👑' : '💞'} ${who ? (who.id === s.you ? `${who.name} (you)` : who.name) : f === 'host' ? 'Host' : 'Partner'}`}
                </button>
              );
            })}
          </Row>
          <Row label="Taunts (the fake wiggles every 15s)">
            <button className="chip" aria-pressed={s.settings.taunts} disabled={!canEdit} onClick={() => set({ taunts: !s.settings.taunts })}>
              {s.settings.taunts ? '👀 On' : 'Off'}
            </button>
          </Row>
        </section>

        <div className="action-bar mt-auto flex gap-3">
          <button
            className="btn btn-ghost !text-base"
            onClick={async () => {
              await leave();
              navigate('/hns');
            }}
          >
            Leave
          </button>
          {me.isHost ? (
            <button className="btn btn-pink flex-1" disabled={!ready} onClick={() => act('game:start')}>
              {ready ? "Let's play! 🙈" : partner ? `${partner.name} is offline…` : 'Waiting for your partner…'}
            </button>
          ) : (
            <div className="sticker flex flex-1 items-center justify-center px-4 font-display font-bold">Waiting for {host?.name} to start…</div>
          )}
        </div>
      </div>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 font-display font-bold">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
