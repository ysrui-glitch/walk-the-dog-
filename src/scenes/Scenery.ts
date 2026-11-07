import Phaser from 'phaser';
import { HEIGHT, WIDTH } from '../config';
import { ART_SCALE } from '../art';
import type { Biome } from '../logic/biomes';

const DASH_GAP = 80;
const VERGE = 30;
const DECOR_GAP = 70;
const OVERLAY_GAP = 40;

// Everything that is only scenery: the ground colour, lane dashes (city only), texture over the whole ground (wave
// crests, grass tufts...) and decorations along the edges of the current biome.
export class Scenery {
  private readonly left: Phaser.GameObjects.Rectangle;
  private readonly right: Phaser.GameObjects.Rectangle;
  private readonly road: Phaser.GameObjects.Rectangle;
  private readonly dashes: Phaser.GameObjects.Rectangle[] = [];
  private decor: Phaser.GameObjects.Image[] = [];
  private overlays: Phaser.GameObjects.Image[] = [];
  private overlayDistance = 0;
  private decorDistance = 0;
  private biome: Biome;

  constructor(
    private readonly scene: Phaser.Scene,
    biome: Biome,
  ) {
    this.biome = biome;
    this.left = scene.add.rectangle(0, 0, VERGE, HEIGHT, biome.colors.left).setOrigin(0);
    this.right = scene.add.rectangle(WIDTH - VERGE, 0, VERGE, HEIGHT, biome.colors.right).setOrigin(0);
    this.road = scene.add.rectangle(VERGE, 0, WIDTH - 2 * VERGE, HEIGHT, biome.colors.road).setOrigin(0);
    for (const x of [130, 230]) {
      for (let y = -DASH_GAP; y < HEIGHT + DASH_GAP; y += DASH_GAP) {
        this.dashes.push(scene.add.rectangle(x, y, 4, 36, biome.colors.dash, biome.colors.dashAlpha));
      }
    }
    this.markLanes(biome);
  }

  private markLanes(biome: Biome): void {
    for (const dash of this.dashes) dash.setVisible((biome.ground?.laneMark ?? 'dash') === 'dash');
  }

  scroll(dy: number): void {
    const span = Math.ceil((HEIGHT + 2 * DASH_GAP) / DASH_GAP) * DASH_GAP;
    for (const dash of this.dashes) {
      dash.y += dy;
      if (dash.y > HEIGHT + DASH_GAP) dash.y -= span;
    }
    this.overlayDistance += dy;
    if (this.overlayDistance >= OVERLAY_GAP) {
      this.overlayDistance -= OVERLAY_GAP;
      this.plantOverlay();
    }
    for (const o of this.overlays) o.y += dy;
    this.overlays = this.overlays.filter((o) => (o.y > HEIGHT + 30 ? (o.destroy(), false) : true));
    this.decorDistance += dy;
    if (this.decorDistance >= DECOR_GAP) {
      this.decorDistance -= DECOR_GAP;
      this.plantDecor();
    }
    for (const d of this.decor) d.y += dy;
    const gone = this.decor.filter((d) => d.y > HEIGHT + 30);
    gone.forEach((d) => d.destroy());
    this.decor = this.decor.filter((d) => d.y <= HEIGHT + 30);
  }

  // Crossfade into the next biome so the change of scenery reads as travelling, not as a cut.
  enter(biome: Biome): void {
    this.biome = biome;
    const from = [this.left, this.right, this.road].map((r) => Phaser.Display.Color.ValueToColor(r.fillColor));
    const to = [biome.colors.left, biome.colors.right, biome.colors.road].map((c) => Phaser.Display.Color.ValueToColor(c));
    const mix = { t: 0 };
    this.scene.tweens.add({
      targets: mix,
      t: 100,
      duration: 900,
      onUpdate: () => {
        [this.left, this.right, this.road].forEach((rect, i) => {
          const c = Phaser.Display.Color.Interpolate.ColorWithColor(from[i], to[i], 100, mix.t);
          rect.setFillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
        });
      },
    });
    for (const dash of this.dashes) dash.setFillStyle(biome.colors.dash, biome.colors.dashAlpha);
    this.markLanes(biome);
  }

  // Texture over the whole ground, under everything that matters: a wave crest here, a glint there.
  private plantOverlay(): void {
    const keys = this.biome.ground?.overlays;
    if (!keys?.length || Math.random() < 0.55) return;
    const o = this.scene.add.image(Phaser.Math.Between(20, WIDTH - 20), -20, Phaser.Utils.Array.GetRandom([...keys])).setScale(ART_SCALE).setDepth(1).setAlpha(0.6);
    this.overlays.push(o);
  }

  private plantDecor(): void {
    for (const x of [VERGE / 2, WIDTH - VERGE / 2]) {
      if (Math.random() < 0.6) continue;
      const key = Phaser.Utils.Array.GetRandom([...this.biome.decor]);
      this.decor.push(this.scene.add.image(x, -30, key).setScale(ART_SCALE * 0.75).setDepth(1));
    }
  }
}
