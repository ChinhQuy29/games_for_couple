import { kit } from './kit';
import { Clear, Finish, Lobby, Play } from './screens';

export default function TwoBodyApp() {
  return (
    <kit.AppShell
      wide
      home={{
        title: (
          <>
            Two-Body <span className="text-pink">Problem</span>
          </>
        ),
        emoji: '🕹️',
        subtitle: 'One character, two players. You walk, they jump. Good luck.',
        note: 'Keyboard needed. Inspired by It Takes Two and Pico Park.',
      }}
      phases={{ LOBBY: Lobby, PLAY: Play, CLEAR: Clear, FINISH: Finish }}
    />
  );
}
