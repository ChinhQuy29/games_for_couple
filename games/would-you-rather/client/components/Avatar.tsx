const ANIMALS = ['🐸', '🦆', '🐙', '🦄', '🐼', '🦊', '🐧', '🐨', '🦖', '🐝', '🦥', '🐹'];

export function avatarFor(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return ANIMALS[h % ANIMALS.length]!;
}

export default function Avatar({ id, size = 'text-3xl' }: { id: string; size?: string }) {
  return (
    <span className={`${size} inline-block`} aria-hidden>
      {avatarFor(id)}
    </span>
  );
}
