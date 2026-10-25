import { useEffect, useRef, useState } from 'react';
import { LIMITS } from '../../shared';
import { useFms, useRoom } from '../store';
import RoundHeader from '../components/RoundHeader';
import TimerBar from '../components/TimerBar';
import { useTyping } from '../components/useTyping';
import WaitingBlob from '../components/WaitingBlob';

const COPY = {
  title: (name: string) => `Start a sentence for ${name}…`,
  placeholder: 'The real reason I fell for you is…',
  deal: '🎲 Deal me one',
  reroll: (n: number) => `🎲 Re-roll (${n} left)`,
  noRerolls: '🎲 No re-rolls left',
  send: 'Send it ✈️',
  waiting: (name: string) => `Waiting for ${name}…`,
  waitingSub: 'They are cooking something up 👀',
};

export default function StartPhase() {
  const { act } = useFms();
  const { s, partner } = useRoom();
  const mine = s.myStarter;
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const { ping, stop } = useTyping();
  const lastDealt = useRef<string | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  // When a deck starter arrives, drop it into the box (still editable).
  useEffect(() => {
    if (mine?.dealt && mine.dealt !== lastDealt.current) {
      lastDealt.current = mine.dealt;
      setText(mine.dealt);
    }
  }, [mine?.dealt]);

  useEffect(() => input.current?.focus(), []);

  async function send(value = text) {
    const clean = value.trim();
    if (clean.length < LIMITS.starterMin || sending) return;
    setSending(true);
    stop();
    await act('starter:submit', { text: clean, fromDeck: clean === mine?.dealt });
    setSending(false);
  }

  if (mine?.submitted) {
    return (
      <main className="flex flex-1 flex-col justify-center gap-4">
        <RoundHeader title="Sent! 📮" />
        <div className="sticker rotate-1 p-5 text-center font-display text-2xl font-bold">“{mine.text}”</div>
        {s.partnerSubmitted ? (
          <WaitingBlob label="Both in! Shuffling…" />
        ) : (
          <WaitingBlob label={COPY.waiting(partner?.name ?? 'your partner')} sub={COPY.waitingSub} />
        )}
        <TimerBar total={s.settings.timerSec} onExpire={() => {}} />
      </main>
    );
  }

  const dealLabel = !mine?.dealt ? COPY.deal : mine.rerollsLeft > 0 ? COPY.reroll(mine.rerollsLeft) : COPY.noRerolls;

  return (
    <main className="flex flex-1 flex-col gap-4">
      <RoundHeader title={COPY.title(partner?.name ?? 'your partner')} />
      <TimerBar total={s.settings.timerSec} onExpire={() => send()} />

      <form
        className="flex flex-1 flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          ref={input}
          className="field min-h-36 resize-none font-display !text-2xl !font-bold"
          value={text}
          maxLength={LIMITS.starterMax}
          placeholder={COPY.placeholder}
          onChange={(e) => {
            setText(e.target.value.replace(/\n/g, ' '));
            ping();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void send();
            }
          }}
        />
        <div className="flex justify-between text-sm font-bold text-ink-soft">
          <span>Tip: stop mid-sentence for maximum chaos…</span>
          {text.length >= 100 && <span>{text.length}/{LIMITS.starterMax}</span>}
        </div>

        <div className="action-bar mt-auto flex gap-3">
          <button
            type="button"
            className="btn btn-sky !text-base"
            disabled={!!mine?.dealt && mine.rerollsLeft <= 0}
            onClick={() => act('starter:deal')}
          >
            {dealLabel}
          </button>
          <button className="btn btn-pink flex-1" disabled={text.trim().length < LIMITS.starterMin || sending}>
            {COPY.send}
          </button>
        </div>
      </form>
    </main>
  );
}
