import { kit } from './kit';
import { Clear, Finish, Lobby, Unpack } from './screens';

export default function MovingInApp() {
  return (
    <kit.AppShell
      wide
      home={{
        title: (
          <>
            Moving <span className="text-pink">In</span>
          </>
        ),
        emoji: '📦',
        subtitle: 'Two boxes of stuff, six rooms, one story. Put everything where it belongs, together.',
        note: 'Best on a laptop with a mouse or trackpad. Inspired by Dreamy Room and Unpacking.',
      }}
      phases={{ LOBBY: Lobby, UNPACK: Unpack, CLEAR: Clear, FINISH: Finish }}
    />
  );
}
