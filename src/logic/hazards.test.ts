import { describe, expect, it } from 'vitest';
import type { Lane } from '../config';
import { CHARGE_PX_S, CHARGE_START_PX, LIGHT_MS, chargerY, nextCharger, type Charger, SHARK_LUNGE_MS, dogMeetsZone, pullTowards, swayX, SHARK_OUTRUN_TIER, zoneRow, dogReached, nextShark, nextTide, bandAt, sharkHungry, waterLanes, waveFront, withPickup, type Shark, type Tide } from './hazards';

const always = (x: number) => () => x;

function runShark(shark: Shark, ms: number, ownerLane: Lane, rideTier = 0, from = 0) {
  const events: string[] = [];
  let now = from;
  for (; now < from + ms; now += 20) {
    const step = nextShark(shark, { now, dt: 0.02, ownerLane, rideTier, random: always(0) });
    shark = step.shark;
    if (step.event) events.push(step.event);
  }
  return { shark, events, now };
}

describe('the shark', () => {
  it('appears after a while, closes in, then lunges at the lane you are in', () => {
    const { events, shark } = runShark({ kind: 'away', nextAt: 1000 }, 6000, 2);
    expect(events.slice(0, 2)).toEqual(['appear', 'lunge']);
    expect(shark.kind === 'lunge' || events.includes('bite')).toBe(true);
  });

  it('bites if you stay in its lane, misses if you dodge while it lunges', () => {
    const lunge: Shark = { kind: 'lunge', lane: 1, at: 500 };
    expect(nextShark(lunge, { now: 500, dt: 0.02, ownerLane: 1, rideTier: 0, random: always(0) }).event).toBe('bite');
    expect(nextShark(lunge, { now: 500, dt: 0.02, ownerLane: 0, rideTier: 0, random: always(0) }).event).toBe('miss');
    expect(SHARK_LUNGE_MS).toBeGreaterThanOrEqual(800);
  });

  it('gives up on a big enough boat', () => {
    const { events } = runShark({ kind: 'hunt', lane: 0, behind: 150, turnAt: 0 }, 3000, 0, SHARK_OUTRUN_TIER);
    expect(events).toEqual(['outrun']);
  });

  it('always brings a fish to feed it with, in a lane nothing else sits in', () => {
    for (const r of [0, 0.5, 0.99]) {
      const row = withPickup([{ kind: 'pole', lane: 0 }, { kind: 'pole', lane: 1 }, { kind: 'ride', lane: 2, tag: 'skate' }], 'bone', always(r));
      const fish = row.filter((s) => s.kind === 'toss');
      expect(fish).toHaveLength(1);
      expect(row.filter((s) => s.lane === fish[0].lane)).toHaveLength(1);
    }
  });

  it('is hungry, and takes what you throw, only while it is after you', () => {
    expect(sharkHungry({ kind: 'away', nextAt: 0 })).toBe(false);
    expect(sharkHungry({ kind: 'hunt', lane: 0, behind: 100, turnAt: 0 })).toBe(true);
  });
});

describe('the tide', () => {
  function roll(ownerLane: Lane, water: readonly Lane[]) {
    let tide: Tide = { kind: 'calm', nextAt: 100 };
    const events: string[] = [];
    for (let now = 0; now < 4500; now += 20) {
      const step = nextTide(tide, now, 550, ownerLane, water, always(0.9));
      tide = step.tide;
      if (step.event) events.push(step.event);
    }
    return events;
  }

  it('comes in as you go along the beach, until all three lanes are sea', () => {
    expect(waterLanes(0)).toEqual([0]);
    expect(waterLanes(0.5)).toEqual([0, 1]);
    expect(waterLanes(0.9)).toEqual([0, 1, 2]);
  });

  it('sends waves that roll over you in the water and pass you by on dry sand', () => {
    expect(roll(0, [0])).toEqual(['warn', 'hit', 'gone']);
    expect(roll(2, [0, 1])).toEqual(['warn', 'gone']);
    expect(roll(2, [0, 1, 2])).toEqual(['warn', 'hit', 'gone']);
  });

  it('sweeps its front up the screen', () => {
    const wave: Tide = { kind: 'wave', lanes: [0], start: 0, hit: false };
    expect(waveFront(wave, 0)!).toBeGreaterThan(waveFront(wave, 700)!);
  });
});

describe('zones', () => {
  it('has nothing to crash into and nothing crossing it, but keeps the pickups', () => {
    const row = zoneRow([
      { kind: 'pole', lane: 1 },
      { kind: 'crosser', lane: 0 },
      { kind: 'barrier', lane: 2 },
      { kind: 'toss', lane: 1, tag: 'ball' },
    ]);
    expect(row).toEqual([{ kind: 'toss', lane: 1, tag: 'ball' }]);
  });

  it('reach the dog even when it is far ahead, off the top of the screen', () => {
    expect(dogReached({ top: -300, bottom: 30 }, -200)).toBe(true);
    expect(dogReached({ top: -300, bottom: 30 }, 200)).toBe(false);
  });

  it('knows when you are on it', () => {
    expect(bandAt([{ top: 100, bottom: 400 }], 300)).toBeDefined();
    expect(bandAt([{ top: 100, bottom: 400 }], 550)).toBeUndefined();
  });
});

describe('the crosswalk', () => {
  it('stops the dog only while the light is red', () => {
    expect(dogMeetsZone('crosswalk', 0)).toBe('red');
    expect(dogMeetsZone('crosswalk', LIGHT_MS)).toBeUndefined();
  });
});

describe('black holes and tornadoes', () => {
  it('pull you one lane at a time towards the hole', () => {
    expect(pullTowards(0, 2)).toBe(1);
    expect(pullTowards(2, 1)).toBe(1);
  });

  it('weave a tornado across the lanes without leaving the road', () => {
    const xs = Array.from({ length: 60 }, (_, i) => swayX(180, i * 20));
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(60);
    expect(Math.max(...xs)).toBeLessThanOrEqual(300);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(150);
  });
});

describe('chargers', () => {
  function charge(spawnLane: Lane, laneThen: Lane) {
    let c: Charger = { kind: 'none', nextAt: 0 };
    const events: string[] = [];
    for (let now = 0; now < 4000; now += 20) {
      const step = nextCharger(c, now, 0.02, now === 0 ? spawnLane : laneThen, () => 0.5);
      c = step.charger;
      if (step.event) events.push(step.event);
    }
    return events;
  }

  it('aims at your lane and knocks you down if you stay in it', () => {
    expect(charge(1, 1)).toEqual(['charge_coming', 'charge_hit']);
  });

  it('misses if you move out of its lane in time', () => {
    expect(charge(1, 2)).toEqual(['charge_coming', 'charge_miss']);
  });

  it('flashes its lane for a couple of seconds before it arrives, from behind or from ahead', () => {
    expect(CHARGE_START_PX / CHARGE_PX_S).toBeGreaterThan(1.8);
    expect(chargerY('behind', 100, 550)).toBeGreaterThan(550);
    expect(chargerY('ahead', 100, 550)).toBeLessThan(550);
  });
});
