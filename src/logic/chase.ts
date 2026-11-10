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
  // How fast it feels, shown as stars when you grab it. Each star also adds a perk (see RIDE_PERKS).
  readonly tier: number;
}

export const RIDES: Readonly<Record<RideKind, RideSpec>> = {
  skate: { name: '滑板', ratio: 1.08, ms: 6000, unlock: 0, weight: 5, tier: 1 },
  scooter: { name: '滑板车', ratio: 1.2, ms: 6000, unlock: 60, weight: 4, tier: 2 },
  cycle: { name: '自行车', ratio: 1.33, ms: 5500, unlock: 180, weight: 3, tier: 3 },
  moto: { name: '电动车', ratio: 1.48, ms: 5000, unlock: 300, weight: 2, tier: 4 },
  car: { name: '汽车', ratio: 1.68, ms: 4500, unlock: 450, weight: 1, tier: 5 },
};

// What each star adds on top of the speed, and a ride keeps every perk below its own: a skateboard hops puddles, a
// scooter's bell makes crossers wait, a bike's basket scoops up things in the next lane, a motorbike knocks small
// obstacles flying, and a car smashes through everything.
export type RidePerk = 'hop' | 'bell' | 'basket' | 'bump' | 'smash';

export const RIDE_PERKS: Readonly<Record<RidePerk, { readonly tier: number; readonly line: string }>> = {
  hop: { tier: 1, line: '跳过水坑' },
  bell: { tier: 2, line: '按铃让路' },
  basket: { tier: 3, line: '旁边道的东西也能捡' },
  bump: { tier: 4, line: '撞开小障碍' },
  smash: { tier: 5, line: '撞飞所有障碍' },
};

export function hasPerk(ride: RideKind | undefined, perk: RidePerk): boolean {
  return ride !== undefined && RIDES[ride].tier >= RIDE_PERKS[perk].tier;
}

// The perk a ride brings that the rides below it don't.
export function newPerk(ride: RideKind): RidePerk {
  return (Object.keys(RIDE_PERKS) as RidePerk[]).find((perk) => RIDE_PERKS[perk].tier === RIDES[ride].tier)!;
}

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
const DOG_MAX_SPEED = 495;

export function dogBaseSpeed(seconds: number): number {
  return Math.min(DOG_MAX_SPEED, DOG_START_SPEED + DOG_GAIN_PER_S * seconds);
}

// On foot the owner falls further behind the longer the chase goes on.
export function footRatio(seconds: number): number {
  return Math.max(0.62, 0.76 - seconds / 900);
}

const STUNNED_RATIO = 0.25;
export const MAX_SCROLL_SPEED = 665;

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

function weighted<K extends string>(random: () => number, table: Readonly<Record<K, { weight: number }>>, isOpen: (k: K) => boolean): K {
  const open = (Object.keys(table) as K[]).filter(isOpen);
  const total = open.reduce((sum, k) => sum + table[k].weight, 0);
  let roll = random() * total;
  for (const k of open) {
    roll -= table[k].weight;
    if (roll < 0) return k;
  }
  return open[open.length - 1];
}

// Better rides open up further along the walk, or sooner for a good owner: each poop you pick up opens the next one
// (the first opens the bike, the second the motorbike, the third the car).
const POOP_OPENS_FROM_TIER = 3;

export function rideOpen(kind: RideKind, meters: number, poops: number): boolean {
  const { unlock, tier } = RIDES[kind];
  return meters >= unlock || (tier >= POOP_OPENS_FROM_TIER && tier < POOP_OPENS_FROM_TIER + poops);
}

// What picking up one more poop would open, if anything is still locked. Only the bike and up open this way; the
// scooter comes with distance alone.
export function nextPoopRide(meters: number, poops: number): RideKind | undefined {
  return (Object.keys(RIDES) as RideKind[]).find((kind) => RIDES[kind].tier >= POOP_OPENS_FROM_TIER && !rideOpen(kind, meters, poops));
}

export function pickRide(random: () => number, meters: number, poops = 0): RideKind {
  return weighted(random, RIDES, (kind) => rideOpen(kind, meters, poops));
}

export function pickToss(random: () => number, meters: number): TossKind {
  return weighted(random, TOSSES, (kind) => meters >= TOSSES[kind].unlock);
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
  // Drawn with this texture instead of the world's usual one for its kind.
  readonly skin?: string;
}

const OBSTACLE_START = 0.35;
const OBSTACLE_MAX = 0.6;
// Rides thin out as the chase goes on, so a run always ends.
const RIDE_CHANCE_START = 0.16;
const RIDE_CHANCE_MIN = 0.08;
const RIDE_THINNING_S = 1500;
// Rides are spread out in time, not in rows (rows fly by faster as the chase speeds up): a while at least between two,
// and never longer than the drought without one. Both stretch as the chase goes on, so a run always ends.
const RIDE_GAP_S = 1;
const GAP_STRETCH = 1 / 45;
const RIDE_DROUGHT_S = 4;
const DROUGHT_STRETCH = 1 / 18;
const TOSS_CHANCE = 0.09;
const MAX_EXTRAS = 2;
// Late in the chase there is more to distract the dog and less to throw at it.
const CRITTER_CHANCE = 0.08;
const CRITTER_GAIN_PER_S = 0.0004;
const TOSS_THINNING_S = 3000;
const BUDDY_CHANCE = 0.07;

function rideChance(seconds: number, sinceRide: number): number {
  if (sinceRide < RIDE_GAP_S + seconds * GAP_STRETCH) return 0;
  if (sinceRide >= RIDE_DROUGHT_S + seconds * DROUGHT_STRETCH) return 1;
  return Math.max(RIDE_CHANCE_MIN, RIDE_CHANCE_START - seconds / RIDE_THINNING_S);
}

function obstacleKind(random: () => number, meters: number): EntityKind {
  const open: EntityKind[] = ['pole', 'pole', ...(meters >= 20 ? (['crosser'] as const) : []), ...(meters >= 60 ? (['barrier'] as const) : []), ...(meters >= 110 ? (['puddle'] as const) : [])];
  return open[Math.floor(random() * open.length)];
}

// One row of road: at most two obstacles so a lane always stays open, then at most two pickups or dog baits.
export interface RowPlan {
  readonly meters: number;
  readonly seconds: number;
  // Seconds since the last ride was laid out.
  readonly sinceRide: number;
  // Whether something for the dog (a cat, a gull, another dog) may turn up now; there is never more than one at a
  // time, so the road stays easy to read.
  readonly baitAllowed?: boolean;
  // Poops picked up this run, which open better rides early.
  readonly poops?: number;
  // A ride just opened by a poop: the next ride laid out is this one, so the reward shows up straight away.
  readonly promised?: RideKind;
}

export function planChaseRow(random: () => number, { meters, seconds, sinceRide, baitAllowed = true, poops = 0, promised }: RowPlan): ChaseSpec[] {
  const lanes = [...LANES].sort(() => random() - 0.5);
  const row: ChaseSpec[] = [];
  const obstacleChance = Math.min(OBSTACLE_MAX, OBSTACLE_START + seconds / 400);
  if (random() < obstacleChance) row.push({ kind: obstacleKind(random, meters), lane: lanes.pop()! });
  if (random() < obstacleChance / 3) row.push({ kind: 'pole', lane: lanes.pop()! });
  const obstacles = row.length;
  const extras: [number, EntityKind, (() => string) | undefined][] = [
    [rideChance(seconds, sinceRide), 'ride', () => promised ?? pickRide(random, meters, poops)],
    [Math.max(TOSS_CHANCE / 2, TOSS_CHANCE - seconds / TOSS_THINNING_S), 'toss', () => pickToss(random, meters)],
    [meters >= SHIELD_UNLOCK_M ? SHIELD_CHANCE : 0, 'shield', undefined],
    [baitAllowed && meters >= 40 ? CRITTER_CHANCE + CRITTER_GAIN_PER_S * seconds : 0, 'critter', undefined],
    [baitAllowed && meters >= 30 ? BUDDY_CHANCE : 0, 'buddy', undefined],
  ];
  for (const [chance, kind, tag] of extras) {
    if (lanes.length === 0 || row.length - obstacles >= MAX_EXTRAS) break;
    // One thing for the dog per row at most: a critter and another dog together would be two at once.
    if (kind === 'buddy' && row.some((spec) => spec.kind === 'critter')) continue;
    if (random() < chance) row.push({ kind, lane: lanes.pop()!, tag: tag?.() });
  }
  return row;
}
