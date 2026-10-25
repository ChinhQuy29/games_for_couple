import { kit } from './kit';
import { Finish, Hide, Lobby, Reveal, Seek } from './screens';

export default function PaintApp() {
  return (
    <kit.AppShell
      wide
      home={{
        title: (
          <>
            Paint <span className="text-pink">&amp; Hide</span>
          </>
        ),
        emoji: '🦎',
        subtitle: 'Paint a chameleon to blend into a crazy scene. Your partner gets 25 seconds and 3 clicks to find it.',
        note: 'Best with a mouse. Inspired by Meccha Chameleon.',
      }}
      phases={{ LOBBY: Lobby, HIDE: Hide, SEEK: Seek, REVEAL: Reveal, FINISH: Finish }}
    />
  );
}
