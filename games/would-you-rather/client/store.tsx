import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { PublicRoomState, Reaction } from '../shared';
import { emit, getSocket } from './socket';
import { KEYS, load, remove, save, type Session } from './lib/storage';

export interface FloatingReaction {
  key: number;
  emoji: Reaction;
  fromPartner: boolean;
}

type Status = 'idle' | 'resuming' | 'in-room';

interface WyrStore {
  state: PublicRoomState | null;
  status: Status;
  connected: boolean;
  /** serverNow - Date.now(), to keep countdowns honest across devices. */
  clockOffset: number;
  partnerTyping: boolean;
  reactions: FloatingReaction[];
  toast: string | null;
  showToast: (msg: string) => void;
  createRoom: (name: string) => Promise<string | null>;
  joinRoom: (code: string, name: string) => Promise<boolean>;
  resume: (code: string) => Promise<boolean>;
  leave: () => Promise<void>;
  /** Fire an in-room action; shows a toast on failure. */
  act: (event: string, payload?: object) => Promise<boolean>;
}

const Ctx = createContext<WyrStore | null>(null);

export function WyrProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PublicRoomState | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [connected, setConnected] = useState(false);
  const [clockOffset, setClockOffset] = useState(0);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const session = useRef<Session | null>(null);
  const reactionKey = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    const s = getSocket();
    const onState = (next: PublicRoomState) => {
      setClockOffset(next.serverNow - Date.now());
      setState(next);
    };
    const onConnect = async () => {
      setConnected(true);
      // Re-attach after a dropped connection.
      const sess = session.current;
      if (sess) {
        const res = await emit('room:resume', { code: sess.code, token: sess.token });
        if (!res.ok) {
          session.current = null;
          remove(KEYS.session(sess.code), 'session');
          setState(null);
          setStatus('idle');
        }
      }
    };
    const onDisconnect = () => setConnected(false);
    const onTyping = ({ typing }: { typing: boolean }) => setPartnerTyping(typing);
    const onReaction = ({ emoji, fromPlayerId }: { emoji: Reaction; fromPlayerId: string; index: number }) => {
      const key = ++reactionKey.current;
      setReactions((r) => [...r.slice(-30), { key, emoji, fromPartner: fromPlayerId !== session.current?.playerId }]);
      setTimeout(() => setReactions((r) => r.filter((x) => x.key !== key)), 2600);
    };

    s.on('room:state', onState);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('partner:typing', onTyping);
    s.on('reaction', onReaction);
    if (s.connected) setConnected(true);
    return () => {
      s.off('room:state', onState);
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('partner:typing', onTyping);
      s.off('reaction', onReaction);
    };
  }, []);

  // Typing indicator should not linger across phases.
  useEffect(() => setPartnerTyping(false), [state?.phase, state?.index]);

  const remember = useCallback((sess: Session) => {
    session.current = sess;
    save(KEYS.session(sess.code), sess, 'session');
    setStatus('in-room');
  }, []);

  const createRoom = useCallback(
    async (name: string) => {
      const res = await emit<{ code: string; token: string; playerId: string }>('room:create', { name });
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
      const res = await emit<{ code: string; token: string; playerId: string }>('room:join', { code, name });
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
      const saved = load<Session | null>(KEYS.session(code), null, 'session');
      if (!saved) return false;
      setStatus('resuming');
      const res = await emit('room:resume', { code: saved.code, token: saved.token });
      if (!res.ok) {
        remove(KEYS.session(code), 'session');
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
    if (session.current) remove(KEYS.session(session.current.code), 'session');
    session.current = null;
    setState(null);
    setStatus('idle');
  }, []);

  const act = useCallback(
    async (event: string, payload: object = {}) => {
      const res = await emit(event, payload);
      if (!res.ok && res.code !== 'RATE_LIMITED') showToast(res.message);
      return res.ok;
    },
    [showToast],
  );

  const value = useMemo<WyrStore>(
    () => ({
      state,
      status,
      connected,
      clockOffset,
      partnerTyping,
      reactions,
      toast,
      showToast,
      createRoom,
      joinRoom,
      resume,
      leave,
      act,
    }),
    [state, status, connected, clockOffset, partnerTyping, reactions, toast, showToast, createRoom, joinRoom, resume, leave, act],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWyr(): WyrStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useWyr must be used inside WyrProvider');
  return v;
}

/** Convenience: me, partner, and the room — only call inside a room screen. */
export function useRoom() {
  const { state } = useWyr();
  const s = state!;
  const me = s.players.find((p) => p.id === s.you)!;
  const partner = s.players.find((p) => p.id !== s.you) ?? null;
  return { s, me, partner };
}
