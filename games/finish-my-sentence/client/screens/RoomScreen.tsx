import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { LIMITS } from '../../shared';
import { useFms } from '../store';
import { KEYS, load, save } from '../lib/storage';
import ReactionLayer from '../components/ReactionLayer';
import Lobby from './Lobby';
import StartPhase from './StartPhase';
import FinishPhase from './FinishPhase';
import Reveal from './Reveal';
import Recap from './Recap';

/** /fms/:code — resumes a saved session, or asks for a name and joins. */
export default function RoomScreen() {
  const code = (useParams().code ?? '').toUpperCase();
  const location = useLocation();
  const navigate = useNavigate();
  const { state, status, resume, joinRoom } = useFms();
  const [checked, setChecked] = useState(false);
  const [name, setName] = useState(() => load(KEYS.name, ''));
  const [busy, setBusy] = useState(false);
  const tried = useRef(false);

  useEffect(() => {
    if (tried.current) return;
    tried.current = true;
    void (async () => {
      if (state?.code === code) return setChecked(true);
      if (await resume(code)) return setChecked(true);
      const autoJoin = (location.state as { autoJoin?: boolean } | null)?.autoJoin;
      const saved = load(KEYS.name, '').trim();
      if (autoJoin && saved) {
        const ok = await joinRoom(code, saved);
        if (!ok) navigate('/fms', { replace: true });
      }
      setChecked(true);
    })();
  }, [code, state?.code, resume, joinRoom, location.state, navigate]);

  if (state && state.code === code) {
    return (
      <>
        <PhaseView />
        <ReactionLayer />
      </>
    );
  }

  if (!checked || status === 'resuming') {
    return <p className="mt-20 text-center font-display text-2xl font-bold">Finding your room… 🔍</p>;
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <div className="wobble text-6xl">💌</div>
      <h1 className="font-display text-4xl font-extrabold">
        You're invited to room <span className="text-pink">{code}</span>
      </h1>
      <form
        className="sticker w-full space-y-4 p-5 text-left"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setBusy(true);
          save(KEYS.name, name.trim());
          await joinRoom(code, name.trim());
          setBusy(false);
        }}
      >
        <label className="block">
          <span className="mb-1 block font-display font-bold">Your name</span>
          <input
            className="field"
            value={name}
            maxLength={LIMITS.nameMax}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            autoComplete="nickname"
          />
        </label>
        <button className="btn btn-pink w-full" disabled={!name.trim() || busy}>
          {busy ? 'Joining…' : 'Join the fun 💞'}
        </button>
      </form>
    </main>
  );
}

function PhaseView() {
  const { state } = useFms();
  switch (state!.phase) {
    case 'LOBBY':
      return <Lobby />;
    case 'START':
      return <StartPhase />;
    case 'FINISH':
      return <FinishPhase />;
    case 'REVEAL':
      return <Reveal />;
    case 'RECAP':
      return <Recap />;
  }
}
