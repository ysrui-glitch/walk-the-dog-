import { describe, expect, it } from 'vitest';
import { BEST_DISTANCE_KEY, loadBest, recordScore, type ScoreStore } from './best';

const memoryStore = (): ScoreStore => {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

describe('best score', () => {
  it('records only a higher score as a new best', () => {
    const store = memoryStore();
    expect(recordScore(120, store)).toEqual({ best: 120, isNew: true });
    expect(recordScore(80, store)).toEqual({ best: 120, isNew: false });
    expect(loadBest(store)).toBe(120);
  });

  it('keeps the farthest distance separately from the best score', () => {
    const store = memoryStore();
    recordScore(900, store);
    recordScore(300, store, BEST_DISTANCE_KEY);
    expect(loadBest(store)).toBe(900);
    expect(loadBest(store, BEST_DISTANCE_KEY)).toBe(300);
  });

  it('survives storage that throws or is missing', () => {
    const broken: ScoreStore = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadBest(broken)).toBe(0);
    expect(recordScore(50, broken)).toEqual({ best: 50, isNew: true });
    expect(recordScore(50, undefined)).toEqual({ best: 50, isNew: true });
  });
});
