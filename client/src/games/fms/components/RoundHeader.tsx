import { useFms, useRoom } from '../store';

export default function RoundHeader({ title }: { title: string }) {
  const { partnerTyping } = useFms();
  const { s, partner } = useRoom();
  return (
    <header className="text-center">
      <p className="font-display font-bold text-ink-soft">
        Round {s.round} of {s.settings.rounds}
      </p>
      <h1 className="font-display text-3xl font-extrabold leading-tight">{title}</h1>
      <p className="h-6 text-sm font-bold text-ink-soft">
        {partner && !partner.connected && `📡 ${partner.name} disconnected… hang tight`}
        {partner?.connected && partnerTyping && `💭 ${partner.name} is typing…`}
      </p>
    </header>
  );
}
