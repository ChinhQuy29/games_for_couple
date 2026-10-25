import { kit } from './kit';
import { Lobby, Over, Play } from './screens';

export default function DuetApp() {
  return (
    <kit.AppShell
      wide
      home={{
        title: (
          <>
            Codenames <span className="text-pink">Duet</span>
          </>
        ),
        emoji: '🕵️',
        subtitle: 'Find all 15 agents together with one-word clues. Each of you sees a different secret key. Avoid the assassins.',
        note: 'English or Vietnamese words. Based on the board game Codenames Duet.',
      }}
      phases={{ LOBBY: Lobby, PLAY: Play, OVER: Over }}
    />
  );
}
