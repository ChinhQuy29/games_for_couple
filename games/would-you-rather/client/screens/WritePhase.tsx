import { useState } from 'react';
import { LIMITS, TIMING } from '../../shared';
import { useWyr, useRoom } from '../store';
import RoundHeader from '../components/RoundHeader';
import TimerBar from '../components/TimerBar';
import WaitingBlob from '../components/WaitingBlob';
import { useTyping } from '../components/useTyping';

const COPY = {
  title: 'Your turn to be evil 😈',
  sub: (name: string) => `Write a question for you and ${name}. Make both sides hard.`,
  a: 'Would you rather…',
  b: '…or…',
  phA: 'eat a spoonful of mayo every morning',
  phB: 'never eat mayo again, even by accident',
  send: 'Ask it! 😈',
  waiting: (name: string) => `${name} is writing an evil question…`,
  waitingSub: 'Brace yourself.',
};

export default function WritePhase() {
  const { act } = useWyr();
  const { s, me, partner } = useRoom();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [sending, setSending] = useState(false);
  const { ping, stop } = useTyping();
  const writer = s.players.find((p) => p.id === s.writerId);
  const ok = a.trim().length >= LIMITS.optionMin && b.trim().length >= LIMITS.optionMin;

  async function send() {
    if (!ok || sending) return;
    setSending(true);
    stop();
    await act('question:write', { a, b });
    setSending(false);
  }

  if (s.writerId !== me.id) {
    return (
      <main className="flex flex-1 flex-col justify-center gap-4">
        <RoundHeader title="Plot twist ✍️" />
        <WaitingBlob label={COPY.waiting(writer?.name ?? 'Your partner')} sub={COPY.waitingSub} />
        <TimerBar total={TIMING.writeSec} onExpire={() => {}} />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4">
      <RoundHeader title={COPY.title} />
      <TimerBar total={TIMING.writeSec} onExpire={send} />
      <p className="text-center font-semibold text-ink-soft">{COPY.sub(partner?.name ?? 'your partner')}</p>
      <form
        className="flex flex-1 flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label className="block">
          <span className="mb-1 block font-display font-bold">{COPY.a}</span>
          <input
            className="field font-display !text-xl !font-bold"
            value={a}
            maxLength={LIMITS.optionMax}
            placeholder={COPY.phA}
            onChange={(e) => {
              setA(e.target.value);
              ping();
            }}
            autoFocus
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-display font-bold">{COPY.b}</span>
          <input
            className="field font-display !text-xl !font-bold"
            value={b}
            maxLength={LIMITS.optionMax}
            placeholder={COPY.phB}
            onChange={(e) => {
              setB(e.target.value);
              ping();
            }}
          />
        </label>
        <div className="action-bar mt-auto">
          <button className="btn btn-pink w-full" disabled={!ok || sending}>
            {COPY.send}
          </button>
        </div>
      </form>
    </main>
  );
}
