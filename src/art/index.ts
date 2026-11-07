import type Phaser from 'phaser';
import { BREEDS, POODLE, cat, crab, dog, dogSwim, owner, ownerSwim, squirrel, type BreedId } from './characters';
import { SEA_ART } from './sea';
import { WORLDKIT_ART } from './worldkit';
import { BARRIER_ART, CROSSER_ART, DECOR_ART, FX_ART, OBSTACLE_ART, POOP_ART, PUDDLE_ART, RIDE_ART, TOSS_ART } from './props';
import type { Art } from './sticker';
import { WORLD_ART } from './worlds';

export { ART_SCALE } from './sticker';
export { BREEDS, OWNER_HAND, type BreedId, type DogPose, type OwnerPose } from './characters';

const prefixed = (prefix: string, table: Readonly<Record<string, Art>>): Record<string, Art> =>
  Object.fromEntries(Object.entries(table).map(([name, art]) => [`${prefix}-${name}`, art]));
const frames = (name: string, count: number, draw: (phase: number) => Art): Record<string, Art> =>
  Object.fromEntries(Array.from({ length: count }, (_, i) => [`${name}-${i}`, draw(i)]));

// Each selectable breed: `dog-<breed>-run-0..3`, `-stand`, `-wag`, `-squat`, `-pee`, and `buddy-<breed>` for the road.
function breedArt(id: BreedId): Record<string, Art> {
  const b = BREEDS[id];
  return {
    ...frames(`dog-${id}-run`, 4, (i) => dog(b, 'run', i)),
    [`dog-${id}-stand`]: dog(b, 'stand'),
    [`dog-${id}-wag`]: dog(b, 'stand', 2),
    [`dog-${id}-squat`]: dog(b, 'squat'),
    [`dog-${id}-pee`]: dog(b, 'pee'),
    ...frames(`dog-${id}-swim`, 2, (i) => dogSwim(b, i)),
    [`buddy-${id}`]: dog(b, 'stand', 1),
  };
}

// Every texture in the game, by key. Frame sets are named `<name>-<frame>`.
export const ART: Readonly<Record<string, Art>> = {
  ...Object.assign({}, ...(Object.keys(BREEDS) as BreedId[]).map((id) => breedArt(id))),
  'buddy-poodle': dog(POODLE, 'stand', 1),
  ...frames('owner-run', 4, (i) => owner('run', i)),
  'owner-ride': owner('ride'),
  'owner-fall': owner('fall'),
  ...frames('owner-swim', 2, ownerSwim),
  ...frames('cat-orange', 2, (i) => cat('#f39b4c', '#c96f22', i)),
  ...frames('squirrel', 2, squirrel),
  ...frames('crab', 2, crab),
  ...prefixed('ride', RIDE_ART),
  ...prefixed('toss', TOSS_ART),
  ...prefixed('ob', OBSTACLE_ART),
  ...prefixed('bar', BARRIER_ART),
  ...prefixed('cross', CROSSER_ART),
  ...prefixed('pud', PUDDLE_ART),
  poop: POOP_ART,
  ...prefixed('fx', FX_ART),
  ...prefixed('dec', DECOR_ART),
  ...WORLD_ART,
  ...SEA_ART,
  ...WORLDKIT_ART,
};

// Rasterises every SVG into a texture. Resolves once all are ready; a texture that fails to decode is reported and
// skipped so the game still starts (Phaser shows its missing-texture box in its place).
export function loadArt(textures: Phaser.Textures.TextureManager): Promise<void> {
  const jobs = Object.entries(ART).map(
    ([key, art]) =>
      new Promise<void>((resolve) => {
        if (textures.exists(key)) return resolve();
        const img = new Image();
        img.onload = () => {
          textures.addImage(key, img);
          resolve();
        };
        img.onerror = () => {
          console.error(`art: could not draw "${key}"`);
          resolve();
        };
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(art.svg)}`;
      }),
  );
  return Promise.all(jobs).then(() => undefined);
}
