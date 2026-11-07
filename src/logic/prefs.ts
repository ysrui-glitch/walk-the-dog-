import { BREEDS, type BreedId } from '../art/characters';
import { defaultStore, type ScoreStore } from './best';

export const BREED_KEY = 'walk-the-dog:breed';
export const DEFAULT_BREED: BreedId = 'golden';

// Which dog you walk. Anything stored that isn't a known breed (old saves, a wiped store) falls back to the default.
export function loadBreed(store: ScoreStore | undefined = defaultStore()): BreedId {
  try {
    const saved = store?.getItem(BREED_KEY);
    return saved && Object.hasOwn(BREEDS, saved) ? (saved as BreedId) : DEFAULT_BREED;
  } catch {
    return DEFAULT_BREED;
  }
}

export function saveBreed(id: BreedId, store: ScoreStore | undefined = defaultStore()): void {
  try {
    store?.setItem(BREED_KEY, id);
  } catch {
    // The choice still applies for this session even if it can't persist.
  }
}
