// Client side of the kit. createGameClient() gives a game its own socket, store and
// ready-made pieces (app shell, home, join gate, lobby shell, avatars, timer…), so a
// game only writes its settings panel and phase screens.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { io, type Socket } from 'socket.io-client';
import { LIMITS, type Ack, type PublicBase } from '../shared';

// ---------- storage (never let blocked storage break a game) ----------

function load<T>(area: Storage | null, key: string, fallback: T): T {
  try {
    const raw = area?.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}
function store(area: Storage | null, key: string, value: unknown) {
  try {
    area?.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
function unstore(area: Storage | null, key: string) {
  try {
    area?.removeItem(key);
  } catch {
    /* ignore */
  }
}
const local = () => (typeof localStorage === 'undefined' ? null : localStorage);
const session = () => (typeof sessionStorage === 'undefined' ? null : sessionStorage);

interface Session {
  code: string;
  token: string;
  playerId: string;
}

type Status = 'idle' | 'resuming' | 'in-room';

export type ActResult<T> = ({ ok: true } & T) | { ok: false };

export interface GameStore<S extends PublicBase> {
  state: S | null;
  status: Status;
  connected: boolean;
  clockOffset: number;
  toast: string | null;
  showToast: (msg: string) => void;
  createRoom: (name: string) => Promise<string | null>;
  joinRoom: (code: string, name: string) => Promise<boolean>;
  resume: (code: string) => Promise<boolean>;
  leave: () => Promise<void>;
  act: <T extends object = object>(event: string, payload?: object) => Promise<ActResult<T>>;
  /** Fire-and-forget event (no toast, no ack), for high-frequency input. */
  send: (event: string, payload?: object) => void;
  socket: Socket;
}

const ANIMALS = ['🐸', '🦆', '🐙', '🦄', '🐼', '🦊', '🐧', '🐨', '🦖', '🐝', '🦥', '🐹'];
function hashIndex(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % ANIMALS.length;
}
/** A stable animal per player; the second player gets the next one if they'd collide. */
export function avatarFor(id: string, playerIds: string[] = []): string {
  let i = hashIndex(id);
  const [first, second] = playerIds;
  if (id === second && first && hashIndex(first) === i) i = (i + 1) % ANIMALS.length;
  return ANIMALS[i]!;
}

/** The two player colors used across kit games (player 1, player 2). */
export const PLAYER_COLORS = ['#ff4f8b', '#4cc9f0'] as const;

export function WaitingBlob({ label, sub }: { label: string; sub?: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <motion.svg
        width="110"
        height="100"
        viewBox="0 0 110 100"
        animate={reduce ? undefined : { y: [0, -18, 0], scaleX: [1, 0.92, 1.08, 1], scaleY: [1, 1.08, 0.9, 1] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      >
        <path d="M55 8c26 0 47 18 47 46 0 26-20 40-47 40S8 80 8 54C8 26 29 8 55 8z" fill="var(--pink)" stroke="var(--line)" strokeWidth="4" />
        <g className="blink">
          <ellipse cx="40" cy="48" rx="6" ry="9" fill="var(--line)" />
          <ellipse cx="70" cy="48" rx="6" ry="9" fill="var(--line)" />
        </g>
        <path d="M44 68q11 9 22 0" stroke="var(--line)" strokeWidth="4" fill="none" strokeLinecap="round" />
      </motion.svg>
      <p className="font-display text-2xl font-extrabold">{label}</p>
      {sub && <p className="font-semibold opacity-80">{sub}</p>}
    </div>
  );
}

export interface HomeProps {
  title: ReactNode;
  emoji: ReactNode;
  subtitle: ReactNode;
  note?: ReactNode;
}

export interface AppShellProps {
  home: HomeProps;
  phases: Record<string, ComponentType>;
  /** Wide layout (laptop-first games). */
  wide?: boolean;
}

export interface LobbyShellProps {
  settings?: ReactNode;
  howTo?: ReactNode;
  startLabel?: string;
}

export function createGameClient<S extends PublicBase>(opts: { ns: string; key: string; basePath: string }) {
  const { ns, key, basePath } = opts;
  const NAME_KEY = `${key}.name.v1`;
  const sessionKey = (code: string) => `${key}.session.${code}.v1`;

  let socket: Socket | null = null;
  const getSocket = () => (socket ??= io(ns, { transports: ['websocket', 'polling'] }));

  async function emit<T extends object = object>(event: string, payload: object = {}): Promise<Ack<T>> {
    try {
      return (await getSocket().timeout(6000).emitWithAck(event, payload)) as Ack<T>;
    } catch {
      return { ok: false, code: 'BAD_INPUT', message: 'Connection hiccup — try again 📡' };
    }
  }

  const Ctx = createContext<GameStore<S> | null>(null);

  function Provider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<S | null>(null);
    const [status, setStatus] = useState<Status>('idle');
    const [connected, setConnected] = useState(false);
    const [clockOffset, setClockOffset] = useState(0);
    const [toast, setToast] = useState<string | null>(null);
    const sess = useRef<Session | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout>>();

    const showToast = useCallback((msg: string) => {
      setToast(msg);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 3200);
    }, []);

    useEffect(() => {
      const s = getSocket();
      const onState = (next: S) => {
        setClockOffset(next.serverNow - Date.now());
        setState(next);
      };
      const onConnect = async () => {
        setConnected(true);
        const cur = sess.current;
        if (cur) {
          const res = await emit('room:resume', { code: cur.code, token: cur.token });
          if (!res.ok) {
            sess.current = null;
            unstore(session(), sessionKey(cur.code));
            setState(null);
            setStatus('idle');
          }
        }
      };
      const onDisconnect = () => setConnected(false);
      s.on('room:state', onState);
      s.on('connect', onConnect);
      s.on('disconnect', onDisconnect);
      if (s.connected) setConnected(true);
      return () => {
        s.off('room:state', onState);
        s.off('connect', onConnect);
        s.off('disconnect', onDisconnect);
      };
    }, []);

    const remember = useCallback((x: Session) => {
      sess.current = x;
      store(session(), sessionKey(x.code), x);
      setStatus('in-room');
    }, []);

    const createRoom = useCallback(
      async (name: string) => {
        const res = await emit<Session>('room:create', { name });
        if (!res.ok) {
          showToast(res.message);
          return null;
        }
        remember({ code: res.code, token: res.token, playerId: res.playerId });
        return res.code;
      },
      [remember, showToast],
    );

    const joinRoom = useCallback(
      async (code: string, name: string) => {
        const res = await emit<Session>('room:join', { code, name });
        if (!res.ok) {
          showToast(res.message);
          return false;
        }
        remember({ code: res.code, token: res.token, playerId: res.playerId });
        return true;
      },
      [remember, showToast],
    );

    const resume = useCallback(
      async (code: string) => {
        const saved = load<Session | null>(session(), sessionKey(code), null);
        if (!saved) return false;
        setStatus('resuming');
        const res = await emit('room:resume', { code: saved.code, token: saved.token });
        if (!res.ok) {
          unstore(session(), sessionKey(code));
          setStatus('idle');
          return false;
        }
        remember(saved);
        return true;
      },
      [remember],
    );

    const leave = useCallback(async () => {
      await emit('room:leave');
      if (sess.current) unstore(session(), sessionKey(sess.current.code));
      sess.current = null;
      setState(null);
      setStatus('idle');
    }, []);

    const act = useCallback(
      async <T extends object = object>(event: string, payload: object = {}) => {
        const res = await emit<T>(event, payload);
        if (!res.ok) showToast(res.message);
        return res as ActResult<T>;
      },
      [showToast],
    ) as GameStore<S>['act'];

    const send = useCallback((event: string, payload: object = {}) => void getSocket().emit(event, payload), []);

    const value = useMemo<GameStore<S>>(
      () => ({ state, status, connected, clockOffset, toast, showToast, createRoom, joinRoom, resume, leave, act, send, socket: getSocket() }),
      [state, status, connected, clockOffset, toast, showToast, createRoom, joinRoom, resume, leave, act, send],
    );
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
  }

  function useGame(): GameStore<S> {
    const v = useContext(Ctx);
    if (!v) throw new Error(`useGame (${ns}) must be used inside its Provider`);
    return v;
  }

  /** Calls `handler` for every 'frame' from the server's loop (real-time games). Not React state: render from a ref. */
  function useFrame<F>(handler: (frame: F) => void) {
    const { socket } = useGame();
    const h = useRef(handler);
    h.current = handler;
    useEffect(() => {
      const fn = (f: F) => h.current(f);
      socket.on('frame', fn);
      return () => {
        socket.off('frame', fn);
      };
    }, [socket]);
  }

  /** me, partner and the room — only inside a room screen. */
  function useRoom() {
    const { state } = useGame();
    const s = state!;
    const me = s.players.find((p) => p.id === s.you)!;
    const partner = s.players.find((p) => p.id !== s.you) ?? null;
    /** 0 for the first player, 1 for the second: indexes PLAYER_COLORS. */
    const seat = (id: string) => Math.max(0, s.players.findIndex((p) => p.id === id));
    return { s, me, partner, seat };
  }

  function Avatar({ id, size = 'text-3xl' }: { id: string; size?: string }) {
    const { state } = useGame();
    return (
      <span className={`${size} inline-block`} aria-hidden>
        {avatarFor(id, state?.players.map((p) => p.id))}
      </span>
    );
  }

  /** Countdown to the current state's deadline. */
  function TimerBar({ total }: { total: number }) {
    const { state, clockOffset } = useGame();
    const deadline = state?.deadline ?? null;
    const [now, setNow] = useState(() => Date.now() + clockOffset);
    useEffect(() => {
      if (deadline === null) return;
      const id = setInterval(() => setNow(Date.now() + clockOffset), 200);
      return () => clearInterval(id);
    }, [deadline, clockOffset]);
    if (deadline === null) return null;
    const left = Math.max(0, deadline - now);
    const secs = Math.ceil(left / 1000);
    const pct = Math.min(100, (left / (total * 1000)) * 100);
    const urgent = secs <= 10;
    return (
      <div className={`flex items-center gap-3 ${urgent ? 'jiggle' : ''}`} aria-label={`${secs} seconds left`}>
        <div className="h-5 flex-1 overflow-hidden rounded-full border-[3px] border-line bg-card">
          <div className={`h-full transition-[width] duration-200 ease-linear ${urgent ? 'bg-pink' : 'bg-mint'}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`w-12 text-right font-display text-xl font-extrabold ${urgent ? 'text-pink' : ''}`}>{secs}s</span>
      </div>
    );
  }

  /** Both players with their score, leader highlighted. */
  function Scores({ scores, extra }: { scores: Record<string, number>; extra?: (id: string) => ReactNode }) {
    const { s } = useRoom();
    const top = Math.max(0, ...s.players.map((p) => scores[p.id] ?? 0));
    return (
      <div className="grid grid-cols-2 gap-3">
        {s.players.map((p, i) => {
          const score = scores[p.id] ?? 0;
          return (
            <div key={p.id} className={`sticker flex items-center gap-2 px-3 py-2 ${score === top && score > 0 ? '!bg-yellow text-on-accent' : ''}`}>
              <span className="h-4 w-4 shrink-0 rounded-full border-2 border-line" style={{ background: PLAYER_COLORS[i] }} />
              <Avatar id={p.id} size="text-2xl" />
              <span className="min-w-0 flex-1 truncate font-display font-extrabold">
                {p.name}
                {p.id === s.you ? ' (you)' : ''}
              </span>
              {extra?.(p.id)}
              <span className="font-display text-xl font-extrabold">{score}</span>
            </div>
          );
        })}
      </div>
    );
  }

  function Toast() {
    const { toast } = useGame();
    if (!toast) return null;
    return (
      <div role="status" className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        <div className="sticker bg-yellow px-5 py-3 font-display text-lg font-bold text-on-accent">{toast}</div>
      </div>
    );
  }

  function TopBar() {
    const { connected, state } = useGame();
    return (
      <div className="mb-3 flex items-center justify-between">
        <Link to="/" className="font-display text-lg font-extrabold text-ink-soft hover:text-pink">
          ← 💞 Games
        </Link>
        <div className="flex items-center gap-2 text-sm font-bold text-ink-soft">
          {state && <span className="chip !min-h-0 !cursor-default !py-0">Room {state.code}</span>}
          <span aria-label={connected ? 'Connected' : 'Reconnecting'}>{connected ? '🟢' : '🟠'}</span>
        </div>
      </div>
    );
  }

  function Home({ title, emoji, subtitle, note }: HomeProps) {
    const { createRoom } = useGame();
    const navigate = useNavigate();
    const [name, setName] = useState(() => load(local(), NAME_KEY, ''));
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const nameOk = name.trim().length >= LIMITS.nameMin;
    async function onCreate() {
      if (!nameOk) return;
      setBusy(true);
      store(local(), NAME_KEY, name.trim());
      const roomCode = await createRoom(name.trim());
      setBusy(false);
      if (roomCode) navigate(`${basePath}/${roomCode}`);
    }
    function onJoin() {
      if (!nameOk || code.length !== 4) return;
      store(local(), NAME_KEY, name.trim());
      navigate(`${basePath}/${code}`, { state: { autoJoin: true } });
    }
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-8 py-6 text-center">
        <header>
          <div className="wobble mb-1 inline-block text-6xl" aria-hidden>
            {emoji}
          </div>
          <h1 className="font-display text-5xl font-extrabold leading-[0.95]">{title}</h1>
          <p className="mt-3 font-semibold text-ink-soft">{subtitle}</p>
          {note && <p className="mt-1 text-sm text-ink-soft">{note}</p>}
        </header>
        <div className="sticker w-full space-y-4 p-5 text-left">
          <label className="block">
            <span className="mb-1 block font-display font-bold">Your name</span>
            <input className="field" value={name} maxLength={LIMITS.nameMax} onChange={(e) => setName(e.target.value)} autoComplete="nickname" />
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
            />
            <button className="btn btn-sky shrink-0" disabled={!nameOk || code.length !== 4}>
              Join
            </button>
          </form>
        </div>
      </main>
    );
  }

  function RoomGate({ phases }: { phases: Record<string, ComponentType> }) {
    const code = (useParams().code ?? '').toUpperCase();
    const location = useLocation();
    const navigate = useNavigate();
    const { state, status, resume, joinRoom } = useGame();
    const [checked, setChecked] = useState(false);
    const [name, setName] = useState(() => load(local(), NAME_KEY, ''));
    const [busy, setBusy] = useState(false);
    const tried = useRef(false);

    useEffect(() => {
      if (tried.current) return;
      tried.current = true;
      void (async () => {
        if (state?.code === code) return setChecked(true);
        if (await resume(code)) return setChecked(true);
        const autoJoin = (location.state as { autoJoin?: boolean } | null)?.autoJoin;
        const saved = load(local(), NAME_KEY, '').trim();
        if (autoJoin && saved) {
          const ok = await joinRoom(code, saved);
          if (!ok) navigate(basePath, { replace: true });
        }
        setChecked(true);
      })();
    }, [code, state?.code, resume, joinRoom, location.state, navigate]);

    if (state && state.code === code) {
      const Phase = phases[state.phase];
      return Phase ? <Phase /> : <p className="mt-20 text-center font-display text-2xl">Loading…</p>;
    }
    if (!checked || status === 'resuming') return <p className="mt-20 text-center font-display text-2xl font-bold">Finding your room… 🔍</p>;

    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 text-center">
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
            store(local(), NAME_KEY, name.trim());
            await joinRoom(code, name.trim());
            setBusy(false);
          }}
        >
          <label className="block">
            <span className="mb-1 block font-display font-bold">Your name</span>
            <input className="field" value={name} maxLength={LIMITS.nameMax} onChange={(e) => setName(e.target.value)} autoFocus />
          </label>
          <button className="btn btn-pink w-full" disabled={!name.trim() || busy}>
            {busy ? 'Joining…' : 'Join the fun 💞'}
          </button>
        </form>
      </main>
    );
  }

  /** Room code, both seats, an optional settings panel, and the start button. */
  function LobbyShell({ settings, howTo, startLabel = "Let's go! 🚀" }: LobbyShellProps) {
    const { act, leave, showToast } = useGame();
    const { s, me, partner } = useRoom();
    const navigate = useNavigate();
    const link = `${window.location.origin}${basePath}/${s.code}`;
    const host = s.players.find((p) => p.isHost);
    const ready = s.players.length === 2 && s.players.every((p) => p.connected);
    async function copyLink() {
      try {
        await navigator.clipboard.writeText(link);
        showToast('Link copied! Go send it 💌');
      } catch {
        showToast(link);
      }
    }
    return (
      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-5 lg:grid-cols-2">
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
          {howTo && <section className="sticker space-y-2 p-5 text-sm font-semibold">{howTo}</section>}
        </div>
        <div className="flex flex-col gap-5">
          {settings && (
            <section className="sticker space-y-4 p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-2xl font-extrabold">Settings</h2>
                {!me.isHost && host && <span className="text-sm font-bold text-ink-soft">{host.name} is picking the settings</span>}
              </div>
              {settings}
            </section>
          )}
          <div className="action-bar mt-auto flex gap-3">
            <button
              className="btn btn-ghost !text-base"
              onClick={async () => {
                await leave();
                navigate(basePath);
              }}
            >
              Leave
            </button>
            {me.isHost ? (
              <button className="btn btn-pink flex-1" disabled={!ready} onClick={() => act('game:start')}>
                {ready ? startLabel : partner ? `${partner.name} is offline…` : 'Waiting for your partner…'}
              </button>
            ) : (
              <div className="sticker flex flex-1 items-center justify-center px-4 font-display font-bold">Waiting for {host?.name} to start…</div>
            )}
          </div>
        </div>
      </main>
    );
  }

  /** A labelled row of choice chips for a settings panel (host-only editing). */
  function Choice<T extends string | number | boolean | null>({
    label,
    value,
    options,
    onPick,
    render = (v) => String(v),
  }: {
    label: string;
    value: T;
    options: readonly T[];
    onPick: (v: T) => void;
    render?: (v: T) => ReactNode;
  }) {
    const { me } = useRoom();
    return (
      <div>
        <p className="mb-2 font-display font-bold">{label}</p>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <button key={String(o)} className="chip" aria-pressed={value === o} disabled={!me.isHost} onClick={() => onPick(o)}>
              {render(o)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  /** "Who goes first?" for role games. `role` names the first role, e.g. "defuses first". */
  function FirstChoice({ label }: { label: string }) {
    const { act, state } = useGame();
    const s = state!;
    const host = s.players.find((p) => p.isHost);
    const guest = s.players.find((p) => !p.isHost);
    const name = (p: typeof host, fallback: string) => (p ? (p.id === s.you ? `${p.name} (you)` : p.name) : fallback);
    return (
      <Choice
        label={label}
        value={s.first ?? 'random'}
        options={['random', 'host', 'guest'] as const}
        onPick={(first) => void act('settings:first', { first })}
        render={(f) => (f === 'random' ? '🎲 Random' : f === 'host' ? `👑 ${name(host, 'Host')}` : `💞 ${name(guest, 'Partner')}`)}
      />
    );
  }

  /** Rematch / leave buttons for a recap screen. */
  function RecapActions() {
    const { act, leave } = useGame();
    const navigate = useNavigate();
    return (
      <div className="action-bar flex gap-3">
        <button
          className="btn btn-ghost"
          onClick={async () => {
            await leave();
            navigate(basePath);
          }}
        >
          🏠 Leave
        </button>
        <button className="btn btn-pink flex-1" onClick={() => act('game:rematch')}>
          🔁 Rematch
        </button>
      </div>
    );
  }

  function AppShell({ home, phases, wide }: AppShellProps) {
    return (
      <Provider>
        <div className={`mx-auto flex min-h-dvh flex-col px-4 pb-6 pt-3 ${wide ? 'max-w-6xl' : 'max-w-3xl'}`}>
          <TopBar />
          <Routes>
            <Route index element={<Home {...home} />} />
            <Route path=":code" element={<RoomGate phases={phases} />} />
          </Routes>
          <Toast />
        </div>
      </Provider>
    );
  }

  return { AppShell, useGame, useRoom, useFrame, FirstChoice, Avatar, TimerBar, Scores, LobbyShell, Choice, RecapActions, WaitingBlob };
}
