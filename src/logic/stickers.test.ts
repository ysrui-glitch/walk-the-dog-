import { describe, expect, it } from 'vitest';
import { ART } from '../art';
import type { ScoreStore } from './best';
import { BIOMES } from './biomes';
import { STICKERS, STICKERS_KEY, loadStickers, pageOf, saveStickers, stickerFor } from './stickers';

const memoryStore = (): ScoreStore => {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

describe('sticker album', () => {
  it('has six stickers in every world, each with drawn art and its own event', () => {
    for (const biome of BIOMES) {
      const page = pageOf(biome.id);
      expect(page, biome.id).toHaveLength(6);
      expect(new Set(page.map((s) => s.on)).size, biome.id).toBe(6);
      for (const s of page) expect(ART[s.art], s.id).toBeDefined();
    }
    expect(new Set(STICKERS.map((s) => s.id)).size).toBe(STICKERS.length);
  });

  it('finds the sticker for something done in a world, and none for things that world has no sticker for', () => {
    expect(stickerFor('desert', 'braved')?.name).toBe('骆驼勇士');
    expect(stickerFor('sea', 'poop')).toBeUndefined();
  });

  it('remembers stickers earned, and ignores junk or an unreadable store', () => {
    const store = memoryStore();
    saveStickers(new Set(['city-red', 'sea-feed']), store);
    expect([...loadStickers(store)].sort()).toEqual(['city-red', 'sea-feed']);
    store.setItem(STICKERS_KEY, JSON.stringify(['city-red', 'nope', 3]));
    expect([...loadStickers(store)]).toEqual(['city-red']);
    store.setItem(STICKERS_KEY, '{oops');
    expect(loadStickers(store).size).toBe(0);
    expect(loadStickers({ getItem: () => { throw new Error('blocked'); }, setItem: () => undefined }).size).toBe(0);
  });
});
