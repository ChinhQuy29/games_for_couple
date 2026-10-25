// Portal registry: every game shows up on the home page from this list.
// To add a game, add an entry here, a route in client/src/App.tsx and
// (if it's real-time) a namespace in server/src/index.ts.

export type GameStatus = 'playable' | 'coming-soon';

export interface GameInfo {
  id: string;
  title: string;
  emoji: string;
  tagline: string;
  path: string;
  /** True for games that are their own page rather than a route in the React app (full page load). */
  standalonePage?: boolean;
  status: GameStatus;
  /** Accent color token name from client/src/styles.css */
  accent: 'pink' | 'yellow' | 'mint' | 'sky';
  minutes: string;
}

export const GAMES: GameInfo[] = [
  {
    id: 'fms',
    title: 'Finish My Sentence',
    emoji: '✍️',
    tagline: 'You start it, they finish it — without seeing the whole thing.',
    path: '/fms',
    status: 'playable',
    accent: 'pink',
    minutes: '10–20 min',
  },
  {
    id: 'jjinja',
    title: 'Jjinja Battle',
    emoji: '🎤',
    tagline: 'Yell "jjinja?!" (찐짜) into your mic. The most dramatic one wins.',
    path: '/jjinja',
    standalonePage: true,
    status: 'playable',
    accent: 'sky',
    minutes: '5 min',
  },
  {
    id: 'doodle',
    title: 'Telephone Doodle',
    emoji: '🖍️',
    tagline: 'Draw it, guess it, draw the guess. Watch it fall apart.',
    path: '/doodle',
    status: 'playable',
    accent: 'mint',
    minutes: '10–15 min',
  },
  {
    id: 'wyr',
    title: 'Would You Rather: Unhinged',
    emoji: '🤔',
    tagline: 'Pick at the same time, guess their pick, then defend your honor.',
    path: '/wyr',
    status: 'playable',
    accent: 'yellow',
    minutes: '10–15 min',
  },
  {
    id: 'aog',
    title: 'Fan Cứng AOG',
    emoji: '👻',
    tagline: 'Liên Quân & AOG trivia for real fans: SGP, Lai Bâng, the rivals, the drama. VI/EN.',
    path: '/aog',
    status: 'playable',
    accent: 'pink',
    minutes: '10–15 min',
  },
  {
    id: 'hns',
    title: 'Hide and Seek',
    emoji: '🙈',
    tagline: 'Turn into a lamp, a cushion or a duck and hide in plain sight. They get 5 shots. Best on laptops.',
    path: '/hns',
    status: 'playable',
    accent: 'sky',
    minutes: '15–20 min',
  },
  {
    id: 'rush',
    title: 'Number Rush',
    emoji: '🔢',
    tagline: '1 to 100 on one board. Race to find the next number first.',
    path: '/rush',
    status: 'playable',
    accent: 'yellow',
    minutes: '5–10 min',
  },
  {
    id: 'bomb',
    title: 'Bomb Squad',
    emoji: '💣',
    tagline: 'One of you sees the bomb, the other has the manual. Talk fast.',
    path: '/bomb',
    status: 'playable',
    accent: 'pink',
    minutes: '10–20 min',
  },
  {
    id: 'blind-portrait',
    title: 'Blind Portrait Duel',
    emoji: '🎨',
    tagline: 'Draw each other from memory in 60 seconds. Judge the crimes.',
    path: '/blind-portrait',
    status: 'coming-soon',
    accent: 'yellow',
    minutes: '10 min',
  },
  {
    id: 'two-body-problem',
    title: 'Two-Body Problem',
    emoji: '🕹️',
    tagline: 'One character, two players. You walk, they jump. Good luck.',
    path: '/two-body-problem',
    status: 'coming-soon',
    accent: 'mint',
    minutes: '15 min',
  },
];
