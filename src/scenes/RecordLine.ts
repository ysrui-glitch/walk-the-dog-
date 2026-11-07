import Phaser from 'phaser';
import { HEIGHT, OWNER_Y, WIDTH } from '../config';
import { sfx } from '../sfx';

export const PX_PER_METER = 40;
const CONFETTI = [0xff5c7a, 0xffd84a, 0x3d8bfd, 0x2fb67c, 0xff7a1a];

// Your farthest walk drawn across the road, Doodle Jump style: you see it coming and get a party when you pass it.
export class RecordLine {
  private readonly line: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private passed: boolean;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly bestMeters: number,
  ) {
    this.line = scene.add.graphics().setDepth(2);
    this.label = scene.add
      .text(WIDTH / 2, 0, `最远 ${bestMeters}m`, { fontSize: '16px', color: '#fff', fontStyle: 'bold', backgroundColor: '#e53935' })
      .setPadding(6, 2, 6, 2)
      .setOrigin(0.5)
      .setDepth(2)
      .setVisible(false);
    this.passed = bestMeters <= 0;
  }

  // Returns true on the frame the record is broken.
  update(meters: number): boolean {
    if (this.passed) return false;
    const y = OWNER_Y - (this.bestMeters - meters) * PX_PER_METER;
    const onScreen = y > -30 && y < HEIGHT + 30;
    this.line.clear();
    this.label.setVisible(onScreen);
    if (onScreen) {
      for (let x = 30; x < WIDTH - 30; x += 24) this.line.fillStyle(0xe53935, 1).fillRect(x, y - 2, 14, 4);
      this.label.setY(y - 14);
    }
    if (meters < this.bestMeters) return false;
    this.passed = true;
    this.line.clear();
    this.label.setVisible(false);
    this.celebrate();
    return true;
  }

  private celebrate(): void {
    sfx.record();
    this.scene.cameras.main.flash(250, 255, 255, 255);
    for (let i = 0; i < 18; i++) {
      const piece = this.scene.add
        .rectangle(Phaser.Math.Between(40, WIDTH - 40), OWNER_Y, 10, 16, Phaser.Utils.Array.GetRandom(CONFETTI))
        .setStrokeStyle(2, 0xffffff)
        .setDepth(40);
      this.scene.tweens.add({
        targets: piece,
        y: Phaser.Math.Between(80, 360),
        x: piece.x + Phaser.Math.Between(-60, 60),
        angle: Phaser.Math.Between(-360, 360),
        alpha: 0,
        duration: Phaser.Math.Between(900, 1400),
        ease: 'Cubic.easeOut',
        onComplete: () => piece.destroy(),
      });
    }
    const banner = this.scene.add
      .text(WIDTH / 2, 150, '破纪录！', { fontSize: '28px', color: '#ffeb3b', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(40)
      .setStroke('#2b2118', 6)
      .setScale(0.3);
    this.scene.tweens.add({ targets: banner, scale: 1, duration: 300, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: banner, alpha: 0, delay: 1200, duration: 400, onComplete: () => banner.destroy() });
  }
}
