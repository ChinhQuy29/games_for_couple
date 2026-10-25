import { useRef, useState } from 'react';
import { LIMITS, TIMING, type Choice, type PublicPlayer } from '../../shared';
import { useWyr, useRoom } from '../store';
import Options from '../components/Options';
import RoundHeader from '../components/RoundHeader';
import TimerBar from '../components/TimerBar';
import WaitingBlob from '../components/WaitingBlob';
import { useTyping } from '../components/useTyping';

const COPY = {
  title: '⚔️ You disagree!',
  prompt: 'Defend your honor in one line',
  placeholder: 'Because obviously…',
  send: 'Make my case 🎤',
  skip: 'No comment 🤐',
  waiting: (name: string) => `${name} is preparing their argument…`,
};

export default function DebatePhase() {
  const { s } = useRoom();
  return <Debate key={s.index} />;
}

/** Groups players by the side they picked. */
export function votersOf(players: PublicPlayer[], picks: Record<string, Choice | null>): Record<Choice, PublicPlayer[]> {
  return { a: players.filter((p) => picks[p.id] === 'a'), b: players.filter((p) => picks[p.id] === 'b') };
}

function Debate() {
  const { act } = useWyr();
  const { s, me, partner } = useRoom();
  const turn = s.current!;
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const { ping, stop } = useTyping();
  const latest = useRef(text);
  latest.current = text;

  async function send(value = latest.current) {
    if (sending) return;
    setSending(true);
    stop();
    await act('defense:submit', { text: value });
    setSending(false);
  }

  const voters = votersOf(s.players, turn.picks);

  if (turn.done.includes(me.id)) {
    return (
      <main className="flex flex-1 flex-col gap-4">
        <RoundHeader title={COPY.title} />
        <Options question={turn.question} voters={voters} />
        <WaitingBlob label={COPY.waiting(partner?.name ?? 'Your partner')} />
        <TimerBar total={TIMING.debateSec} onExpire={() => {}} />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4">
      <RoundHeader title={COPY.title} />
      <TimerBar total={TIMING.debateSec} onExpire={() => send()} />
      <Options question={turn.question} voters={voters} />
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label className="block">
          <span className="mb-1 block text-center font-display text-lg font-extrabold">{COPY.prompt}</span>
          <input
            className="field font-display !text-xl !font-bold"
            value={text}
            maxLength={LIMITS.defenseMax}
            placeholder={COPY.placeholder}
            onChange={(e) => {
              setText(e.target.value);
              ping();
            }}
            autoFocus
          />
        </label>
        <div className="action-bar mt-auto flex gap-3">
          <button type="button" className="btn btn-ghost !text-base" disabled={sending} onClick={() => send('')}>
            {COPY.skip}
          </button>
          <button className="btn btn-pink flex-1" disabled={!text.trim() || sending}>
            {COPY.send}
          </button>
        </div>
      </form>
    </main>
  );
}
