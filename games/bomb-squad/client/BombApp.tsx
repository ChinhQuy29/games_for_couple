import { kit } from './kit';
import { Armed, Lobby, Result } from './screens';

export default function BombApp() {
  return (
    <kit.AppShell
      wide
      home={{
        title: (
          <>
            Bomb <span className="text-pink">Squad</span>
          </>
        ),
        emoji: '💣',
        subtitle: 'One of you sees the bomb. The other has the manual. Talk fast.',
        note: 'Play on a call. Inspired by Keep Talking and Nobody Explodes.',
      }}
      phases={{ LOBBY: Lobby, ARMED: Armed, RESULT: Result }}
    />
  );
}
