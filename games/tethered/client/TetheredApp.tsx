import { kit } from './kit';
import { Climb, Lobby, Summit } from './screens';

export default function TetheredApp() {
  return (
    <kit.AppShell
      wide
      home={{
        title: (
          <>
            Teth<span className="text-pink">ered</span>
          </>
        ),
        emoji: '⛓️',
        subtitle: 'Two climbers, one short chain, one tall tower. If one of you falls, you both do.',
        note: 'Keyboard needed. Inspired by Chained Together and PEAK.',
      }}
      phases={{ LOBBY: Lobby, CLIMB: Climb, SUMMIT: Summit }}
    />
  );
}
