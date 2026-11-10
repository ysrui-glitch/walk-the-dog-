import { LANES, type Lane } from '../config';
import type { ChaseSpec, RideKind, TossKind } from './chase';

// Every world has rules of its own, so a new world asks for a new kind of play, not just new pictures. Each pairs a
// threat you can answer three ways (dodge it, throw something at it, or outrun it on a ride) with a lucky break you
// have to go and take. The rules are data on each world (`WorldRules`); the mechanics below are shared between them.

// Something that hunts you from behind and lunges at your lane: the sea's shark, the T-rex. Throwing it food sends it
// away; a big enough ride outruns it.
export interface ChaserRule {
  readonly art: string;
  readonly name: string;
  // What each one brings for you to feed it with.
  readonly feed: TossKind;
  // Its footsteps shake the screen.
  readonly stomps?: boolean;
}

// A band across the road that something happens on. The dog reacts when it gets there; the owner may too.
export type ZoneKind = 'crosswalk';

export interface ZoneRule {
  readonly kind: ZoneKind;
  readonly rows: number;
  readonly every: readonly [number, number];
}

// Something that rolls or rides down a lane at you, faster than the road: dodge it, smash it with a car, or (if the
// world has a hard throwable) knock it over with a throw.
export interface RollerRule {
  readonly art: string;
  readonly every: readonly [number, number];
  readonly first: number;
  readonly pxS: number;
  readonly grows?: boolean;
  // Weaves from lane to lane as it comes.
  readonly sways?: boolean;
  // What it brings for you to throw at it.
  readonly owed?: TossKind;
  readonly warn: string;
  readonly hit: string;
  // A ride that goes straight through it unharmed (a camel through a tornado), and what it says when it does.
  readonly braves?: { readonly ride: RideKind; readonly perk: string; readonly line: string };
}

// Something that charges down a lane at you, aimed at the lane you are in, either up from behind (a husky sled) or
// diving in from ahead (a pterodactyl). Its lane flashes red for a couple of seconds first: get out of it.
export interface ChargerRule {
  readonly art: string;
  readonly name: string;
  readonly from: 'behind' | 'ahead';
}

export interface WorldRules {
  readonly chaser?: ChaserRule;
  readonly charger?: ChargerRule;
  readonly tide?: boolean;
  readonly zone?: ZoneRule;
  readonly roller?: RollerRule;
  // A stray dog that runs at yours to play.
  readonly stray?: { readonly art: string };
  // Black holes that pull you into their lane.
  readonly holes?: boolean;
}

// The chaser (named for the first one, the sea's shark) closes in from behind and lunges at your lane. Dodge sideways
// while it lunges, outrun it on a big ride, or throw it something to eat (which then doesn't go to the dog).
export type Shark =
  | { readonly kind: 'away'; readonly nextAt: number }
  | { readonly kind: 'hunt'; readonly lane: Lane; readonly behind: number; readonly turnAt: number }
  | { readonly kind: 'lunge'; readonly lane: Lane; readonly at: number };

export type SharkEvent = 'appear' | 'lunge' | 'bite' | 'miss' | 'outrun';

export const SHARK_EVERY_MS = [9000, 14000] as const;
export const SHARK_FIRST_MS = 12000;
export const SHARK_START_BEHIND = 200;
export const SHARK_LUNGE_BEHIND = 36;
export const SHARK_LUNGE_MS = 900;
const SHARK_CLOSE_PX_S = 60;
const SHARK_FALL_BACK_PX_S = 110;
const SHARK_GIVE_UP_BEHIND = 240;
const SHARK_TURN_MS = 700;
// From this ride tier up (pedalo, jet ski, speedboat) the shark can't keep up.
export const SHARK_OUTRUN_TIER = 3;

export interface SharkInput {
  readonly now: number;
  readonly dt: number;
  readonly ownerLane: Lane;
  readonly rideTier: number;
  readonly random: () => number;
}

export const between = (random: () => number, [lo, hi]: readonly [number, number]): number => lo + random() * (hi - lo);

export function sharkAway(now: number, random: () => number): Shark {
  return { kind: 'away', nextAt: now + between(random, SHARK_EVERY_MS) };
}

export function nextShark(shark: Shark, { now, dt, ownerLane, rideTier, random }: SharkInput): { shark: Shark; event?: SharkEvent } {
  if (shark.kind === 'away') {
    if (now < shark.nextAt) return { shark };
    const lane = LANES[Math.floor(random() * LANES.length)];
    return { shark: { kind: 'hunt', lane, behind: SHARK_START_BEHIND, turnAt: now + SHARK_TURN_MS }, event: 'appear' };
  }
  if (shark.kind === 'lunge') {
    if (now < shark.at) return { shark };
    return { shark: sharkAway(now, random), event: ownerLane === shark.lane ? 'bite' : 'miss' };
  }
  const behind = shark.behind + (rideTier >= SHARK_OUTRUN_TIER ? SHARK_FALL_BACK_PX_S : -SHARK_CLOSE_PX_S) * dt;
  if (behind >= SHARK_GIVE_UP_BEHIND) return { shark: sharkAway(now, random), event: 'outrun' };
  if (behind <= SHARK_LUNGE_BEHIND) return { shark: { kind: 'lunge', lane: shark.lane, at: now + SHARK_LUNGE_MS }, event: 'lunge' };
  // It drifts one lane at a time towards you, a beat behind, so the lane it lunges in can be read.
  const turn = now >= shark.turnAt && shark.lane !== ownerLane;
  const lane = turn ? ((shark.lane + Math.sign(ownerLane - shark.lane)) as Lane) : shark.lane;
  return { shark: { kind: 'hunt', lane, behind, turnAt: turn ? now + SHARK_TURN_MS : shark.turnAt } };
}

// Anything thrown while the shark is after you goes to the shark instead, and it swims off with it.
export function sharkHungry(shark: Shark): boolean {
  return shark.kind !== 'away';
}

// 海滩: the sea is always at one side of the beach, and the tide comes in as you go: one lane of water at first,
// then two, and by the end of the beach all three, leading out into the open sea. Waves keep rolling up through the
// water from behind: on a ride you surf them and shoot forward; caught on foot they knock you down. When a wave
// draws back it leaves something on the sand.
export type Tide =
  | { readonly kind: 'calm'; readonly nextAt: number }
  | { readonly kind: 'warn'; readonly lanes: readonly Lane[]; readonly until: number }
  | { readonly kind: 'wave'; readonly lanes: readonly Lane[]; readonly start: number; readonly hit: boolean };

export type TideEvent = 'warn' | 'hit' | 'gone';

export const WAVE_EVERY_MS = [2500, 4000] as const;
export const TIDE_FIRST_MS = 4000;
export const TIDE_WARN_MS = 1500;
// The wave front sweeps from below the screen to above it in this long.
export const WAVE_MS = 1400;
const WAVE_FROM_Y = 700;
const WAVE_TO_Y = -60;
export const SURF_MS = 2500;
export const SURF_BOOST = 1.45;
// Wading through the shallows on foot is a little slower.
export const WADE_FACTOR = 0.85;
// How far along the beach (0 to 1) the tide has reached the second and the third lane.
const TIDE_STEPS = [0.35, 0.7] as const;

// The lanes under water this far along the beach; the sea is on the left.
export function waterLanes(progress: number): readonly Lane[] {
  return LANES.slice(0, 1 + TIDE_STEPS.filter((step) => progress >= step).length);
}

export function tideCalm(now: number, random: () => number): Tide {
  return { kind: 'calm', nextAt: now + between(random, WAVE_EVERY_MS) };
}

// Screen y of the wave's foaming front.
export function waveFront(tide: Tide, now: number): number | undefined {
  if (tide.kind !== 'wave') return undefined;
  return WAVE_FROM_Y + (WAVE_TO_Y - WAVE_FROM_Y) * Math.min(1, (now - tide.start) / WAVE_MS);
}

// A wave covers the water lanes there are when it is announced. `hit` fires once, as its front passes the owner's
// row, and only if the owner is in one of its lanes.
export function nextTide(tide: Tide, now: number, ownerY: number, ownerLane: Lane, water: readonly Lane[], random: () => number): { tide: Tide; event?: TideEvent } {
  if (tide.kind === 'calm') {
    if (now < tide.nextAt) return { tide };
    return { tide: { kind: 'warn', lanes: water, until: now + TIDE_WARN_MS }, event: 'warn' };
  }
  if (tide.kind === 'warn') return now < tide.until ? { tide } : { tide: { kind: 'wave', lanes: tide.lanes, start: now, hit: false } };
  if (now - tide.start >= WAVE_MS) return { tide: tideCalm(now, random), event: 'gone' };
  if (tide.hit || waveFront(tide, now)! > ownerY) return { tide };
  return { tide: { ...tide, hit: true }, event: tide.lanes.includes(ownerLane) ? 'hit' : undefined };
}

export type Charger =
  | { readonly kind: 'none'; readonly nextAt: number }
  // `d` is how far it still is from the owner's row, in pixels; it goes negative once it has gone past.
  | { readonly kind: 'coming' | 'passing'; readonly lane: Lane; readonly d: number };

export type ChargerEvent = 'charge_coming' | 'charge_hit' | 'charge_miss';

export const CHARGE_EVERY_MS = [6000, 9000] as const;
export const CHARGE_FIRST_MS = 5000;
// It starts well off screen so its lane flashes for a couple of seconds before it arrives.
export const CHARGE_START_PX = 450;
export const CHARGE_PX_S = 210;
const CHARGE_GONE_PX = 700;

export function chargerIdle(now: number, random: () => number): Charger {
  return { kind: 'none', nextAt: now + between(random, CHARGE_EVERY_MS) };
}

export function nextCharger(c: Charger, now: number, dt: number, ownerLane: Lane, random: () => number): { charger: Charger; event?: ChargerEvent } {
  if (c.kind === 'none') {
    if (now < c.nextAt) return { charger: c };
    return { charger: { kind: 'coming', lane: ownerLane, d: CHARGE_START_PX }, event: 'charge_coming' };
  }
  const d = c.d - CHARGE_PX_S * dt;
  if (c.kind === 'passing') return { charger: d < -CHARGE_GONE_PX ? chargerIdle(now, random) : { ...c, d } };
  if (d > 0) return { charger: { ...c, d } };
  return { charger: { kind: 'passing', lane: c.lane, d }, event: ownerLane === c.lane ? 'charge_hit' : 'charge_miss' };
}

// Screen y of a charger `d` pixels from the owner's row.
export function chargerY(from: ChargerRule['from'], d: number, ownerY: number): number {
  return from === 'behind' ? ownerY + d : ownerY - d;
}

// Zones. At a crosswalk (城市) the dog stops and waits if the light is red. Zones are clear of obstacles; nothing
// crosses them.
export const RED_WAIT_MS = 1300;
export const LIGHT_MS = 2000;

export type DogZoneEvent = 'red';

export function lightAt(now: number): 'red' | 'green' {
  return Math.floor(now / LIGHT_MS) % 2 === 0 ? 'red' : 'green';
}

// What the dog does on reaching a zone, if anything.
export function dogMeetsZone(kind: ZoneKind, now: number): DogZoneEvent | undefined {
  if (kind === 'crosswalk' && lightAt(now) === 'red') return 'red';
  return undefined;
}

// A swaying roller weaves across the lanes on a slow sine.
export function swayX(baseX: number, y: number): number {
  return Math.max(60, Math.min(300, baseX + 100 * Math.sin(y / 110)));
}

// 野狗 (公园): a stray dashes out from the roadside next to you and runs up the road at your dog, in plain view the
// whole way. If it gets there, the two of them bolt off together; throw it something and it goes off with that instead.
export const STRAY_EVERY_MS = [10000, 14000] as const;
export const STRAY_FIRST_MS = 5000;
export const STRAY_PX_S = 200;
export const PESTER_MS = 2000;

// 黑洞 (太空): a black hole drifts down a lane, pulling you one lane closer every so often while it's ahead of you.
// Swipe away from it; if it reaches you in its lane, you're swallowed. It stops pulling for the last stretch, so
// there is always time to swipe clear after its last pull.
export const HOLE_EVERY_MS = [6000, 9000] as const;
export const HOLE_FIRST_MS = 5000;
export const PULL_MS = 1000;
export const PULL_MIN_AHEAD_PX = 120;
export const PULL_RANGE_PX = 420;

export function pullTowards(ownerLane: Lane, holeLane: Lane): Lane {
  return (ownerLane + Math.sign(holeLane - ownerLane)) as Lane;
}

export interface Band {
  // Screen y of a zone's far (top) and near (bottom) edges.
  readonly top: number;
  readonly bottom: number;
}

export function bandAt<P extends Band>(ponds: readonly P[], y: number): P | undefined {
  return ponds.find((p) => y >= p.top && y <= p.bottom);
}

// The dog reaches a zone once its near edge is level with the dog or behind it. A dog far ahead, off the top of the
// screen, has already run over it by the time it appears, so it reacts then.
export function dogReached(band: Band, dogY: number): boolean {
  return dogY <= band.bottom;
}

// Nothing to crash into in a zone, and nothing crossing it.
export function zoneRow(row: readonly ChaseSpec[]): ChaseSpec[] {
  return row.filter((spec) => spec.kind !== 'crosser' && !isBlocking(spec.kind));
}

function isBlocking(kind: ChaseSpec['kind']): boolean {
  return kind === 'pole' || kind === 'barrier' || kind === 'puddle';
}

// A hazard you can answer with something to throw brings one with it: the next row offers it, in a lane cleared for
// it. A fish to feed the shark; a snowball to smash a giant one; a bone for a stray.
export function withPickup(row: readonly ChaseSpec[], tag: string, random: () => number): ChaseSpec[] {
  const lane = LANES[Math.floor(random() * LANES.length)];
  return [...row.filter((spec) => spec.lane !== lane), { kind: 'toss', lane, tag }];
}
