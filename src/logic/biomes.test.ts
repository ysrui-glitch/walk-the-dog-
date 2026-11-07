import { describe, expect, it } from 'vitest';
import { ART } from '../art';
import { BIOMES, biomeAt, biomeStart, pickStart, skinFor } from './biomes';

describe('biomes', () => {
  it('goes further afield the longer you chase, then loops back home', () => {
    const order: string[] = [];
    for (let m = 0; m < 2100; m += 10) if (order.at(-1) !== biomeAt(m).id) order.push(biomeAt(m).id);
    expect(order).toEqual(['city', 'park', 'beach', 'sea', 'snow', 'desert', 'prehistoric', 'space', 'city']);
  });

  it('has drawn art for every skin and decoration in every biome', () => {
    for (const biome of BIOMES) {
      for (const options of Object.values(biome.skins)) for (const key of options ?? []) expect(ART[key], key).toBeDefined();
      const own = [...Object.values(biome.rides ?? {}).map((r) => r.key), ...Object.values(biome.tosses ?? {}).map((t) => t.key), ...(biome.shield ? [biome.shield.key] : []), ...(biome.ground?.overlays ?? [])];
      for (const key of [...biome.decor, biome.perch, ...own]) expect(ART[key], key).toBeDefined();
      if (biome.skins.critter) for (const key of biome.skins.critter) expect(ART[key.replace(/-0$/, '-1')], key).toBeDefined();
    }
  });

  it('gives each biome its own critter for the dog to chase', () => {
    expect(skinFor(biomeAt(300), 'critter', () => 0)).toBe('squirrel-0');
    expect(skinFor(biomeAt(500), 'critter', () => 0)).toBe('gull-0');
  });

  it('knows where each world starts, for jumping straight there when testing', () => {
    for (const biome of BIOMES) expect(biomeAt(biomeStart(biome.id)! + 1).id).toBe(biome.id);
    expect(biomeStart('narnia')).toBeUndefined();
  });

  it('starts the first run in the city, then anywhere but the last start', () => {
    expect(pickStart(() => 0.9, true)).toBe('city');
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) {
      const start = pickStart(Math.random, false, 'snow');
      expect(start).not.toBe('snow');
      seen.add(start);
    }
    expect(seen.size).toBe(BIOMES.length - 1);
  });
});
