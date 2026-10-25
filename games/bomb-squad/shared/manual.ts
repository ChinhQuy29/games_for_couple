// The Bomb Defusal Manual: original rules written for this game. The Expert reads this
// (rendered as text); the server uses the solver functions in rules.ts, which implement
// exactly these rules. Keep the two in sync — the tests check the solvers.

export type WireColor = 'red' | 'blue' | 'yellow' | 'white' | 'black';
export const WIRE_COLORS: WireColor[] = ['red', 'blue', 'yellow', 'white', 'black'];

export type ButtonColor = 'red' | 'blue' | 'yellow' | 'white';
export const BUTTON_COLORS: ButtonColor[] = ['red', 'blue', 'yellow', 'white'];
export const BUTTON_LABELS = ['ABORT', 'DETONATE', 'HOLD', 'PRESS'] as const;
export type ButtonLabel = (typeof BUTTON_LABELS)[number];

export type SimonColor = 'red' | 'blue' | 'green' | 'yellow';
export const SIMON_COLORS: SimonColor[] = ['red', 'blue', 'green', 'yellow'];

export const MANUAL = {
  intro: [
    'Your partner is looking at a bomb. You are looking at this manual. Neither of you can see what the other sees: talk!',
    'Every bomb has a serial number and some batteries. Many rules depend on them, so ask your partner to read them out.',
    'Three mistakes (strikes) and the bomb explodes. So does running out of time. Defuse every module to win.',
  ],
  wires: {
    title: 'Wires',
    intro: 'A module has 3 to 6 colored wires. Cut exactly one. Count wires from the top.',
    byCount: {
      3: ['If there are no yellow wires, cut the first wire.', 'Otherwise, if the last wire is black, cut the second wire.', 'Otherwise, cut the last wire.'],
      4: [
        'If there is more than one red wire and the last digit of the serial number is odd, cut the last red wire.',
        'Otherwise, if there are no blue wires, cut the third wire.',
        'Otherwise, if there is exactly one white wire, cut the first wire.',
        'Otherwise, cut the second wire.',
      ],
      5: [
        'If the last wire is yellow and there are 2 or more batteries, cut the fourth wire.',
        'Otherwise, if there are exactly two black wires, cut the first black wire.',
        'Otherwise, if there are no red wires, cut the second wire.',
        'Otherwise, cut the first wire.',
      ],
      6: [
        'If there are no white wires and the last digit of the serial number is even, cut the third wire.',
        'Otherwise, if there is exactly one blue wire, cut the fifth wire.',
        'Otherwise, if there are more red wires than yellow wires, cut the last wire.',
        'Otherwise, cut the fourth wire.',
      ],
    } as Record<3 | 4 | 5 | 6, string[]>,
  },
  button: {
    title: 'The Button',
    intro: 'A single big button with a color and a word. Decide whether to TAP it (press and let go) or HOLD it. Use the first rule that applies.',
    rules: [
      'If the button is blue and says "ABORT", hold it.',
      'If there are 2 or more batteries and the button says "DETONATE", tap it.',
      'If the button is white and the serial number contains a vowel (A, E, I, O, U), hold it.',
      'If there are 3 or more batteries and the button is yellow, tap it.',
      'If the button is red and says "HOLD", tap it.',
      'Otherwise, hold it.',
    ],
    holdIntro: 'When you hold the button, a strip next to it lights up. Let go when the countdown timer shows this digit anywhere:',
    strip: [
      ['blue', '4'],
      ['yellow', '5'],
      ['white', '2'],
      ['red', '1'],
    ] as [ButtonColor, string][],
  },
  symbols: {
    title: 'Symbols',
    intro:
      'Four buttons, each with a strange symbol. Exactly one column below contains all four. Press the four buttons in the order they appear in that column (top to bottom).',
    columns: [
      ['Ϙ', 'Ѧ', 'ƛ', 'Ϟ', 'Ѭ', 'ϗ', 'Ͽ'],
      ['Ӭ', 'Ϙ', 'Ͽ', 'Ҩ', '☆', 'ϗ', '¿'],
      ['©', 'Ѽ', 'Ҩ', 'Ж', 'Ԇ', 'ƛ', '☆'],
      ['б', '¶', 'Ѣ', 'Ѭ', 'Ж', '¿', 'ټ'],
      ['Ψ', 'ټ', 'Ѣ', 'Ͼ', '¶', 'Ѯ', '★'],
      ['б', 'Ӭ', '҂', 'æ', 'Ψ', 'Ҋ', 'Ω'],
    ],
  },
  simon: {
    title: 'Simon Says',
    intro:
      'Four colored pads flash a sequence. Do NOT press the color that flashed: press the color the table tells you to. Each time you get it right, the sequence grows by one flash. Repeat the whole sequence every time.',
    note: 'The table depends on whether the serial number has a vowel, and on how many strikes you have right now.',
    /** [hasVowel][strikes][flashed] = press */
    table: {
      vowel: [
        { red: 'green', blue: 'red', green: 'yellow', yellow: 'blue' },
        { red: 'yellow', blue: 'green', green: 'blue', yellow: 'red' },
        { red: 'blue', blue: 'yellow', green: 'red', yellow: 'green' },
      ],
      noVowel: [
        { red: 'blue', blue: 'yellow', green: 'green', yellow: 'red' },
        { red: 'red', blue: 'green', green: 'yellow', yellow: 'blue' },
        { red: 'yellow', blue: 'red', green: 'blue', yellow: 'green' },
      ],
    } as Record<'vowel' | 'noVowel', Record<SimonColor, SimonColor>[]>,
  },
  password: {
    title: 'Password',
    intro:
      'Five letter wheels. Spin them (▲/▼) to spell a word. Only one word from the list below can be spelled with the available letters. Spell it and press SUBMIT.',
    words: [
      'about', 'after', 'again', 'below', 'could', 'every', 'first', 'found', 'great', 'house', 'large', 'learn',
      'never', 'other', 'place', 'plant', 'point', 'right', 'small', 'sound', 'spell', 'still', 'study', 'their',
      'there', 'these', 'thing', 'think', 'three', 'water', 'where', 'which', 'world', 'would', 'write',
    ],
  },
} as const;

export const ALL_SYMBOLS = [...new Set(MANUAL.symbols.columns.flat())];
