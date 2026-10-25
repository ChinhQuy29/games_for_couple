import { kit } from './kit';
import { Clear, Finish, Lobby, Play } from './screens';

export default function EscapeApp() {
  return (
    <kit.AppShell
      wide
      home={{
        title: (
          <>
            Escape Room <span className="text-pink">for Two</span>
          </>
        ),
        emoji: '🔐',
        subtitle: 'Locked in two different rooms. Your clues open their locks. Talk your way out.',
        note: 'Play on a call. Inspired by We Were Here and Portal 2 co-op.',
      }}
      phases={{ LOBBY: Lobby, PLAY: Play, CLEAR: Clear, FINISH: Finish }}
    />
  );
}
