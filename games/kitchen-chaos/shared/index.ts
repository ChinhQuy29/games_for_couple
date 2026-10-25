import { z } from 'zod';
import type { BaseRoom, PublicBase } from '@gfc/kit/shared';

// ---------- ingredients and recipes ----------

export const INGREDIENTS = {
  lettuce: { emoji: '🥬', name: 'Lettuce', chop: true, cook: false },
  tomato: { emoji: '🍅', name: 'Tomato', chop: true, cook: true },
  onion: { emoji: '🧅', name: 'Onion', chop: true, cook: true },
  meat: { emoji: '🥩', name: 'Meat', chop: true, cook: true },
  bun: { emoji: '🍞', name: 'Bun', chop: false, cook: false },
  fish: { emoji: '🐟', name: 'Fish', chop: true, cook: false },
  rice: { emoji: '🍚', name: 'Rice', chop: false, cook: true },
  nori: { emoji: '🌿', name: 'Seaweed', chop: false, cook: false },
  tortilla: { emoji: '🫓', name: 'Tortilla', chop: false, cook: false },
  cheese: { emoji: '🧀', name: 'Cheese', chop: true, cook: false },
  egg: { emoji: '🥚', name: 'Egg', chop: false, cook: true },
  mushroom: { emoji: '🍄', name: 'Mushroom', chop: true, cook: true },
} as const;
export type Ingredient = keyof typeof INGREDIENTS;
export const INGREDIENT_IDS = Object.keys(INGREDIENTS) as Ingredient[];

/** A component is an ingredient plus what's been done to it, e.g. 'tomato+chop+cook'. */
export type Component = string;

export interface Item {
  id: number;
  ing: Ingredient;
  chopped: boolean;
  cooked: boolean;
  burnt: boolean;
}
export interface Plate {
  id: number;
  plate: true;
  items: Item[];
}
export type Held = Item | Plate;
export const isPlate = (h: Held | null | undefined): h is Plate => !!h && 'plate' in h;

export function componentOf(i: Pick<Item, 'ing' | 'chopped' | 'cooked'>): Component {
  return `${i.ing}${i.chopped ? '+chop' : ''}${i.cooked ? '+cook' : ''}`;
}

export const RECIPES = {
  salad: { emoji: '🥗', name: 'Salad', parts: ['lettuce+chop', 'tomato+chop'] },
  burger: { emoji: '🍔', name: 'Burger', parts: ['bun', 'meat+cook', 'lettuce+chop'] },
  soup: { emoji: '🍲', name: 'Tomato Soup', parts: ['tomato+chop+cook', 'onion+chop+cook'] },
  sushi: { emoji: '🍣', name: 'Sushi', parts: ['fish+chop', 'rice+cook', 'nori'] },
  taco: { emoji: '🌮', name: 'Taco', parts: ['tortilla', 'meat+chop+cook', 'cheese+chop'] },
  omelette: { emoji: '🍳', name: 'Omelette', parts: ['egg+cook', 'mushroom+chop+cook', 'cheese+chop'] },
  friedrice: { emoji: '🍛', name: 'Fried Rice', parts: ['rice+cook', 'egg+cook', 'onion+chop'] },
} as const satisfies Record<string, { emoji: string; name: string; parts: Component[] }>;
export type RecipeId = keyof typeof RECIPES;

/** True if the plate holds exactly the recipe's parts (any order). */
export function plateMatches(items: Item[], recipe: RecipeId): boolean {
  const want = [...RECIPES[recipe].parts].sort();
  const have = items.map(componentOf).sort();
  return want.length === have.length && want.every((c, i) => c === have[i]);
}

export const LEVELS = {
  1: { name: 'Lunch rush', recipes: ['salad', 'burger', 'soup'], orderEveryMs: 20_000, patienceMs: 75_000, maxOrders: 3, stars: [40, 100, 160] },
  2: { name: 'Dinner service', recipes: ['salad', 'burger', 'soup', 'sushi', 'taco'], orderEveryMs: 17_000, patienceMs: 70_000, maxOrders: 4, stars: [60, 140, 220] },
  3: { name: 'Kitchen nightmare', recipes: ['salad', 'burger', 'soup', 'sushi', 'taco', 'omelette', 'friedrice'], orderEveryMs: 14_000, patienceMs: 65_000, maxOrders: 4, stars: [80, 180, 280] },
} as const satisfies Record<number, { name: string; recipes: RecipeId[]; orderEveryMs: number; patienceMs: number; maxOrders: number; stars: readonly [number, number, number] }>;
export type Level = keyof typeof LEVELS;
export const LEVEL_IDS: Level[] = [1, 2, 3];

/** Ingredients the crates must offer for a level. */
export function ingredientsFor(level: Level): Ingredient[] {
  const set = new Set<Ingredient>();
  for (const r of LEVELS[level].recipes) for (const p of RECIPES[r].parts) set.add(p.split('+')[0] as Ingredient);
  return INGREDIENT_IDS.filter((i) => set.has(i));
}

export const TIMING = {
  countdownMs: 3000,
  shiftMs: 180_000,
  chopClicks: 5,
  cookMs: 7000,
  /** After it's cooked, this long until it burns. */
  burnMs: 8000,
  firstOrderMs: 1500,
} as const;

export const COINS = { perPart: 10, maxTip: 10, expired: -10 } as const;

// ---------- stations ----------

export type Side = 'prep' | 'cook';
export type StationKind = 'crate' | 'board' | 'pass' | 'stove' | 'plates' | 'counter' | 'serve' | 'trash';

export interface Station {
  id: string;
  kind: StationKind;
  /** Who may use it: one side, or both ('pass'). */
  side: Side | 'both';
  /** For crates. */
  ing?: Ingredient;
  content: Held | null;
  /** Board: chop clicks so far. */
  chops: number;
  /** Stove: when the current item went on. */
  cookStart: number;
}

// ---------- room ----------

export interface Order {
  id: number;
  recipe: RecipeId;
  placedAt: number;
  expiresAt: number;
}

export interface ShiftResult {
  n: number;
  level: Level;
  coins: number;
  stars: number;
  served: number;
  expired: number;
  burnt: number;
  sides: Record<Side, string>;
}

export interface Room extends BaseRoom {
  phase: 'LOBBY' | 'SHIFT' | 'SUMMARY';
  level: Level;
  /** Which player works which side. */
  sides: Record<Side, string> | null;
  stations: Station[];
  hands: Record<string, Held | null>;
  orders: Order[];
  nextOrderAt: number;
  startsAt: number;
  endsAt: number;
  coins: number;
  served: number;
  expired: number;
  burnt: number;
  nextId: number;
  /** Short-lived messages for the feed ("Burger served! +38"). */
  feed: { id: number; at: number; text: string; good: boolean }[];
  results: ShiftResult[];
  readyForNext: string[];
}

export interface PublicState extends PublicBase {
  phase: Room['phase'];
  level: Level;
  mySide: Side | null;
  sides: Record<Side, string> | null;
  stations: Station[];
  hands: Record<string, Held | null>;
  orders: Order[];
  startsAt: number;
  endsAt: number;
  coins: number;
  served: number;
  expired: number;
  burnt: number;
  feed: Room['feed'];
  results: ShiftResult[];
  readyForNext: string[];
}

export const SettingsSchema = z.object({ level: z.union([z.literal(1), z.literal(2), z.literal(3)]) });
export const ClickSchema = z.object({ station: z.string().min(1).max(40) });

export function starsFor(level: Level, coins: number): number {
  return LEVELS[level].stars.filter((s) => coins >= s).length;
}

/** What a stove item is right now, from its timestamps. */
export function stoveState(st: Pick<Station, 'cookStart'>, now: number): 'cooking' | 'done' | 'burnt' {
  const t = now - st.cookStart;
  if (t < TIMING.cookMs) return 'cooking';
  if (t < TIMING.cookMs + TIMING.burnMs) return 'done';
  return 'burnt';
}
