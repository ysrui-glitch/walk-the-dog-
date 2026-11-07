export const BEST_SCORE_KEY = 'walk-the-dog:best';
export const BEST_DISTANCE_KEY = 'walk-the-dog:best-distance';

export interface ScoreStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

// GamePix runs games in an iframe where localStorage can be missing or wiped, so every access is guarded.
export function defaultStore(): ScoreStore | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function loadBest(store: ScoreStore | undefined = defaultStore(), key = BEST_SCORE_KEY): number {
  try {
    const value = Number(store?.getItem(key));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

export function recordScore(
  score: number,
  store: ScoreStore | undefined = defaultStore(),
  key = BEST_SCORE_KEY,
): { best: number; isNew: boolean } {
  const previous = loadBest(store, key);
  if (score <= previous) return { best: previous, isNew: false };
  try {
    store?.setItem(key, String(score));
  } catch {
    // The record still shows for this session even if it can't persist.
  }
  return { best: score, isNew: true };
}
