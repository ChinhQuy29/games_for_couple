import { kit } from './kit';
import { Arrived, Drive, Finish, Lobby } from './screens';

export default function RoadTripApp() {
  return (
    <kit.AppShell
      wide
      home={{
        title: (
          <>
            Road <span className="text-pink">Trip</span>
          </>
        ),
        emoji: '🚐',
        subtitle: 'One of you steers. The other has the pedals and the only map. Watch out for cows.',
        note: 'Keyboard needed, on a call. Inspired by RV There Yet?',
      }}
      phases={{ LOBBY: Lobby, DRIVE: Drive, ARRIVED: Arrived, FINISH: Finish }}
    />
  );
}
