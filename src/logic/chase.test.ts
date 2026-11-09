import { describe, expect, it } from 'vitest';
import { RIDE_PERKS, hasPerk, newPerk, SHIELD_UNLOCK_M, CATCH_GAP, LOST_GAP, MAX_PULL_PX_S, RIDES, RIDE_TOP_UP_MS, SLIP_MS, dogBaseSpeed, mountRide, nextSlip, dogPace, nextGap, ownerSpeed, pickRide, planChaseRow, settleMood } from './chase';
import { isObstacle } from './world';

function seeded(seed: number): () => number {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

describe('the chase', () => {
  it('a better ride takes over; a lesser one never downgrades, it tops up the ride you are on', () => {
    expect(mountRide(undefined, 'skate', 0)).toEqual({ kind: 'skate', until: RIDES.skate.ms });
    expect(mountRide({ kind: 'skate', until: 1000 }, 'moto', 500)).toEqual({ kind: 'moto', until: 500 + RIDES.moto.ms });
    expect(mountRide({ kind: 'moto', until: 3000 }, 'skate', 2000)).toEqual({ kind: 'moto', until: 3000 + RIDE_TOP_UP_MS });
    expect(mountRide({ kind: 'moto', until: 6000 }, 'scooter', 2000).until).toBeLessThanOrEqual(2000 + RIDES.moto.ms);
  });

  it('gives each star a new perk, and keeps every perk of the rides below', () => {
    const ladder = ['skate', 'scooter', 'cycle', 'moto', 'car'] as const;
    expect(ladder.map(newPerk)).toEqual(['hop', 'bell', 'basket', 'bump', 'smash']);
    for (const [i, ride] of ladder.entries()) for (const lower of ladder.slice(0, i + 1)) expect(hasPerk(ride, newPerk(lower)), `${ride} ${lower}`).toBe(true);
    expect(hasPerk('scooter', 'basket')).toBe(false);
    expect(hasPerk(undefined, 'hop')).toBe(false);
    for (const perk of Object.values(RIDE_PERKS)) expect(perk.line.length).toBeGreaterThan(0);
  });

  it('each better ride is clearly faster than the one before', () => {
    const ladder = (['skate', 'scooter', 'cycle', 'moto', 'car'] as const).map((k) => RIDES[k].ratio);
    for (let i = 1; i < ladder.length; i++) expect(ladder[i] - ladder[i - 1]).toBeGreaterThan(0.14);
  });

  it('spreads rides out in time: none right after one, always one after a long drought, both longer later on', () => {
    const random = seeded(5);
    const ride = (seconds: number, sinceRide: number) => planChaseRow(random, 500, seconds, sinceRide).some((s) => s.kind === 'ride');
    for (let i = 0; i < 200; i++) {
      expect(ride(0, 0.5)).toBe(false);
      expect(ride(0, 5)).toBe(true);
      expect(ride(180, 4)).toBe(false);
      expect(ride(180, 20)).toBe(true);
    }
  });

  it('on foot the owner loses ground; on any ride they win it back', () => {
    const dog = dogBaseSpeed(30);
    expect(ownerSpeed(dog, undefined, false, 30)).toBeLessThan(dog);
    for (const ride of Object.keys(RIDES) as (keyof typeof RIDES)[]) expect(ownerSpeed(dog, ride, false, 30)).toBeGreaterThan(dog);
  });

  it('a stunned owner barely moves, even on a ride', () => {
    expect(ownerSpeed(300, 'car', true, 0)).toBeLessThan(ownerSpeed(300, undefined, false, 0));
  });

  it('the dog speeds up over the run', () => {
    expect(dogBaseSpeed(120)).toBeGreaterThan(dogBaseSpeed(0));
  });

  it('however fast the dog bolts, getting from your feet to lost takes over 3.5 seconds, slip included', () => {
    let gap = CATCH_GAP;
    let t = 0;
    while (gap < LOST_GAP) {
      gap = nextGap(gap, 900, 0, 0.1);
      t += 0.1;
    }
    expect(t).toBeGreaterThanOrEqual((LOST_GAP - CATCH_GAP) / MAX_PULL_PX_S - 0.1);
    expect(t + SLIP_MS / 1000).toBeGreaterThan(3.5);
  });

  it('at the end of the leash it slips for a moment, and winning back slack saves it', () => {
    const slipping = nextSlip({ kind: 'held' }, LOST_GAP, 1000);
    expect(slipping).toEqual({ kind: 'slipping', since: 1000 });
    expect(nextSlip(slipping, LOST_GAP, 1000 + SLIP_MS - 1).kind).toBe('slipping');
    expect(nextSlip(slipping, LOST_GAP - 60, 1500)).toEqual({ kind: 'held' });
    expect(nextSlip(slipping, LOST_GAP, 1000 + SLIP_MS)).toEqual({ kind: 'lost' });
  });

  it('the gap grows while the dog is faster and never closes past catching distance', () => {
    expect(nextGap(300, 300, 200, 1)).toBe(400);
    expect(nextGap(100, 0, 400, 1)).toBe(CATCH_GAP);
  });

  it('a thrown ball brings the dog back; a bone stops it; moods wear off', () => {
    expect(dogPace({ kind: 'back', until: 1000 })).toBeLessThan(0);
    expect(dogPace({ kind: 'stop', until: 1000 })).toBe(0);
    expect(settleMood({ kind: 'stop', until: 1000 }, 1500)).toEqual({ kind: 'run' });
    expect(settleMood({ kind: 'stop', until: 1000 }, 500).kind).toBe('stop');
  });

  it('better rides only turn up further along the walk', () => {
    const random = seeded(7);
    const early = new Set(Array.from({ length: 300 }, () => pickRide(random, 10)));
    expect([...early]).toEqual(['skate']);
    const late = new Set(Array.from({ length: 300 }, () => pickRide(random, 1000)));
    expect(late.has('car')).toBe(true);
  });

  it('balloons only turn up once the walk is under way', () => {
    const random = seeded(3);
    const rows = (meters: number) => Array.from({ length: 3000 }, () => planChaseRow(random, meters, 60, 3)).flat();
    expect(rows(SHIELD_UNLOCK_M - 1).some((s) => s.kind === 'shield')).toBe(false);
    expect(rows(SHIELD_UNLOCK_M + 100).some((s) => s.kind === 'shield')).toBe(true);
  });

  it('every row leaves at least one lane free of obstacles', () => {
    const random = seeded(11);
    for (let i = 0; i < 2000; i++) {
      const row = planChaseRow(random, 500, 300, 3);
      const blocked = new Set(row.filter((s) => isObstacle(s.kind) || s.kind === 'puddle').map((s) => s.lane));
      expect(blocked.size).toBeLessThan(3);
      expect(new Set(row.map((s) => s.lane)).size).toBe(row.length);
    }
  });
});
