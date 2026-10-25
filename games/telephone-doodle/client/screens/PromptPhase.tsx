import { useState } from 'react';
import { LIMITS, TIMING } from '../../shared';
import { useDoodle, useRoom } from '../store';
import RoundHeader from '../components/RoundHeader';
import TimerBar from '../components/TimerBar';
import WaitingBlob from '../components/WaitingBlob';

const COPY = {
  title: 'Pick something to draw',
  sub: 'You draw it first. Your partner never sees the words.',
  reroll: (n: number) => `🎲 Re-roll (${n})`,
  noRerolls: '🎲 No re-rolls left',
  useIt: 'Draw this! 🖍️',
  own: '✏️ Write my own instead',
  back: '🎲 Back to the deck',
  placeholder: 'e.g. my mom fighting a goose',
  send: 'Draw mine! 🖍️',
  waiting: (name: string) => `Waiting for ${name} to pick…`,
};

export default function PromptPhase() {
  const { act } = useDoodle();
  const { s, partner } = useRoom();
  const mine = s.myPrompt;
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  async function send(value: string, fromDeck: boolean) {
    if (value.trim().length < LIMITS.promptMin || sending) return;
    setSending(true);
    await act('prompt:submit', { text: value.trim(), fromDeck });
    setSending(false);
  }

  const onExpire = () => (writing && text.trim().length >= LIMITS.promptMin ? send(text, false) : send(mine?.dealt ?? '', true));

  if (!mine) return null;

  if (mine.submitted) {
    return (
      <main className="flex flex-1 flex-col justify-center gap-4">
        <RoundHeader title="Locked in! 🔒" />
        <div className="sticker rotate-1 p-5 text-center font-display text-2xl font-bold">“{mine.text}”</div>
        <WaitingBlob label={s.partnerSubmitted ? 'Both ready! Grab a pen…' : COPY.waiting(partner?.name ?? 'your partner')} />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4">
      <RoundHeader title={COPY.title} />
      <TimerBar total={TIMING.promptSec} onExpire={onExpire} />
      <p className="text-center font-semibold text-ink-soft">{COPY.sub}</p>

      {writing ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void send(text, false);
          }}
        >
          <input
            className="field font-display !text-2xl !font-bold"
            value={text}
            maxLength={LIMITS.promptMax}
            placeholder={COPY.placeholder}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <div className="action-bar mt-auto flex gap-3">
            <button type="button" className="btn btn-ghost !text-base" onClick={() => setWriting(false)}>
              {COPY.back}
            </button>
            <button className="btn btn-pink flex-1" disabled={text.trim().length < LIMITS.promptMin || sending}>
              {COPY.send}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="sticker -rotate-1 !bg-sky p-6 text-center font-display text-3xl font-extrabold text-on-accent">
            {mine.dealt}
          </div>
          <button className="chip self-center" onClick={() => setWriting(true)}>
            {COPY.own}
          </button>
          <div className="action-bar mt-auto flex gap-3">
            <button className="btn btn-sky !text-base" disabled={mine.rerollsLeft <= 0} onClick={() => act('prompt:reroll')}>
              {mine.rerollsLeft > 0 ? COPY.reroll(mine.rerollsLeft) : COPY.noRerolls}
            </button>
            <button className="btn btn-pink flex-1" disabled={sending} onClick={() => send(mine.dealt, true)}>
              {COPY.useIt}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
