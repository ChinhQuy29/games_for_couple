import { Link, Route, Routes } from 'react-router-dom';
import { HnsProvider, useHns } from './store';
import Home from './screens/Home';
import RoomScreen from './screens/RoomScreen';

export default function HnsApp() {
  return (
    <HnsProvider>
      {/* Laptop-first: a wide container so the map gets room to breathe. */}
      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 pb-6 pt-3">
        <TopBar />
        <Routes>
          <Route index element={<Home />} />
          <Route path=":code" element={<RoomScreen />} />
        </Routes>
        <Toast />
      </div>
    </HnsProvider>
  );
}

function TopBar() {
  const { connected, state } = useHns();
  return (
    <div className="mb-3 flex items-center justify-between">
      <Link to="/" className="font-display text-lg font-extrabold text-ink-soft hover:text-pink">
        ← 💞 Games
      </Link>
      <div className="flex items-center gap-2 text-sm font-bold text-ink-soft">
        {state && <span className="chip !min-h-0 !cursor-default !py-0">Room {state.code}</span>}
        <span title={connected ? 'Connected' : 'Reconnecting…'} aria-label={connected ? 'Connected' : 'Reconnecting'}>
          {connected ? '🟢' : '🟠'}
        </span>
      </div>
    </div>
  );
}

function Toast() {
  const { toast } = useHns();
  if (!toast) return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="sticker bg-yellow px-5 py-3 font-display text-lg font-bold text-on-accent">{toast}</div>
    </div>
  );
}
