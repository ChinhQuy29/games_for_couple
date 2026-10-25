import { kit } from './kit';
import { Lobby, Shift, Summary } from './screens';

export default function KitchenApp() {
  return (
    <kit.AppShell
      wide
      home={{
        title: (
          <>
            Kitchen <span className="text-pink">Chaos</span>
          </>
        ),
        emoji: '🍳',
        subtitle: 'One of you preps, the other cooks. Orders keep coming. Something is on fire.',
        note: 'Best on a laptop, on a call. Inspired by Overcooked.',
      }}
      phases={{ LOBBY: Lobby, SHIFT: Shift, SUMMARY: Summary }}
    />
  );
}
