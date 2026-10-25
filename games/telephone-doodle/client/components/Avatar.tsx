import { useDoodle } from '../store';

const ANIMALS = ['🐸', '🦆', '🐙', '🦄', '🐼', '🦊', '🐧', '🐨', '🦖', '🐝', '🦥', '🐹'];

function hashIndex(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % ANIMALS.length;
}

/** A stable animal per player. If both players in a room would get the same one, the second gets the next animal. */
export function avatarFor(id: string, playerIds: string[] = []): string {
  let i = hashIndex(id);
  const [first, second] = playerIds;
  if (id === second && first && hashIndex(first) === i) i = (i + 1) % ANIMALS.length;
  return ANIMALS[i]!;
}

export default function Avatar({ id, size = 'text-3xl' }: { id: string; size?: string }) {
  const { state } = useDoodle();
  return (
    <span className={`${size} inline-block`} aria-hidden>
      {avatarFor(id, state?.players.map((p) => p.id))}
    </span>
  );
}
