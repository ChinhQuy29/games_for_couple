// Kitchen Chaos — the rules. Pure functions: time and randomness come in through ctx.
//
// One player preps (crates, chopping boards), the other cooks (stoves, plates, the
// serving window). The only way across is the pass in the middle. Everything is a
// click: click a station with something in your hand to put it down, with empty
// hands to pick up (or chop).

import { firstPlayer, fail, pick, requireHost, requirePhase, requirePlayer, requireTwo, type Ctx } from '@gfc/kit/server';
import {
  COINS,
  INGREDIENTS,
  LEVELS,
  RECIPES,
  TIMING,
  ingredientsFor,
  isPlate,
  plateMatches,
  starsFor,
  stoveState,
  type Held,
  type Item,
  type Level,
  type Room,
  type Side,
  type Station,
  type StationKind,
} from '../shared';

export function newRoom(code: string, ctx: Ctx): Room {
  return {
    code,
    createdAt: ctx.now,
    lastActivityAt: ctx.now,
    players: [],
    phase: 'LOBBY',
    level: 1,
    sides: null,
    stations: [],
    hands: {},
    orders: [],
    nextOrderAt: 0,
    startsAt: 0,
    endsAt: 0,
    coins: 0,
    served: 0,
    expired: 0,
    burnt: 0,
    nextId: 1,
    feed: [],
    results: [],
    readyForNext: [],
  };
}

export function resetToLobby(room: Room): void {
  room.phase = 'LOBBY';
  room.sides = null;
  room.stations = [];
  room.hands = {};
  room.orders = [];
  room.feed = [];
  room.readyForNext = [];
}

export function setLevel(room: Room, playerId: string, level: Level): void {
  requirePhase(room, 'LOBBY');
  requireHost(room, playerId);
  room.level = level;
}

function station(id: string, kind: StationKind, side: Station['side'], extra: Partial<Station> = {}): Station {
  return { id, kind, side, content: null, chops: 0, cookStart: 0, ...extra };
}

export function buildKitchen(level: Level): Station[] {
  return [
    ...ingredientsFor(level).map((ing) => station(`crate:${ing}`, 'crate', 'prep', { ing })),
    station('board:1', 'board', 'prep'),
    station('board:2', 'board', 'prep'),
    station('trash:prep', 'trash', 'prep'),
    station('pass:1', 'pass', 'both'),
    station('pass:2', 'pass', 'both'),
    station('pass:3', 'pass', 'both'),
    station('stove:1', 'stove', 'cook'),
    station('stove:2', 'stove', 'cook'),
    station('stove:3', 'stove', 'cook'),
    station('plates', 'plates', 'cook'),
    station('counter:1', 'counter', 'cook'),
    station('counter:2', 'counter', 'cook'),
    station('serve', 'serve', 'cook'),
    station('trash:cook', 'trash', 'cook'),
  ];
}

function beginShift(room: Room, sides: Record<Side, string>, ctx: Ctx): void {
  room.phase = 'SHIFT';
  room.sides = sides;
  room.stations = buildKitchen(room.level);
  room.hands = Object.fromEntries(room.players.map((p) => [p.id, null]));
  room.orders = [];
  room.startsAt = ctx.now + TIMING.countdownMs;
  room.endsAt = room.startsAt + TIMING.shiftMs;
  room.nextOrderAt = room.startsAt + TIMING.firstOrderMs;
  room.coins = 0;
  room.served = 0;
  room.expired = 0;
  room.burnt = 0;
  room.feed = [];
  room.readyForNext = [];
}

export function startGame(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'LOBBY');
  requireHost(room, playerId);
  requireTwo(room);
  const a = firstPlayer(room, ctx.rng);
  const b = room.players.find((p) => p !== a)!;
  room.results = [];
  beginShift(room, { prep: a.id, cook: b.id }, ctx);
}

/** Both players pressed "next shift": swap sides and go again (same level). */
export function readyForNext(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'SUMMARY');
  requirePlayer(room, playerId);
  if (!room.readyForNext.includes(playerId)) room.readyForNext.push(playerId);
  if (room.readyForNext.length < 2) return;
  requireTwo(room);
  const s = room.sides!;
  beginShift(room, { prep: s.cook, cook: s.prep }, ctx);
}

export function toLobby(room: Room, playerId: string): void {
  requirePhase(room, 'SUMMARY');
  requireHost(room, playerId);
  resetToLobby(room);
}

function say(room: Room, text: string, good: boolean, ctx: Ctx) {
  room.feed.push({ id: room.nextId++, at: ctx.now, text, good });
  room.feed = room.feed.filter((f) => ctx.now - f.at < 4000).slice(-4);
}

function newItem(room: Room, ing: Item['ing']): Item {
  return { id: room.nextId++, ing, chopped: false, cooked: false, burnt: false };
}

/** Updates a stove's item to cooked/burnt based on time. */
function settleStove(room: Room, st: Station, ctx: Ctx) {
  const item = st.content;
  if (st.kind !== 'stove' || !item || isPlate(item) || item.burnt) return;
  const state = stoveState(st, ctx.now);
  if (state === 'cooking') return;
  item.cooked = true;
  if (state === 'burnt') {
    item.burnt = true;
    room.burnt += 1;
  }
}

/** Generic counter behavior: put down, pick up, or combine with a plate. */
function swapOrCombine(room: Room, st: Station, me: string): string | void {
  const hand = room.hands[me] ?? null;
  const here = st.content;
  if (!here && !hand) return;
  if (!here) {
    st.content = hand;
    room.hands[me] = null;
    return;
  }
  if (!hand) {
    room.hands[me] = here;
    st.content = null;
    st.chops = 0;
    return;
  }
  // Both full: try to put the item onto the plate.
  if (isPlate(here) && !isPlate(hand)) {
    addToPlate(here, hand);
    room.hands[me] = null;
    return;
  }
  if (isPlate(hand) && !isPlate(here)) {
    addToPlate(hand, here);
    st.content = null;
    st.chops = 0;
    return;
  }
  fail('FULL', 'Hands full! Put something down first');
}

function addToPlate(plate: Extract<Held, { plate: true }>, item: Item) {
  if (item.burnt) fail('BURNT', "That's charcoal 🔥 Trash it");
  if (plate.items.length >= 4) fail('PLATE_FULL', 'The plate is full');
  plate.items.push(item);
}

export function click(room: Room, me: string, stationId: string, ctx: Ctx): string | void {
  requirePhase(room, 'SHIFT');
  requirePlayer(room, me);
  if (ctx.now < room.startsAt) fail('TOO_EARLY', 'Wait for it… 3, 2, 1!');
  if (ctx.now >= room.endsAt) fail('OVER', "Time's up!");
  const st = room.stations.find((s) => s.id === stationId) ?? fail('BAD_INPUT', 'No such station');
  const mySide: Side = room.sides!.prep === me ? 'prep' : 'cook';
  if (st.side !== 'both' && st.side !== mySide) fail('WRONG_SIDE', "That's your partner's side! Use the pass 🍽️");
  const hand = room.hands[me] ?? null;

  switch (st.kind) {
    case 'crate': {
      const ing = st.ing!;
      if (!hand) {
        room.hands[me] = newItem(room, ing);
        return;
      }
      if (!isPlate(hand) && hand.ing === ing && !hand.chopped && !hand.cooked) {
        room.hands[me] = null; // put it back
        return;
      }
      return fail('FULL', 'Hands full!');
    }
    case 'board': {
      const here = st.content;
      if (here && !isPlate(here) && !here.chopped) {
        if (hand) fail('CHOPPING', 'Finish chopping first 🔪');
        st.chops += 1;
        if (st.chops >= TIMING.chopClicks) {
          here.chopped = true;
          st.chops = 0;
        }
        return;
      }
      if (!here && hand) {
        if (isPlate(hand) || !INGREDIENTS[hand.ing].chop || hand.chopped || hand.cooked) fail('CANT_CHOP', "You can't chop that");
      }
      return swapOrCombine(room, st, me);
    }
    case 'pass':
    case 'counter':
      return swapOrCombine(room, st, me);
    case 'stove': {
      settleStove(room, st, ctx);
      const here = st.content;
      if (!here) {
        if (!hand) return;
        if (isPlate(hand) || !INGREDIENTS[hand.ing].cook || hand.cooked || hand.burnt) fail('CANT_COOK', "You can't cook that");
        st.content = hand;
        st.cookStart = ctx.now;
        room.hands[me] = null;
        return;
      }
      if (!isPlate(here) && !here.cooked && !here.burnt) fail('COOKING', 'Still cooking… 🍳');
      return swapOrCombine(room, st, me);
    }
    case 'plates': {
      if (!hand) {
        room.hands[me] = { id: room.nextId++, plate: true, items: [] };
        return;
      }
      if (isPlate(hand) && hand.items.length === 0) {
        room.hands[me] = null;
        return;
      }
      return fail('FULL', 'Hands full!');
    }
    case 'trash': {
      if (!hand) return;
      if (isPlate(hand)) hand.items = [];
      else room.hands[me] = null;
      return;
    }
    case 'serve': {
      if (!isPlate(hand) || hand.items.length === 0) fail('NO_PLATE', 'Bring a plated dish here');
      const plate = hand as Extract<Held, { plate: true }>;
      const order = room.orders.find((o) => plateMatches(plate.items, o.recipe));
      if (!order) fail('NOT_ORDERED', 'Nobody ordered that 🤨');
      const o = order!;
      const level = LEVELS[room.level];
      const left = Math.max(0, o.expiresAt - ctx.now) / level.patienceMs;
      const gain = RECIPES[o.recipe].parts.length * COINS.perPart + Math.ceil(COINS.maxTip * left);
      room.coins += gain;
      room.served += 1;
      room.orders = room.orders.filter((x) => x !== o);
      room.hands[me] = null;
      say(room, `${RECIPES[o.recipe].emoji} ${RECIPES[o.recipe].name} served! +${gain}`, true, ctx);
      // An empty kitchen gets a new order fast.
      if (room.orders.length === 0) room.nextOrderAt = Math.min(room.nextOrderAt, ctx.now + 2000);
      return `+${gain}`;
    }
  }
}

function spawnOrder(room: Room, ctx: Ctx) {
  const level = LEVELS[room.level];
  // Avoid three of the same dish in a row.
  const recent = room.orders.slice(-2).map((o) => o.recipe);
  let recipe = pick(level.recipes, ctx.rng);
  if (recent.length === 2 && recent.every((r) => r === recipe)) recipe = pick(level.recipes, ctx.rng);
  room.orders.push({ id: room.nextId++, recipe, placedAt: ctx.now, expiresAt: ctx.now + level.patienceMs });
}

function endShift(room: Room) {
  room.phase = 'SUMMARY';
  room.results.push({
    n: room.results.length + 1,
    level: room.level,
    coins: room.coins,
    stars: starsFor(room.level, room.coins),
    served: room.served,
    expired: room.expired,
    burnt: room.burnt,
    sides: room.sides!,
  });
  room.readyForNext = [];
}

export function wakeAt(room: Room): number | null {
  if (room.phase !== 'SHIFT') return null;
  const times = [room.endsAt, room.nextOrderAt, ...room.orders.map((o) => o.expiresAt)];
  // Wake when a stove item finishes or burns, so the summary counts burns even if nobody clicks.
  for (const st of room.stations) {
    if (st.kind === 'stove' && st.content && !isPlate(st.content) && !st.content.burnt) {
      times.push(st.content.cooked ? st.cookStart + TIMING.cookMs + TIMING.burnMs : st.cookStart + TIMING.cookMs);
    }
  }
  return Math.min(...times);
}

export function tick(room: Room, ctx: Ctx): boolean {
  if (room.phase !== 'SHIFT') return false;
  for (const st of room.stations) settleStove(room, st, ctx);
  if (ctx.now >= room.endsAt) {
    endShift(room);
    return true;
  }
  const level = LEVELS[room.level];
  for (const o of room.orders.filter((x) => x.expiresAt <= ctx.now)) {
    room.coins = Math.max(0, room.coins + COINS.expired);
    room.expired += 1;
    say(room, `${RECIPES[o.recipe].emoji} order walked out 😤 ${COINS.expired}`, false, ctx);
  }
  room.orders = room.orders.filter((x) => x.expiresAt > ctx.now);
  if (ctx.now >= room.nextOrderAt) {
    if (room.orders.length < level.maxOrders) spawnOrder(room, ctx);
    room.nextOrderAt = ctx.now + level.orderEveryMs;
  }
  return true;
}
