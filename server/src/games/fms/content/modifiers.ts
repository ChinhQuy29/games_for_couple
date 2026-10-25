import type { Modifier } from '@gfc/shared';

export interface ModifierDef extends Modifier {
  /** Optional automatic check, only used for a ✅/❌ badge — never blocks submitting. */
  check?: (ending: string) => boolean;
  /** Needs the finisher to see at least one word of the starter. */
  needsVisibleWords?: boolean;
}

const words = (s: string) => s.split(/\s+/).filter(Boolean);

export const MODIFIERS: ModifierDef[] = [
  { id: 'pirate', emoji: '🏴‍☠️', text: 'Write it like a pirate' },
  { id: 'five-words', emoji: '🤏', text: 'Five words max', check: (e) => words(e).length <= 5 },
  {
    id: 'banana',
    emoji: '🍌',
    text: 'Must include the word "banana"',
    check: (e) => /banana/i.test(e),
  },
  {
    id: 'caps',
    emoji: '📢',
    text: 'ALL CAPS',
    check: (e) => /[A-Z]/.test(e) && e === e.toUpperCase(),
  },
  { id: 'dramatic', emoji: '🎭', text: 'Make it as dramatic as possible' },
  { id: 'grandma', emoji: '👵', text: 'Answer as your grandma would' },
  { id: 'rhyme', emoji: '🎵', text: 'Rhyme with the last word you can see', needsVisibleWords: true },
  { id: 'animal', emoji: '🐸', text: 'Mention an animal' },
  { id: 'linkedin', emoji: '💼', text: 'Sound like a LinkedIn post' },
  { id: 'fantasy', emoji: '🧙', text: 'Epic fantasy tone, please' },
  { id: 'wholesome', emoji: '😇', text: 'Make it unexpectedly wholesome' },
  {
    id: 'alliteration',
    emoji: '🔤',
    text: 'Every word starts with the same letter',
    check: (e) => {
      const first = words(e)
        .map((w) => w.replace(/[^a-z]/gi, '')[0]?.toLowerCase())
        .filter(Boolean);
      return first.length > 1 && first.every((c) => c === first[0]);
    },
  },
  { id: 'robot', emoji: '🤖', text: 'Speak like a robot. BEEP.' },
  { id: 'headline', emoji: '📺', text: 'Write it like a news headline' },
  { id: 'compliment', emoji: '❤️', text: 'Secretly compliment your partner' },
  { id: 'question', emoji: '❓', text: 'End it with a question', check: (e) => e.trim().endsWith('?') },
  { id: 'emoji-only', emoji: '🙃', text: 'Use at least 3 emoji', check: (e) => (e.match(/\p{Extended_Pictographic}/gu) ?? []).length >= 3 },
];
