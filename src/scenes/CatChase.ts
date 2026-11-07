import Phaser from 'phaser';
import { ART_SCALE } from '../art';
import { LANE_X, WIDTH, type Lane } from '../config';
import { CAT_CHASE_MS, CAT_HOP_MS } from '../logic/chase';

const CAT_LEAD_PX = 48;
const CAT_MOVE_SPEED = 420;
const CAT_FRAME_MS = 120;

// The cat-chase set piece: a critter darts just ahead of the dog, hopping lanes so the dog swerves after it, until
// it shoots up a tree at the roadside and leaves the dog barking underneath.
export class CatChase {
  private sprite: Phaser.GameObjects.Image | undefined;
  private frames: readonly [string, string] = ['cat-orange-0', 'cat-orange-1'];
  private lane: Lane = 1;
  private until = 0;
  private nextHop = 0;

  constructor(private readonly scene: Phaser.Scene) {}

  get active(): boolean {
    return this.sprite !== undefined;
  }

  // The lane the dog is chasing into.
  get target(): Lane {
    return this.lane;
  }

  // `skin` is the critter's first run frame (`<name>-0`); its second frame is `<name>-1`.
  start(skin: string, lane: Lane, x: number, y: number, now: number): void {
    this.sprite?.destroy();
    this.frames = [skin, skin.replace(/-0$/, '-1')];
    this.sprite = this.scene.add.image(x, y - CAT_LEAD_PX, skin).setScale(ART_SCALE * 0.8).setDepth(11);
    this.lane = lane;
    this.until = now + CAT_CHASE_MS;
    this.nextHop = now + CAT_HOP_MS;
  }

  // Returns true on the frame the cat reaches its tree.
  update(now: number, dogY: number, dt: number, tree: string): boolean {
    const sprite = this.sprite;
    if (!sprite) return false;
    if (now >= this.until) {
      this.climb(sprite, tree);
      return true;
    }
    if (now >= this.nextHop) {
      const options = ([0, 1, 2] as const).filter((lane) => Math.abs(lane - this.lane) === 1);
      this.lane = Phaser.Utils.Array.GetRandom(options);
      this.nextHop = now + CAT_HOP_MS;
    }
    const to = LANE_X[this.lane];
    sprite.x += Math.sign(to - sprite.x) * Math.min(Math.abs(to - sprite.x), CAT_MOVE_SPEED * dt);
    sprite.y = Math.max(20, dogY - CAT_LEAD_PX);
    sprite.setTexture(this.frames[Math.floor(now / CAT_FRAME_MS) % 2]).setFlipX(to < sprite.x - 1);
    return false;
  }

  // Something you threw caught the dog's eye instead: the cat slips away.
  escape(): void {
    const sprite = this.sprite;
    if (!sprite) return;
    this.sprite = undefined;
    this.scene.tweens.add({ targets: sprite, y: sprite.y - 200, alpha: 0, duration: 500, onComplete: () => sprite.destroy() });
  }

  private climb(sprite: Phaser.GameObjects.Image, tree: string): void {
    this.sprite = undefined;
    const side = sprite.x < WIDTH / 2 ? 22 : WIDTH - 22;
    const trunk = this.scene.add.image(side, sprite.y, tree).setScale(ART_SCALE * 1.1).setDepth(10);
    this.scene.tweens.add({ targets: sprite, x: side, y: sprite.y - 30, duration: 300 });
    this.scene.tweens.add({ targets: [sprite, trunk], alpha: 0, delay: 1800, duration: 400, onComplete: () => [sprite, trunk].forEach((o) => o.destroy()) });
  }
}
