import { useEffect, useRef, useState } from 'react';
import { LIMITS, MODE_INFO } from '../../shared';
import { useFms, useRoom } from '../store';
import RoundHeader from '../components/RoundHeader';
import TimerBar from '../components/TimerBar';
import ModifierSticker from '../components/ModifierSticker';
import { useTyping } from '../components/useTyping';
import WaitingBlob from '../components/WaitingBlob';

const COPY = {
  title: (name: string) => `Finish ${name}'s sentence!`,
  placeholder: '…and that is why I am banned from IKEA.',
  send: 'Lock it in 🔒',
  words: (n: number) => `${n} word${n === 1 ? '' : 's'}`,
  blind: 'Your partner wrote something. Good luck. 🙈',
  waiting: (name: string) => `Waiting for ${name} to finish…`,
};

export default function FinishPhase() {
  const { act } = useFms();
  const { s, partner } = useRoom();
  const task = s.myTask;
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const { ping, stop } = useTyping();
  const input = useRef<HTMLTextAreaElement>(null);
  const mode = s.settings.mode;

  useEffect(() => input.current?.focus(), []);

  async function send(value = text) {
    const clean = value.trim();
    if (clean.length < LIMITS.endingMin || sending) return;
    setSending(true);
    stop();
    await act('ending:submit', { text: clean });
    setSending(false);
  }

  if (!task) return null;

  if (task.submitted) {
    return (
      <main className="flex flex-1 flex-col justify-center gap-4">
        <RoundHeader title="Locked in! 🔒" />
        <WaitingBlob
          label={s.partnerSubmitted ? 'Both done! Get ready…' : COPY.waiting(partner?.name ?? 'your partner')}
          sub="No take-backs 😈"
        />
        <TimerBar total={s.settings.timerSec} onExpire={() => {}} />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4">
      <RoundHeader title={COPY.title(partner?.name ?? 'your partner')} />
      <TimerBar total={s.settings.timerSec} onExpire={() => send()} />
      {task.modifier && <ModifierSticker modifier={task.modifier} />}

      {/* The speech bubble shows exactly what the server let us see. */}
      <div className="sticker relative -rotate-1 p-5">
        <span className="chip absolute -top-4 left-4 !min-h-0 !cursor-default !bg-sky !py-0 text-sm text-on-accent">
          {MODE_INFO[mode].emoji} {MODE_INFO[mode].label} · {COPY.words(task.wordCount)}
        </span>
        {mode === 'classic' && <p className="font-display text-2xl font-bold">{task.starterVisible}</p>}
        {mode === 'peek' && (
          <p className="font-display text-2xl font-bold leading-relaxed">
            {Array.from({ length: Math.max(0, task.wordCount - 2) }, (_, i) => (
              <span
                key={i}
                className="mr-2 inline-block h-5 rounded-full bg-ink align-middle opacity-80"
                style={{ width: `${2.2 + ((i * 7) % 4) * 0.6}rem` }}
                aria-hidden
              />
            ))}
            <span className="text-pink">{task.starterVisible.replace(/^…\s*/, '')}</span>…
          </p>
        )}
        {mode === 'blind' && (
          <div>
            <p className="jiggle font-display text-4xl font-extrabold tracking-widest text-ink-soft">??? ?? ?????…</p>
            <p className="mt-1 font-semibold text-ink-soft">{COPY.blind}</p>
          </div>
        )}
      </div>

      <form
        className="flex flex-1 flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          ref={input}
          className="field min-h-32 resize-none font-display !text-2xl !font-bold"
          value={text}
          maxLength={LIMITS.endingMax}
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
        {text.length >= 100 && (
          <p className="text-right text-sm font-bold text-ink-soft">
            {text.length}/{LIMITS.endingMax}
          </p>
        )}
        <div className="action-bar mt-auto">
          <button className="btn btn-pink w-full" disabled={!text.trim() || sending}>
            {COPY.send}
          </button>
        </div>
      </form>
    </main>
  );
}
