import { useNavigate } from 'react-router-dom';
import { CATEGORIES, QUESTION_OPTIONS, TIME_OPTIONS, type CategoryId, type SettingsPatch } from '../../shared';
import { useAog, useRoom } from '../store';
import { useCopy, useT } from '../lib/i18n';
import Avatar from '../components/Avatar';

const COPY = {
  vi: {
    share: 'Gửi mã này cho người ấy',
    copy: 'Sao chép link',
    copied: 'Đã sao chép! Gửi ngay đi 💌',
    waiting: 'Đang chờ người ấy…',
    host: '👑 chủ phòng',
    player: 'người chơi',
    you: ' · bạn',
    offline: ' · 📡 mất kết nối',
    hostOnly: (n: string) => `${n} đang chọn cài đặt`,
    settings: 'Cài đặt',
    questions: 'Số câu hỏi',
    time: 'Thời gian mỗi câu',
    finale: 'Chung kết SGP Special 👻',
    finaleOn: '👻 Bật (×2 điểm cho 3 câu cuối)',
    off: 'Tắt',
    categories: 'Chủ đề',
    deck: (n: number) => `${n} câu hỏi trong kho`,
    keepOne: 'Giữ ít nhất một chủ đề nhé!',
    start: 'Vào trận! ⚔️',
    leave: 'Rời phòng',
    waitHost: (n: string) => `Chờ ${n} bắt đầu…`,
    partnerOff: (n: string) => `${n} đang mất kết nối…`,
  },
  en: {
    share: 'Send this to your partner',
    copy: 'Copy link',
    copied: 'Link copied! Go send it 💌',
    waiting: 'Waiting for your partner…',
    host: '👑 host',
    player: 'player',
    you: ' · you',
    offline: ' · 📡 offline',
    hostOnly: (n: string) => `${n} is picking the settings`,
    settings: 'Settings',
    questions: 'Questions',
    time: 'Time per question',
    finale: 'SGP Special finale 👻',
    finaleOn: '👻 On (double points, last 3)',
    off: 'Off',
    categories: 'Topics',
    deck: (n: number) => `${n} questions in the deck`,
    keepOne: 'Keep at least one topic!',
    start: 'Enter the arena! ⚔️',
    leave: 'Leave',
    waitHost: (n: string) => `Waiting for ${n} to start…`,
    partnerOff: (n: string) => `${n} is offline…`,
  },
};

export default function Lobby() {
  const { act, leave, showToast } = useAog();
  const { s, me, partner } = useRoom();
  const c = useCopy(COPY);
  const tr = useT();
  const navigate = useNavigate();
  const link = `${window.location.origin}/aog/${s.code}`;
  const host = s.players.find((p) => p.isHost);
  const canEdit = me.isHost;
  const ready = s.players.length === 2 && s.players.every((p) => p.connected);
  const set = (patch: SettingsPatch) => canEdit && act('settings:update', patch);

  function toggleCategory(id: CategoryId) {
    const has = s.settings.categories.includes(id);
    const next = has ? s.settings.categories.filter((x) => x !== id) : [...s.settings.categories, id];
    if (next.length === 0) return showToast(c.keepOne);
    set({ categories: next });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      showToast(c.copied);
    } catch {
      showToast(link);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-5">
      <section className="sticker p-5 text-center">
        <p className="font-display font-bold text-ink-soft">{c.share}</p>
        <p className="font-display text-6xl font-extrabold tracking-[0.2em] text-pink">{s.code}</p>
        <button className="btn btn-sky mt-3 !text-base" onClick={copyLink}>
          🔗 {c.copy}
        </button>
      </section>

      <section className="grid grid-cols-2 gap-4">
        {[0, 1].map((i) => {
          const p = s.players[i];
          return (
            <div key={i} className={`sticker flex flex-col items-center p-4 ${i ? 'rotate-1' : '-rotate-1'} ${p ? '' : 'opacity-60'}`}>
              {p ? <Avatar id={p.id} size="text-5xl" /> : <span className="jiggle text-5xl">❔</span>}
              <span className="mt-1 max-w-full truncate font-display text-xl font-extrabold">{p ? p.name : c.waiting}</span>
              <span className="text-sm font-bold text-ink-soft">
                {p ? `${p.isHost ? c.host : c.player}${p.id === me.id ? c.you : ''}${p.connected ? '' : c.offline}` : ''}
              </span>
            </div>
          );
        })}
      </section>

      <section className="sticker space-y-4 p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-extrabold">{c.settings}</h2>
          {!canEdit && host && <span className="text-sm font-bold text-ink-soft">{c.hostOnly(host.name)}</span>}
        </div>

        <Row label={c.questions}>
          {QUESTION_OPTIONS.map((n) => (
            <button key={n} className="chip" aria-pressed={s.settings.questions === n} disabled={!canEdit} onClick={() => set({ questions: n })}>
              {n}
            </button>
          ))}
        </Row>

        <Row label={c.time}>
          {TIME_OPTIONS.map((t) => (
            <button key={t} className="chip" aria-pressed={s.settings.timeSec === t} disabled={!canEdit} onClick={() => set({ timeSec: t })}>
              {t}s
            </button>
          ))}
        </Row>

        <Row label={c.finale}>
          <button className="chip" aria-pressed={s.settings.sgpFinale} disabled={!canEdit} onClick={() => set({ sgpFinale: !s.settings.sgpFinale })}>
            {s.settings.sgpFinale ? c.finaleOn : c.off}
          </button>
        </Row>

        <Row label={c.categories}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className="chip"
              aria-pressed={s.settings.categories.includes(cat.id)}
              disabled={!canEdit}
              onClick={() => toggleCategory(cat.id)}
            >
              {tr(cat.label)}
            </button>
          ))}
          <p className="w-full text-sm font-semibold text-ink-soft">{c.deck(s.deckSize)}</p>
        </Row>
      </section>

      <div className="action-bar mt-auto flex gap-3">
        <button
          className="btn btn-ghost !text-base"
          onClick={async () => {
            await leave();
            navigate('/aog');
          }}
        >
          {c.leave}
        </button>
        {me.isHost ? (
          <button className="btn btn-pink flex-1" disabled={!ready} onClick={() => act('game:start')}>
            {ready ? c.start : partner ? c.partnerOff(partner.name) : c.waiting}
          </button>
        ) : (
          <div className="sticker flex flex-1 items-center justify-center px-4 font-display font-bold">{c.waitHost(host?.name ?? '…')}</div>
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
