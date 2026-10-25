import { Link, Route, Routes } from 'react-router-dom';
import { AogProvider, useAog } from './store';
import { setLang, useLang } from './lib/i18n';
import Home from './screens/Home';
import RoomScreen from './screens/RoomScreen';

export default function AogApp() {
  return (
    <AogProvider>
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-6 pt-3">
        <TopBar />
        <Routes>
          <Route index element={<Home />} />
          <Route path=":code" element={<RoomScreen />} />
        </Routes>
        <Toast />
      </div>
    </AogProvider>
  );
}

function TopBar() {
  const { connected, state } = useAog();
  const lang = useLang();
  return (
    <div className="mb-3 flex items-center justify-between">
      <Link to="/" className="font-display text-lg font-extrabold text-ink-soft hover:text-pink">
        ← 💞 {lang === 'vi' ? 'Trò chơi' : 'Games'}
      </Link>
      <div className="flex items-center gap-2 text-sm font-bold text-ink-soft">
        {state && <span className="chip !min-h-0 !cursor-default !py-0">{lang === 'vi' ? 'Phòng' : 'Room'} {state.code}</span>}
        <div className="flex overflow-hidden rounded-full border-[2.5px] border-line" role="group" aria-label="Language">
          {(['vi', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`px-2 py-0.5 font-display font-extrabold ${lang === l ? 'bg-pink text-white' : 'bg-card'}`}
            >
              {l === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
            </button>
          ))}
        </div>
        <span title={connected ? 'Connected' : 'Reconnecting…'} aria-label={connected ? 'Connected' : 'Reconnecting'}>
          {connected ? '🟢' : '🟠'}
        </span>
      </div>
    </div>
  );
}

function Toast() {
  const { toast } = useAog();
  if (!toast) return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="sticker bg-yellow px-5 py-3 font-display text-lg font-bold text-on-accent">{toast}</div>
    </div>
  );
}
