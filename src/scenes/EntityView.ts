import Phaser from 'phaser';
import { ART_SCALE } from '../art';
import { skinFor, type Biome } from '../logic/biomes';
import { RIDES, chaseArt, type RideKind, type TossKind } from '../logic/chase';
import { isGood, isObstacle, xOf, type Entity } from '../logic/world';

// Rides sit on a disc coloured by tier (green, cyan, blue, purple, gold) with their stars underneath.
const TIER_COLORS = [0x66bb6a, 0x26c6da, 0x3d8bfd, 0xab47bc, 0xffb300];
const RIDE_SCALE = 1.1;

interface Mark {
  readonly obj: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject;
  readonly dy: number;
  readonly pulse: boolean;
}

// How entities look. What sits on a shadow is to be avoided; pickups say what they are at a glance: rides on a
// coloured disc with stars, things to throw in a small yellow glow, a protective balloon or ring in pink.
export class EntityView {
  private readonly sprites = new Map<number, Phaser.GameObjects.Image>();
  private readonly marks = new Map<number, Mark[]>();

  // Other dogs on the road never wear the player's own breed, so a passing dog is never mistaken for yours.
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly breed?: string,
  ) {}

  private isOwnDog(key: string): boolean {
    return this.breed !== undefined && (key === `buddy-${this.breed}` || key.startsWith(`dog-${this.breed}-`));
  }

  create(e: Entity, biome: Biome): void {
    const x = xOf(e);
    const marks: Mark[] = [];
    const local =
      e.kind === 'ride' ? biome.rides?.[e.tag as RideKind]?.key : e.kind === 'shield' ? biome.shield?.key : e.kind === 'toss' ? biome.tosses?.[e.tag as TossKind]?.key : undefined;
    let key = e.skin ?? (local ?? chaseArt(e.kind, e.tag) ?? skinFor(biome, e.kind, Math.random));
    if (this.isOwnDog(key)) key = (biome.skins[e.kind] ?? []).find((k) => !this.isOwnDog(k)) ?? key;
    const sprite = this.scene.add.image(x, e.y, key).setScale(ART_SCALE * (e.kind === 'ride' ? RIDE_SCALE : 1));
    sprite.setDepth(e.kind === 'puddle' ? 2 : 4);
    const add = (obj: Mark['obj'], dy = 0, pulse = false) => marks.push({ obj, dy, pulse });
    if (e.kind === 'ride') {
      const tier = RIDES[e.tag as RideKind]?.tier ?? 1;
      add(this.scene.add.circle(x, e.y, 30, TIER_COLORS[tier - 1], 0.45).setStrokeStyle(3, 0xffffff, 0.9).setDepth(3));
      add(this.scene.add.text(x, e.y, '★'.repeat(tier), { fontSize: '12px', color: '#ffeb3b', fontStyle: 'bold' }).setOrigin(0.5).setDepth(5).setStroke('#2b2118', 3), 30);
    } else if (e.kind === 'toss') {
      add(this.scene.add.circle(x, e.y, 18, 0xffeb3b, 0.4).setStrokeStyle(2, 0xffc107).setDepth(3), 0, true);
    } else if (e.kind === 'shield') {
      add(this.scene.add.circle(x, e.y, 24, 0xff80ab, 0.35).setStrokeStyle(2, 0xff4081).setDepth(3), 0, true);
    } else if (e.kind === 'boost') {
      add(this.scene.add.circle(x, e.y, 26, 0x7cf3ff, 0.35).setStrokeStyle(3, 0x00e5ff).setDepth(3), 0, true);
    } else if (e.kind === 'poop') {
      add(this.scene.add.circle(x, e.y, 20, 0xa5d6a7, 0.4).setStrokeStyle(2, 0x66bb6a).setDepth(3), 0, true);
    }
    if (isObstacle(e.kind)) add(this.scene.add.ellipse(x, e.y + 20, 40, 10, 0x000000, 0.25).setDepth(3), 20);
    if (e.kind === 'crosser') {
      // Crosser art faces right; the arrows warn which way it is heading.
      const right = (e.vx ?? 0) > 0;
      sprite.setFlipX(!right);
      add(
        this.scene.add
          .text(x, e.y - 30, right ? '▶▶' : '◀◀', { fontSize: '18px', color: '#ff1744', fontStyle: 'bold' })
          .setOrigin(0.5)
          .setDepth(5)
          .setStroke('#ffffff', 4),
        -30,
      );
    }
    if (e.kind === 'buddy') sprite.setFlipX(true);
    this.sprites.set(e.id, sprite);
    this.marks.set(e.id, marks);
  }

  sync(e: Entity, now: number): void {
    const sprite = this.sprites.get(e.id);
    if (!sprite) return;
    const x = xOf(e);
    sprite.setPosition(x, e.y);
    // A giant snowball grows and spins as it rolls closer.
    if (e.grows) sprite.setScale(ART_SCALE * (0.7 + 0.65 * Phaser.Math.Clamp((e.y + 60) / 620, 0, 1))).setAngle(-e.y * 0.9);
    if (isGood(e.kind)) sprite.setScale(ART_SCALE * (e.kind === 'ride' ? RIDE_SCALE : 1) * (1 + 0.06 * Math.sin(now / 140 + e.id)));
    for (const { obj, dy, pulse } of this.marks.get(e.id) ?? []) {
      obj.setPosition(x, e.y + dy);
      if (pulse) (obj as Phaser.GameObjects.Arc).setAlpha(0.7 + 0.3 * Math.sin(now / 140 + e.id));
    }
  }

  // Collected: a quick squash-and-stretch pop, then gone.
  fade(id: number): void {
    const sprite = this.take(id);
    if (!sprite) return;
    const base = sprite.scale;
    this.scene.tweens.chain({
      targets: sprite,
      tweens: [
        { scaleX: base * 1.35, scaleY: base * 0.75, duration: 70 },
        { scaleX: base * 0.8, scaleY: base * 1.3, y: sprite.y - 10, duration: 90 },
        { scale: 0, alpha: 0, duration: 140, ease: 'Back.easeIn' },
      ],
      onComplete: () => sprite.destroy(),
    });
  }

  remove(id: number): void {
    this.take(id)?.destroy();
  }

  // Hands the sprite over for a custom exit (flying into the pocket); its glow and shadow go immediately.
  take(id: number): Phaser.GameObjects.Image | undefined {
    const sprite = this.sprites.get(id);
    this.sprites.delete(id);
    for (const { obj } of this.marks.get(id) ?? []) obj.destroy();
    this.marks.delete(id);
    return sprite;
  }
}
