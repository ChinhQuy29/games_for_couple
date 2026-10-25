// Browser storage can be missing (private mode, blocked storage) — never let that break the game.
// Names live in localStorage; room sessions live in sessionStorage so each tab is its own player
// but a reload still resumes.

type Area = 'local' | 'session';

const area = (a: Area): Storage => (a === 'local' ? localStorage : sessionStorage);

export function load<T>(key: string, fallback: T, where: Area = 'local'): T {
  try {
    const raw = area(where).getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown, where: Area = 'local'): void {
  try {
    area(where).setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function remove(key: string, where: Area = 'local'): void {
  try {
    area(where).removeItem(key);
  } catch {
    /* ignore */
  }
}

export const KEYS = {
  name: 'fms.name.v1',
  session: (code: string) => `fms.session.${code}.v1`,
};

export interface Session {
  code: string;
  token: string;
  playerId: string;
}
