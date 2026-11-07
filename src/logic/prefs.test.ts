import { describe, expect, it } from 'vitest';
import type { ScoreStore } from './best';
import { BREED_KEY, DEFAULT_BREED, loadBreed, saveBreed } from './prefs';

const memoryStore = (): ScoreStore => {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

describe('chosen breed', () => {
  it('remembers the breed you picked', () => {
    const store = memoryStore();
    saveBreed('husky', store);
    expect(loadBreed(store)).toBe('husky');
  });

  it('falls back to the default for nothing saved, junk, or a broken store', () => {
    const store = memoryStore();
    expect(loadBreed(store)).toBe(DEFAULT_BREED);
    store.setItem(BREED_KEY, 'toString');
    expect(loadBreed(store)).toBe(DEFAULT_BREED);
    store.setItem(BREED_KEY, 'unicorn');
    expect(loadBreed(store)).toBe(DEFAULT_BREED);
    expect(loadBreed({ getItem: () => { throw new Error('blocked'); }, setItem: () => undefined })).toBe(DEFAULT_BREED);
  });
});
