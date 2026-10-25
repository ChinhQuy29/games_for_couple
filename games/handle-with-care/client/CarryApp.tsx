import { kit } from './kit';
import { Done, Finish, Lobby, Move } from './screens';

export default function CarryApp() {
  return (
    <kit.AppShell
      wide
      home={{
        title: (
          <>
            Handle <span className="text-pink">With Care</span>
          </>
        ),
        emoji: '📦',
        subtitle: 'Get the valuables into the moving truck before time runs out. The piano needs both of you. Please don’t drop the fish tank.',
        note: 'Keyboard needed. Inspired by R.E.P.O.',
      }}
      phases={{ LOBBY: Lobby, MOVE: Move, DONE: Done, FINISH: Finish }}
    />
  );
}
