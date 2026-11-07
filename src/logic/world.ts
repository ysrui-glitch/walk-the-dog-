import { LANE_X, type Lane } from '../config';

export type EntityKind =
  // Things that knock the owner over.
  | 'pole'
  | 'barrier'
  | 'crosser'
  | 'puddle'
  // Things the owner grabs: a ride, something to throw, or a balloon to tie on.
  | 'ride'
  | 'toss'
  | 'shield'
  // Things only the dog cares about: a critter to chase, another dog to sniff.
  | 'critter'
  | 'buddy'
  // Left behind by the dog, for the owner to pick up.
  | 'poop';

export interface Entity {
  readonly id: number;
  readonly kind: EntityKind;
  // A crosser drifts across the road, so its lane follows its x; everything else keeps the lane it spawned in.
  lane: Lane;
  x?: number;
  vx?: number;
  // Which ride or throwable a pickup holds.
  readonly tag?: string;
  y: number;
  consumed: boolean;
  ignoredByDog: boolean;
}

const OBSTACLES: ReadonlySet<EntityKind> = new Set(['pole', 'barrier', 'crosser']);
const GOOD: ReadonlySet<EntityKind> = new Set(['ride', 'toss', 'shield', 'poop']);

export function xOf(e: Entity): number {
  return e.x ?? LANE_X[e.lane];
}

export function laneAt(x: number): Lane {
  return Math.max(0, Math.min(2, Math.round((x - LANE_X[0]) / (LANE_X[1] - LANE_X[0])))) as Lane;
}

export function isObstacle(kind: EntityKind): boolean {
  return OBSTACLES.has(kind);
}

// Drives the visual language: good things glow and bob, bad things sit on a shadow.
export function isGood(kind: EntityKind): boolean {
  return GOOD.has(kind);
}
