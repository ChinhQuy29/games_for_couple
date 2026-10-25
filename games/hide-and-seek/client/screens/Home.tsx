import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LIMITS } from '../../shared';
import { useHns } from '../store';
import { KEYS, load, save } from '../lib/storage';
import { PropIcon } from '../components/PropArt';

export default function Home() {
  const { createRoom } = useHns();
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
    if (roomCode) navigate(`/hns/${roomCode}`);
  }

  function onJoin() {
    if (!nameOk || code.length !== 4) return;
    save(KEYS.name, name.trim());
    navigate(`/hns/${code}`, { state: { autoJoin: true } });
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-8 py-6 text-center">
      <header>
        <div className="mb-2 flex justify-center gap-1" aria-hidden>
          {(['lamp', 'cushion', 'plant', 'duck'] as const).map((t, i) => (
            <span key={t} className={i === 2 ? 'wobble' : ''}>
              <PropIcon type={t} size={56} />
            </span>
          ))}
        </div>
        <h1 className="font-display text-5xl font-extrabold leading-[0.95]">
          Hide and <span className="text-pink">Seek</span>
        </h1>
        <p className="mt-3 font-semibold text-ink-soft">
          One of you becomes a lamp. Or a cushion. Or a duck. The other gets 5 shots to find the fake. 🙈🔫
        </p>
        <p className="mt-1 text-sm text-ink-soft">Best on a laptop, with a mouse or trackpad.</p>
      </header>

      <div className="sticker w-full space-y-4 p-5 text-left">
        <label className="block">
          <span className="mb-1 block font-display font-bold">Your name</span>
          <input className="field" value={name} maxLength={LIMITS.nameMax} onChange={(e) => setName(e.target.value)} placeholder="e.g. TotallyALamp" autoComplete="nickname" />
        </label>
        <button className="btn btn-pink w-full" disabled={!nameOk || busy} onClick={onCreate}>
          {busy ? 'Creating…' : 'Create a room ✨'}
        </button>
        <div className="flex items-center gap-3 text-sm font-bold text-ink-soft">
          <div className="h-[3px] flex-1 rounded bg-muted" />
          or join your partner
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
            placeholder="ABCD"
            aria-label="Room code"
            autoCapitalize="characters"
          />
          <button className="btn btn-sky shrink-0" disabled={!nameOk || code.length !== 4}>
            Join
          </button>
        </form>
      </div>
    </main>
  );
}
