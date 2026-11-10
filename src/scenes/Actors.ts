import Phaser from 'phaser';
import { ART_SCALE, OWNER_HAND, type BreedId, type OwnerPose } from '../art';
import { OWNER_Y } from '../config';
import { DEFAULT_SHIELD, type Biome } from '../logic/biomes';
import { RIDES, type RideKind } from '../logic/chase';

// Characters are drawn a little smaller than their art so three lanes stay readable.
const ACTOR_SCALE = ART_SCALE * 0.8;
const DOG_FRAME_MS = 110;
const OWNER_FRAME_MS = 95;
const DUST_EVERY_MS = 130;
// Mounts and big machines from tier 3 up are drawn larger, so a camel or a triceratops is bigger than its rider.
const BIG_RIDE_TIER = 3;
const BIG_RIDE_SCALE = 1.3;

export type DogLook = 'run' | 'stand' | 'wag' | 'squat' | 'pee';

// The dog: a four-frame run that speeds up with its pace and flips round when it runs back to you, plus poses for
// stopping, eating (tail wagging) and squatting.
export class DogActor {
  readonly sprite: Phaser.GameObjects.Image;
  private readonly helmet: Phaser.GameObjects.Image;
  private frame = 0;
  private nextFrameAt = 0;

  constructor(scene: Phaser.Scene, private readonly breed: BreedId) {
    this.sprite = scene.add.image(0, 0, `dog-${breed}-run-0`).setScale(ACTOR_SCALE).setDepth(10);
    this.helmet = scene.add.image(0, 0, 'fx-helmet').setScale(ACTOR_SCALE).setDepth(11).setVisible(false);
  }

  // A space helmet sits over the dog's head, wherever the head is this frame.
  wearHelmet(on: boolean): void {
    const flip = this.sprite.flipX ? -1 : 1;
    this.helmet.setVisible(on && this.sprite.visible).setPosition(this.sprite.x + 13 * flip, this.sprite.y - 11);
  }

  // `pace` is the dog's speed relative to a normal run; negative means it is running back towards the owner.
  update(now: number, x: number, y: number, look: DogLook, pace: number, swim = false): void {
    const s = this.sprite.setPosition(x, y).setVisible(y > -30).setAngle(0).setScale(ACTOR_SCALE);
    const key = `dog-${this.breed}`;
    if (swim) {
      // In water every mood is a paddle; it just paddles faster when it is in a hurry.
      if (now >= this.nextFrameAt) {
        this.frame = (this.frame + 1) % 4;
        this.nextFrameAt = now + (DOG_FRAME_MS * 1.6) / Math.max(0.5, Math.abs(pace) || 0.5);
      }
      s.setTexture(`${key}-swim-${this.frame % 2}`).setFlipX(pace < 0);
      s.y = y + Math.sin(now / 200) * 2;
      return;
    }
    if (look === 'squat' || look === 'pee' || look === 'stand') s.setTexture(`${key}-${look}`).setFlipX(false);
    else if (look === 'wag') s.setTexture(`${key}-${Math.floor(now / 110) % 2 ? 'wag' : 'stand'}`).setFlipX(false);
    if (look !== 'run') return;
    if (now >= this.nextFrameAt) {
      this.frame = (this.frame + 1) % 4;
      this.nextFrameAt = now + DOG_FRAME_MS / Math.max(0.5, Math.abs(pace));
    }
    const up = this.frame % 2;
    s.setTexture(`${key}-run-${this.frame}`).setFlipX(pace < 0);
    s.y = y - up * 3;
    s.setScale(ACTOR_SCALE * (1 + 0.05 * up), ACTOR_SCALE * (1 - 0.05 * up));
    if (pace > 1.2) s.setAngle(-7);
  }

  // Where the leash clips on, in screen pixels.
  collar(): { x: number; y: number } {
    const flip = this.sprite.flipX ? -1 : 1;
    return { x: this.sprite.x + 6 * flip, y: this.sprite.y - 3 };
  }
}

interface RideLayout {
  readonly rideY: number;
  readonly bodyY: number;
}

// Where the owner stands on each ride (offsets from the owner's lane position).
const RIDE_LAYOUT: Record<Exclude<RideKind, 'car'>, RideLayout> = {
  skate: { rideY: 26, bodyY: -8 },
  scooter: { rideY: 18, bodyY: -14 },
  cycle: { rideY: 20, bodyY: -18 },
  moto: { rideY: 20, bodyY: -16 },
};

// The owner: running on foot, standing on a ride, hidden in the car, or tumbling, with a balloon tied on when they
// have one. Kicks up dust as they go, leaves debris when a ride breaks, and the balloon bursts when it saves them.
export class OwnerActor {
  readonly body: Phaser.GameObjects.Image;
  readonly ride: Phaser.GameObjects.Image;
  private readonly balloon: Phaser.GameObjects.Image;
  private readonly helmet: Phaser.GameObjects.Image;
  private frame = 0;
  private nextFrameAt = 0;
  private nextDustAt = 0;
  private pose: OwnerPose = 'run';

  constructor(private readonly scene: Phaser.Scene) {
    this.ride = scene.add.image(0, OWNER_Y, 'ride-skate').setScale(ACTOR_SCALE).setDepth(9).setVisible(false);
    this.body = scene.add.image(0, OWNER_Y, 'owner-run-0').setScale(ACTOR_SCALE).setDepth(10);
    this.balloon = scene.add.image(0, OWNER_Y, 'ride-balloon').setScale(ACTOR_SCALE).setDepth(11).setVisible(false);
    this.helmet = scene.add.image(0, OWNER_Y, 'fx-helmet').setScale(ACTOR_SCALE).setDepth(11).setVisible(false);
  }

  update(now: number, x: number, ride: RideKind | undefined, stunned: boolean, blinking: boolean, shielded: boolean, biome: Biome): void {
    this.pose = this.place(now, x, ride, stunned, blinking, biome);
    this.helmet.setVisible(Boolean(biome.helmet) && this.body.visible && this.pose !== 'fall').setPosition(this.body.x + 2, this.body.y - 15);
    const shield = biome.shield ?? DEFAULT_SHIELD;
    this.balloon.setVisible(shielded).setTexture(shield.key).setAngle(0);
    if (shield.worn) {
      // A life ring sits round the waist, or bobs beside the boat when the owner is inside one.
      const at = this.body.visible ? { x: this.body.x, y: this.body.y + 6 } : { x: this.ride.x - 8, y: this.ride.y - 4 };
      this.balloon.setPosition(at.x, at.y);
    } else {
      const hand = this.hand();
      this.balloon.setPosition(hand.x + 4, hand.y - 34 + Math.sin(now / 220) * 3).setAngle(Math.sin(now / 300) * 8);
    }
  }

  private place(now: number, x: number, ride: RideKind | undefined, stunned: boolean, blinking: boolean, biome: Biome): OwnerPose {
    const b = this.body.setVisible(true).setAngle(0).setPosition(x, OWNER_Y).setScale(ACTOR_SCALE);
    b.setAlpha(blinking ? 0.5 + 0.5 * Math.sin(now / 60) : 1);
    this.ride.setVisible(false).setAngle(0);
    if (stunned) {
      b.setTexture('owner-fall').setAngle(10 * Math.sin(now / 60));
      return 'fall';
    }
    if (!ride && biome.swim) {
      if (now >= this.nextFrameAt) {
        this.frame = (this.frame + 1) % 4;
        this.nextFrameAt = now + OWNER_FRAME_MS * 2;
      }
      b.setTexture(`owner-swim-${this.frame % 2}`).setY(OWNER_Y + 8 + Math.sin(now / 200) * 2);
      this.dust(now, x, OWNER_Y + 22);
      return 'run';
    }
    if (!ride) {
      if (now >= this.nextFrameAt) {
        this.frame = (this.frame + 1) % 4;
        this.nextFrameAt = now + OWNER_FRAME_MS;
      }
      b.setTexture(`owner-run-${this.frame}`);
      b.y = OWNER_Y - (this.frame % 2) * 3;
      this.dust(now, x, OWNER_Y + 28);
      return 'run';
    }
    const big = RIDES[ride].tier >= BIG_RIDE_TIER ? BIG_RIDE_SCALE : 1;
    this.ride.setVisible(true).setTexture(biome.rides?.[ride]?.key ?? `ride-${ride}`).setScale(ACTOR_SCALE * big);
    if (ride === 'car') {
      b.setVisible(false);
      this.ride.setPosition(x, OWNER_Y + 4).setAngle(Math.sin(now / 50) * 1.2);
      this.dust(now, x - 34, OWNER_Y + 16);
      return 'ride';
    }
    const layout = RIDE_LAYOUT[ride];
    const rattle = Math.sin(now / 45) * 1.2;
    this.ride.setPosition(x, OWNER_Y + layout.rideY + rattle);
    // The standing surface sits 6 art units above the ride's centre, so a bigger ride lifts its rider a little.
    b.setTexture('owner-ride').setY(OWNER_Y + layout.bodyY + rattle - (big - 1) * 12);
    this.dust(now, x - 20, OWNER_Y + layout.rideY + 8);
    return 'ride';
  }

  // The balloon takes the hit: it swells, bursts into scraps and is gone.
  popBalloon(): void {
    const { x, y } = this.balloon;
    const burst = this.scene.add.image(x, y, 'ride-balloon').setScale(ACTOR_SCALE).setDepth(12);
    this.scene.tweens.add({ targets: burst, scale: ACTOR_SCALE * 1.8, alpha: 0, duration: 180, onComplete: () => burst.destroy() });
    for (let i = 0; i < 5; i++) {
      const scrap = this.scene.add.rectangle(x, y, 6, 4, 0xff5c7a).setDepth(12);
      const angle = (i / 5) * Math.PI * 2;
      this.scene.tweens.add({ targets: scrap, x: x + Math.cos(angle) * 40, y: y + Math.sin(angle) * 40, angle: 300, alpha: 0, duration: 420, onComplete: () => scrap.destroy() });
    }
  }

  // Where the leash leaves the owner's hand, in screen pixels.
  hand(): { x: number; y: number } {
    if (!this.body.visible) return { x: this.ride.x + 6, y: this.ride.y - 12 };
    const offset = OWNER_HAND[this.pose];
    return { x: this.body.x + offset.x * 0.8, y: this.body.y + offset.y * 0.8 };
  }

  // A ride that breaks scatters wheels, bolts and a plank across the road.
  breakRide(): void {
    const { x, y } = this.ride;
    for (const [key, dx] of [['fx-wheel', -1], ['fx-wheel', 1], ['fx-bolt', -0.5], ['fx-plank', 0.6]] as const) {
      const piece = this.scene.add.image(x, y, key).setScale(ART_SCALE).setDepth(12);
      this.scene.tweens.add({
        targets: piece,
        x: x + dx * Phaser.Math.Between(50, 90),
        y: y + Phaser.Math.Between(20, 60),
        angle: Phaser.Math.Between(-540, 540),
        alpha: 0,
        duration: 650,
        ease: 'Quad.easeOut',
        onComplete: () => piece.destroy(),
      });
      this.scene.tweens.add({ targets: piece, y: y - Phaser.Math.Between(40, 70), duration: 260, ease: 'Quad.easeOut', yoyo: true });
    }
  }

  private dust(now: number, x: number, y: number): void {
    if (now < this.nextDustAt) return;
    this.nextDustAt = now + DUST_EVERY_MS;
    const puff = this.scene.add.image(x + Phaser.Math.Between(-4, 4), y, 'fx-dust').setScale(ART_SCALE * 0.6).setDepth(8).setAlpha(0.8);
    this.scene.tweens.add({ targets: puff, y: y + 34, scale: ART_SCALE * 1.4, alpha: 0, duration: 420, onComplete: () => puff.destroy() });
  }
}
