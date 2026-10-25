import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { LIMITS } from '../../shared';
import { useAog } from '../store';
import { KEYS, load, save } from '../lib/storage';
import { useCopy } from '../lib/i18n';

const COPY = {
  vi: { finding: 'Đang tìm phòng… 🔍', invited: 'Bạn được mời vào phòng', name: 'Tên của bạn', joining: 'Đang vào…', join: 'Vào chơi 💞' },
  en: { finding: 'Finding your room… 🔍', invited: "You're invited to room", name: 'Your name', joining: 'Joining…', join: 'Join the fun 💞' },
};
import Lobby from './Lobby';
import QuestionPhase from './QuestionPhase';
import RevealPhase from './RevealPhase';
import Recap from './Recap';

/** /aog/:code — resumes a saved session, or asks for a name and joins. */
export default function RoomScreen() {
  const code = (useParams().code ?? '').toUpperCase();
  const location = useLocation();
  const navigate = useNavigate();
  const { state, status, resume, joinRoom } = useAog();
  const [checked, setChecked] = useState(false);
  const [name, setName] = useState(() => load(KEYS.name, ''));
  const [busy, setBusy] = useState(false);
  const c = useCopy(COPY);
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
        if (!ok) navigate('/aog', { replace: true });
      }
      setChecked(true);
    })();
  }, [code, state?.code, resume, joinRoom, location.state, navigate]);

  if (state && state.code === code) {
    return <PhaseView />;
  }

  if (!checked || status === 'resuming') {
    return <p className="mt-20 text-center font-display text-2xl font-bold">{c.finding}</p>;
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <div className="wobble text-6xl">💌</div>
      <h1 className="font-display text-4xl font-extrabold">
        {c.invited} <span className="text-pink">{code}</span>
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
          <span className="mb-1 block font-display font-bold">{c.name}</span>
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
          {busy ? c.joining : c.join}
        </button>
      </form>
    </main>
  );
}

function PhaseView() {
  const { state } = useAog();
  switch (state!.phase) {
    case 'LOBBY':
      return <Lobby />;
    case 'QUESTION':
      return <QuestionPhase />;
    case 'REVEAL':
      return <RevealPhase />;
    case 'RECAP':
      return <Recap />;
  }
}
