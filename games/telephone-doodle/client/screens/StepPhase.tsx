import { useRef, useState } from 'react';
import { LIMITS, type Stroke } from '../../shared';
import { useDoodle, useRoom } from '../store';
import ChaosSticker from '../components/ChaosSticker';
import DrawingCanvas from '../components/DrawingCanvas';
import DrawingView from '../components/DrawingView';
import RoundHeader from '../components/RoundHeader';
import TimerBar from '../components/TimerBar';
import WaitingBlob from '../components/WaitingBlob';
import { useTyping } from '../components/useTyping';

const COPY = {
  drawTitle: 'Draw this!',
  guessTitle: 'What on earth is this?',
  guessPlaceholder: 'a horse… doing taxes?',
  sendDrawing: 'Send my masterpiece 🖼️',
  sendGuess: 'Lock in my guess 🔒',
  step: (n: number, total: number) => `Step ${n} of ${total}`,
  waitingDraw: (name: string) => `Waiting for ${name} to finish drawing…`,
  waitingGuess: (name: string) => `Waiting for ${name} to guess…`,
};

export default function StepPhase() {
  const { s } = useRoom();
  // Fresh local state for every step.
  return <StepTask key={`${s.round}-${s.step}`} />;
}

function StepTask() {
  const { s, partner } = useRoom();
  const task = s.myTask;
  const sub = COPY.step(s.step + 1, s.settings.steps);
  if (!task) return null;

  if (task.submitted) {
    const label = task.kind === 'drawing' ? COPY.waitingDraw : COPY.waitingGuess;
    return (
      <main className="flex flex-1 flex-col justify-center gap-4">
        <RoundHeader title="Sent! 📮" sub={sub} />
        <WaitingBlob label={s.partnerSubmitted ? 'Both done! Passing it on…' : label(partner?.name ?? 'your partner')} sub="No take-backs 😈" />
        <TimerBar total={task.kind === 'drawing' ? s.settings.drawSec : s.settings.guessSec} onExpire={() => {}} />
      </main>
    );
  }

  return task.kind === 'drawing' ? <DrawTask sub={sub} /> : <GuessTask sub={sub} />;
}

function DrawTask({ sub }: { sub: string }) {
  const { act } = useDoodle();
  const { s } = useRoom();
  const task = s.myTask!;
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [sending, setSending] = useState(false);
  const latest = useRef(strokes);
  latest.current = strokes;

  async function send() {
    if (sending) return;
    setSending(true);
    await act('drawing:submit', { drawing: { strokes: latest.current } });
    setSending(false);
  }

  return (
    <main className="flex flex-1 flex-col gap-3">
      <RoundHeader title={COPY.drawTitle} sub={sub} />
      <TimerBar total={s.settings.drawSec} onExpire={send} />
      <div className="sticker -rotate-1 !bg-sky px-4 py-3 text-center font-display text-2xl font-extrabold text-on-accent">
        {task.text}
      </div>
      {task.chaos && <ChaosSticker chaos={task.chaos} />}
      <DrawingCanvas strokes={strokes} onChange={setStrokes} chaos={task.chaos} disabled={sending} />
      <div className="action-bar mt-auto">
        <button className="btn btn-pink w-full" disabled={sending} onClick={send}>
          {COPY.sendDrawing}
        </button>
      </div>
    </main>
  );
}

function GuessTask({ sub }: { sub: string }) {
  const { act } = useDoodle();
  const { s } = useRoom();
  const task = s.myTask!;
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const { ping, stop } = useTyping();

  async function send(value = text) {
    if (value.trim().length < LIMITS.guessMin || sending) return;
    setSending(true);
    stop();
    await act('guess:submit', { text: value.trim() });
    setSending(false);
  }

  return (
    <main className="flex flex-1 flex-col gap-3">
      <RoundHeader title={COPY.guessTitle} sub={sub} />
      <TimerBar total={s.settings.guessSec} onExpire={() => send()} />
      {task.drawing && <DrawingView drawing={task.drawing} replayId={`task-${s.round}-${s.step}`} className="sticker overflow-hidden !p-0" />}
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          className="field font-display !text-2xl !font-bold"
          value={text}
          maxLength={LIMITS.guessMax}
          placeholder={COPY.guessPlaceholder}
          onChange={(e) => {
            setText(e.target.value);
            ping();
          }}
          autoFocus
        />
        <div className="action-bar mt-auto">
          <button className="btn btn-pink w-full" disabled={!text.trim() || sending}>
            {COPY.sendGuess}
          </button>
        </div>
      </form>
    </main>
  );
}
