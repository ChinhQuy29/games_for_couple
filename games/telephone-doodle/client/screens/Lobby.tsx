import { useNavigate } from 'react-router-dom';
import { DRAW_TIMER_OPTIONS, GUESS_TIMER_OPTIONS, ROUND_OPTIONS, STEP_OPTIONS, type SettingsPatch } from '../../shared';
import { useDoodle, useRoom } from '../store';
import Avatar from '../components/Avatar';

const COPY = {
  share: 'Send this to your partner',
  copy: 'Copy link',
  copied: 'Link copied! Go send it 💌',
  waiting: 'Waiting for your partner…',
  hostOnly: (name: string) => `${name} is picking the settings`,
  start: "Let's go! 🚀",
};

export default function Lobby() {
  const { act, leave, showToast } = useDoodle();
  const { s, me, partner } = useRoom();
  const navigate = useNavigate();
  const link = `${window.location.origin}/doodle/${s.code}`;
  const host = s.players.find((p) => p.isHost);
  const canEdit = me.isHost;
  const ready = s.players.length === 2 && s.players.every((p) => p.connected);

  const set = (patch: SettingsPatch) => canEdit && act('settings:update', patch);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      showToast(COPY.copied);
    } catch {
      showToast(link);
    }
  }


  return (
    <main className="flex flex-1 flex-col gap-5">
      <section className="sticker p-5 text-center">
        <p className="font-display font-bold text-ink-soft">{COPY.share}</p>
        <p className="font-display text-6xl font-extrabold tracking-[0.2em] text-pink">{s.code}</p>
        <div className="mt-3 flex justify-center gap-3">
          <button className="btn btn-sky !text-base" onClick={copyLink}>
            🔗 {COPY.copy}
          </button>
          {'share' in navigator && (
            <button
              className="btn btn-ghost !text-base"
              onClick={() => navigator.share({ title: 'Telephone Doodle', text: 'Draw with me 🖍️', url: link }).catch(() => {})}
            >
              📤 Share
            </button>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        {[0, 1].map((i) => {
          const p = s.players[i];
          return (
            <div key={i} className={`sticker flex flex-col items-center p-4 ${i ? 'rotate-1' : '-rotate-1'} ${p ? '' : 'opacity-60'}`}>
              {p ? <Avatar id={p.id} size="text-5xl" /> : <span className="jiggle text-5xl">❔</span>}
              <span className="mt-1 max-w-full truncate font-display text-xl font-extrabold">{p ? p.name : COPY.waiting}</span>
              <span className="text-sm font-bold text-ink-soft">
                {p ? `${p.isHost ? '👑 host' : 'player'}${p.id === me.id ? ' · you' : ''}${p.connected ? '' : ' · 📡 offline'}` : ''}
              </span>
            </div>
          );
        })}
      </section>

      <section className="sticker space-y-4 p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-extrabold">Settings</h2>
          {!canEdit && host && <span className="text-sm font-bold text-ink-soft">{COPY.hostOnly(host.name)}</span>}
        </div>

        <Row label="Rounds (2 chains each)">
          {ROUND_OPTIONS.map((r) => (
            <button key={r} className="chip" aria-pressed={s.settings.rounds === r} disabled={!canEdit} onClick={() => set({ rounds: r })}>
              {r}
            </button>
          ))}
        </Row>

        <Row label="Chain length">
          {STEP_OPTIONS.map((n) => (
            <button key={n} className="chip" aria-pressed={s.settings.steps === n} disabled={!canEdit} onClick={() => set({ steps: n })}>
              {n} steps
            </button>
          ))}
          <p className="w-full text-sm font-semibold text-ink-soft">
            Prompt → {Array.from({ length: s.settings.steps }, (_, i) => (i % 2 ? 'guess' : 'draw')).join(' → ')}
          </p>
        </Row>

        <Row label="Drawing time">
          {DRAW_TIMER_OPTIONS.map((t) => (
            <button key={String(t)} className="chip" aria-pressed={s.settings.drawSec === t} disabled={!canEdit} onClick={() => set({ drawSec: t })}>
              {t ? `${t}s` : 'Off'}
            </button>
          ))}
        </Row>

        <Row label="Guessing time">
          {GUESS_TIMER_OPTIONS.map((t) => (
            <button key={String(t)} className="chip" aria-pressed={s.settings.guessSec === t} disabled={!canEdit} onClick={() => set({ guessSec: t })}>
              {t ? `${t}s` : 'Off'}
            </button>
          ))}
        </Row>

        <Row label="Chaos rules">
          <button className="chip" aria-pressed={s.settings.chaosOn} disabled={!canEdit} onClick={() => set({ chaosOn: !s.settings.chaosOn })}>
            {s.settings.chaosOn ? '🫨 On' : 'Off'}
          </button>
          <p className="w-full text-sm font-semibold text-ink-soft">Blind drawing, one stroke only, mirror hands…</p>
        </Row>
      </section>

      <div className="action-bar mt-auto flex gap-3">
        <button
          className="btn btn-ghost !text-base"
          onClick={async () => {
            await leave();
            navigate('/doodle');
          }}
        >
          Leave
        </button>
        {me.isHost ? (
          <button className="btn btn-pink flex-1" disabled={!ready} onClick={() => act('game:start')}>
            {ready ? COPY.start : partner ? `${partner.name} is offline…` : COPY.waiting}
          </button>
        ) : (
          <div className="sticker flex flex-1 items-center justify-center px-4 font-display font-bold">Waiting for {host?.name} to start…</div>
        )}
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
