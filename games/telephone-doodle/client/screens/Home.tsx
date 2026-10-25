import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LIMITS } from '../../shared';
import { useDoodle } from '../store';
import { KEYS, load, save } from '../lib/storage';

const COPY = {
  title: 'Telephone Doodle',
  subtitle: 'Draw it. Guess it. Draw the guess. Watch it fall apart.',
  name: 'Your name',
  create: 'Create a room ✨',
  or: 'or join your partner',
  code: 'ABCD',
  join: 'Join',
};

export default function Home() {
  const { createRoom } = useDoodle();
  const navigate = useNavigate();
  const [name, setName] = useState(() => load(KEYS.name, ''));
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const nameOk = name.trim().length >= LIMITS.nameMin;

  async function onCreate() {
    if (!nameOk) return;
    setBusy(true);
    save(KEYS.name, name.trim());
    const roomCode = await createRoom(name.trim());
    setBusy(false);
    if (roomCode) navigate(`/doodle/${roomCode}`);
  }

  function onJoin() {
    if (!nameOk || code.length !== 4) return;
    save(KEYS.name, name.trim());
    navigate(`/doodle/${code}`, { state: { autoJoin: true } });
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 py-6 text-center">
      <header>
        <div className="wobble mb-1 inline-block text-6xl" aria-hidden>
          🖍️
        </div>
        <h1 className="font-display text-5xl font-extrabold leading-[0.95]">
          Telephone
          <br />
          <span className="text-pink">Doodle</span>
        </h1>
        <p className="mt-3 font-semibold text-ink-soft">{COPY.subtitle}</p>
      </header>

      <div className="sticker w-full space-y-4 p-5 text-left">
        <label className="block">
          <span className="mb-1 block font-display font-bold">{COPY.name}</span>
          <input
            className="field"
            value={name}
            maxLength={LIMITS.nameMax}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Snugglebug"
            autoComplete="nickname"
          />
        </label>
        <button className="btn btn-pink w-full" disabled={!nameOk || busy} onClick={onCreate}>
          {busy ? 'Creating…' : COPY.create}
        </button>

        <div className="flex items-center gap-3 text-sm font-bold text-ink-soft">
          <div className="h-[3px] flex-1 rounded bg-muted" />
          {COPY.or}
          <div className="h-[3px] flex-1 rounded bg-muted" />
        </div>

        <form
          className="flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            onJoin();
          }}
        >
          <input
            className="field text-center font-display !text-2xl font-extrabold uppercase tracking-[0.3em]"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
            placeholder={COPY.code}
            aria-label="Room code"
            autoCapitalize="characters"
          />
          <button className="btn btn-sky shrink-0" disabled={!nameOk || code.length !== 4}>
            {COPY.join}
          </button>
        </form>
      </div>
    </main>
  );
}
