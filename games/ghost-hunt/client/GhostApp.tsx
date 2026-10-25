import { kit } from './kit';
import { Hunt, Lobby, Result } from './screens';

export default function GhostApp() {
  return (
    <kit.AppShell
      wide
      home={{
        title: (
          <>
            Ghost <span className="text-pink">Hunt</span>
          </>
        ),
        emoji: '🔦',
        subtitle: 'One of you walks a haunted house with a flashlight. The other has the map. Name the ghost, then get out.',
        note: 'Play on a call, with the lights off if you dare. Inspired by Phasmophobia.',
      }}
      phases={{ LOBBY: Lobby, HUNT: Hunt, RESULT: Result }}
    />
  );
}
