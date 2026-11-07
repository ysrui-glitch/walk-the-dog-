import { LANES, type Lane } from '../config';
import type { EntityKind } from './world';

// 追狗: the dog bolts and the owner gives chase, paying out a long leash. One number decides the run: the gap between them.
// On foot the owner always loses ground, so they grab rides to catch up and throw things to hold the dog up.
export const START_GAP = 200;
export const CATCH_GAP = 80;
export const LOST_GAP = 900;

export type RideKind = 'skate' | 'scooter' | 'cycle' | 'moto' | 'car';

export interface RideSpec {
  readonly name: string;
  // Owner speed as a share of the dog's: above 1 closes the gap.
  readonly ratio: number;
  readonly ms: number;
  readonly unlock: number;
  readonly weight: number;
  // How fast it feels, shown as stars when you grab it.
  readonly tier: number;
  // A car ploughs straight through obstacles.
  readonly smashes?: boolean;
}

export const RIDES: Readonly<Record<RideKind, RideSpec>> = {
  skate: { name: '滑板', ratio: 1.1, ms: 6000, unlock: 0, weight: 5, tier: 1 },
  scooter: { name: '滑板车', ratio: 1.25, ms: 6000, unlock: 60, weight: 4, tier: 2 },
  cycle: { name: '自行车', ratio: 1.42, ms: 5500, unlock: 180, weight: 3, tier: 3 },
  moto: { name: '电动车', ratio: 1.62, ms: 5000, unlock: 300, weight: 2, tier: 4 },
  car: { name: '汽车', ratio: 1.9, ms: 4500, unlock: 450, weight: 1, tier: 5, smashes: true },
};

export interface Ride {
  readonly kind: RideKind;
  readonly until: number;
}

// Grabbing a ride never makes things worse: a better or equal ride takes over with a fresh timer; a lesser one
// just tops up the ride you are already on.
export const RIDE_TOP_UP_MS = 1500;

export function mountRide(current: Ride | undefined, kind: RideKind, now: number): Ride {
  if (!current || RIDES[kind].tier >= RIDES[current.kind].tier) return { kind, until: now + RIDES[kind].ms };
  return { kind: current.kind, until: Math.min(now + RIDES[current.kind].ms, current.until + RIDE_TOP_UP_MS) };
}

// A balloon is not a ride: tied to the owner on top of whatever they ride, it takes the next knock for them.
export const SHIELD_UNLOCK_M = 120;
const SHIELD_CHANCE = 0.04;

export type TossKind = 'ball' | 'bone' | 'frisbee' | 'whistle' | 'hotdog';

export type DogMood =
  | { readonly kind: 'run' }
  | { readonly kind: 'stop'; readonly until: number }
  | { readonly kind: 'back'; readonly until: number }
  | { readonly kind: 'slow'; readonly until: number }
  | { readonly kind: 'sprint'; readonly until: number };

export interface TossSpec {
  readonly name: string;
  // What the dog does when it lands: chases it back to you, stops to eat, or leaps about catching it.
  readonly mood: 'stop' | 'back' | 'slow';
  readonly ms: number;
  readonly line: string;
  readonly unlock: number;
  readonly weight: number;
}

export const TOSSES: Readonly<Record<TossKind, TossSpec>> = {
  ball: { name: '网球', mood: 'back', ms: 1200, line: '叼着球跑回来了！', unlock: 0, weight: 4 },
  bone: { name: '骨头', mood: 'stop', ms: 2000, line: '停下来啃骨头', unlock: 0, weight: 4 },
  frisbee: { name: '飞盘', mood: 'slow', ms: 3500, line: '跳起来接飞盘', unlock: 80, weight: 3 },
  whistle: { name: '喇叭', mood: 'back', ms: 2200, line: '听到喊声，回头了！', unlock: 200, weight: 1 },
  hotdog: { name: '热狗', mood: 'stop', ms: 3500, line: '热狗！吃得停不下来', unlock: 250, weight: 1 },
};

// Things only the dog reacts to: a critter sends it bolting, another dog makes it stop and sniff.
export const SNIFF_MS = 1500;
export const PEE_MS = 1300;
export const PEE_CHANCE = 0.45;
// Chasing a cat: the dog bolts after it for a while, then the cat escapes up a tree and the dog stands barking at it.
export const CAT_CHASE_MS = 3000;
export const CAT_HOP_MS = 600;
export const TREE_BARK_MS = 1300;
// Every so often the dog stops to poop, and the poop is left on the road for you to pick up.
export const POOP_EVERY_MS = [12000, 20000] as const;
export const POOP_MS = 1600;

const MOOD_PACE = { run: 1, stop: 0, back: -0.6, slow: 0.45, sprint: 1.5 } as const;

export function settleMood(mood: DogMood, now: number): DogMood {
  return mood.kind !== 'run' && now >= mood.until ? { kind: 'run' } : mood;
}

export function dogPace(mood: DogMood): number {
  return MOOD_PACE[mood.kind];
}

const DOG_START_SPEED = 240;
const DOG_GAIN_PER_S = 2.8;
const DOG_MAX_SPEED = 580;

export function dogBaseSpeed(seconds: number): number {
  return Math.min(DOG_MAX_SPEED, DOG_START_SPEED + DOG_GAIN_PER_S * seconds);
}

// On foot the owner falls further behind the longer the chase goes on.
export function footRatio(seconds: number): number {
  return Math.max(0.62, 0.76 - seconds / 900);
}

const STUNNED_RATIO = 0.25;
export const MAX_SCROLL_SPEED = 780;

export function ownerSpeed(dogBase: number, ride: RideKind | undefined, stunned: boolean, seconds: number): number {
  const ratio = stunned ? STUNNED_RATIO : ride ? RIDES[ride].ratio : footRatio(seconds);
  return Math.min(MAX_SCROLL_SPEED, dogBase * ratio);
}

// The leash holds the dog back: however hard it bolts, it can only pull away this fast, so going from right in
// front of you to lost always takes a few seconds and the warning is always seen.
export const MAX_PULL_PX_S = 300;

export function nextGap(gap: number, dogSpeed: number, ownerSpeedNow: number, dt: number): number {
  return Math.min(LOST_GAP, Math.max(CATCH_GAP, gap + Math.min(MAX_PULL_PX_S, dogSpeed - ownerSpeedNow) * dt));
}

// At the end of the leash the run is not over yet: the leash is slipping, and you have a moment to win back some
// slack (throw something, grab a ride) before it leaves your hand.
export const SLIP_MS = 800;
const SLIP_RECOVER_PX = 40;

export type Slip = { readonly kind: 'held' } | { readonly kind: 'slipping'; readonly since: number } | { readonly kind: 'lost' };

export function nextSlip(slip: Slip, gap: number, now: number): Slip {
  if (slip.kind === 'lost') return slip;
  if (slip.kind === 'held') return gap >= LOST_GAP ? { kind: 'slipping', since: now } : slip;
  if (gap <= LOST_GAP - SLIP_RECOVER_PX) return { kind: 'held' };
  return now - slip.since >= SLIP_MS ? { kind: 'lost' } : slip;
}

function weighted<K extends string>(random: () => number, table: Readonly<Record<K, { unlock: number; weight: number }>>, meters: number): K {
  const open = (Object.keys(table) as K[]).filter((k) => meters >= table[k].unlock);
  const total = open.reduce((sum, k) => sum + table[k].weight, 0);
  let roll = random() * total;
  for (const k of open) {
    roll -= table[k].weight;
    if (roll < 0) return k;
  }
  return open[open.length - 1];
}

export function pickRide(random: () => number, meters: number): RideKind {
  return weighted(random, RIDES, meters);
}

export function pickToss(random: () => number, meters: number): TossKind {
  return weighted(random, TOSSES, meters);
}

// The texture a pickup is drawn with: rides and throwables look the same in every biome.
export function chaseArt(kind: EntityKind, tag: string | undefined): string | undefined {
  if (kind === 'ride' || kind === 'toss') return `${kind}-${tag}`;
  if (kind === 'shield') return 'ride-balloon';
  if (kind === 'puddle' && tag) return `pud-${tag}`;
  return undefined;
}

export interface ChaseSpec {
  readonly kind: EntityKind;
  readonly lane: Lane;
  readonly tag?: string;
}

const OBSTACLE_START = 0.35;
const OBSTACLE_MAX = 0.6;
// Rides thin out as the chase goes on, so a run always ends.
const RIDE_CHANCE_START = 0.16;
const RIDE_CHANCE_MIN = 0.08;
const RIDE_THINNING_S = 1500;
// Rides are spread out: never two rows running, and never more than this many rows without one.
const RIDE_GAP_ROWS = 2;
const RIDE_DROUGHT_ROWS = 8;
// Rows fly by faster as the chase speeds up, so the guarantee stretches with time to stay a rescue, not a supply.
const DROUGHT_STRETCH_S = 20;
const TOSS_CHANCE = 0.11;
const MAX_EXTRAS = 2;
// Late in the chase there is more to distract the dog and less to throw at it.
const CRITTER_CHANCE = 0.08;
const CRITTER_GAIN_PER_S = 0.0004;
const TOSS_THINNING_S = 3000;
const BUDDY_CHANCE = 0.07;

function rideChance(seconds: number, rowsSinceRide: number): number {
  if (rowsSinceRide < RIDE_GAP_ROWS) return 0;
  if (rowsSinceRide >= RIDE_DROUGHT_ROWS + Math.floor(seconds / DROUGHT_STRETCH_S)) return 1;
  return Math.max(RIDE_CHANCE_MIN, RIDE_CHANCE_START - seconds / RIDE_THINNING_S);
}

function obstacleKind(random: () => number, meters: number): EntityKind {
  const open: EntityKind[] = ['pole', 'pole', ...(meters >= 20 ? (['crosser'] as const) : []), ...(meters >= 60 ? (['barrier'] as const) : []), ...(meters >= 110 ? (['puddle'] as const) : [])];
  return open[Math.floor(random() * open.length)];
}

// One row of road: at most two obstacles so a lane always stays open, then at most two pickups or dog baits.
export function planChaseRow(random: () => number, meters: number, seconds: number, rowsSinceRide: number): ChaseSpec[] {
  const lanes = [...LANES].sort(() => random() - 0.5);
  const row: ChaseSpec[] = [];
  const obstacleChance = Math.min(OBSTACLE_MAX, OBSTACLE_START + seconds / 400);
  if (random() < obstacleChance) row.push({ kind: obstacleKind(random, meters), lane: lanes.pop()! });
  if (random() < obstacleChance / 3) row.push({ kind: 'pole', lane: lanes.pop()! });
  const obstacles = row.length;
  const extras: [number, EntityKind, (() => string) | undefined][] = [
    [rideChance(seconds, rowsSinceRide), 'ride', () => pickRide(random, meters)],
    [Math.max(TOSS_CHANCE / 2, TOSS_CHANCE - seconds / TOSS_THINNING_S), 'toss', () => pickToss(random, meters)],
    [meters >= SHIELD_UNLOCK_M ? SHIELD_CHANCE : 0, 'shield', undefined],
    [meters >= 40 ? CRITTER_CHANCE + CRITTER_GAIN_PER_S * seconds : 0, 'critter', undefined],
    [meters >= 30 ? BUDDY_CHANCE : 0, 'buddy', undefined],
  ];
  for (const [chance, kind, tag] of extras) {
    if (lanes.length === 0 || row.length - obstacles >= MAX_EXTRAS) break;
    if (random() < chance) row.push({ kind, lane: lanes.pop()!, tag: tag?.() });
  }
  return row;
}
