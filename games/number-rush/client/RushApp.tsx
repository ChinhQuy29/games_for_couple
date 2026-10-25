import { kit } from './kit';
import { Lobby, Play, Recap } from './screens';

export default function RushApp() {
  return (
    <kit.AppShell
      wide
      home={{
        title: (
          <>
            Number <span className="text-pink">Rush</span>
          </>
        ),
        emoji: '🔢',
        subtitle: '1 to 100, all on one board. Find the next number before your partner does.',
        note: 'Best on a laptop, with a mouse or trackpad.',
      }}
      phases={{ LOBBY: Lobby, PLAY: Play, RECAP: Recap }}
    />
  );
}
