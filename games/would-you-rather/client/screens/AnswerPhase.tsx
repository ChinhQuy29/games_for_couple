import { useRef, useState } from 'react';
import type { Choice } from '../../shared';
import { useWyr, useRoom } from '../store';
import Options from '../components/Options';
import RoundHeader from '../components/RoundHeader';
import TimerBar from '../components/TimerBar';
import WaitingBlob from '../components/WaitingBlob';

const COPY = {
  title: 'Would you rather…',
  predict: (name: string) => `And what will ${name} pick?`,
  lock: 'Lock it in 🔒',
  pickFirst: 'Pick one first ☝️',
  predictFirst: 'Now guess their pick 👇',
  waiting: (name: string) => `Waiting for ${name} to decide…`,
  waitingSub: 'No peeking at their face on camera 👀',
  written: (name: string) => `✍️ Written by ${name}`,
};

export default function AnswerPhase() {
  const { s } = useRoom();
  // Fresh choices for every question.
  return <AnswerTask key={s.index} />;
}

function AnswerTask() {
  const { act } = useWyr();
  const { s, me, partner } = useRoom();
  const turn = s.current!;
  const [pick, setPick] = useState<Choice | null>(null);
  const [prediction, setPrediction] = useState<Choice | null>(null);
  const [sending, setSending] = useState(false);
  const latest = useRef({ pick, prediction });
  latest.current = { pick, prediction };
  const author = s.players.find((p) => p.id === turn.question.authorId);
  const submitted = turn.done.includes(me.id);

  async function send() {
    const { pick: p, prediction: guess } = latest.current;
    if (!p || sending) return;
    setSending(true);
    // If the timer runs out before guessing, assume they think alike.
    await act('answer:submit', { pick: p, prediction: guess ?? p });
    setSending(false);
  }

  if (submitted) {
    return (
      <main className="flex flex-1 flex-col gap-4">
        <RoundHeader title="Locked in! 🔒" />
        <Options question={turn.question} selected={turn.picks[me.id]} />
        <WaitingBlob label={COPY.waiting(partner?.name ?? 'your partner')} sub={COPY.waitingSub} />
        <TimerBar total={s.settings.answerSec} onExpire={() => {}} />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4">
      <RoundHeader title={COPY.title} />
      <TimerBar total={s.settings.answerSec} onExpire={send} />
      {author && <span className="chip !min-h-0 !cursor-default self-center text-sm">{COPY.written(author.name)}</span>}
      <Options question={turn.question} selected={pick} onPick={setPick} disabled={sending} />

      <section className={`sticker space-y-3 p-4 transition-opacity ${pick ? '' : 'pointer-events-none opacity-40'}`}>
        <p className="text-center font-display text-lg font-extrabold">{COPY.predict(partner?.name ?? 'your partner')}</p>
        <div className="grid grid-cols-2 gap-3">
          {(['a', 'b'] as const).map((c) => (
            <button
              key={c}
              type="button"
              className="chip !h-auto !min-h-12 !py-2 text-left !text-sm leading-tight"
              aria-pressed={prediction === c}
              onClick={() => setPrediction(c)}
            >
              <b>{c.toUpperCase()}</b> · {turn.question[c]}
            </button>
          ))}
        </div>
      </section>

      <div className="action-bar mt-auto">
        <button className="btn btn-pink w-full" disabled={!pick || !prediction || sending} onClick={send}>
          {!pick ? COPY.pickFirst : !prediction ? COPY.predictFirst : COPY.lock}
        </button>
      </div>
    </main>
  );
}
