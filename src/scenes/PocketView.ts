import Phaser from 'phaser';
import { ART_SCALE } from '../art';
import { HEIGHT } from '../config';

const SLOT_X = 26;
const SLOT_GAP = 40;
const SLOT_Y = HEIGHT - 28;

// The row of pocket slots along the bottom. When the dog is about to get away and there is something to throw,
// the first slot pulses and the hint turns into a shout.
export class PocketView {
  private readonly slots: Phaser.GameObjects.Arc[];
  private readonly icons: Phaser.GameObjects.Image[];
  private readonly hint: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, size: number) {
    this.slots = Array.from({ length: size }, (_, i) =>
      scene.add.circle(this.slot(i).x, SLOT_Y, 17, 0x000000, 0.25).setStrokeStyle(2, 0xffffff, 0.7).setDepth(20),
    );
    this.icons = Array.from({ length: size }, (_, i) => scene.add.image(this.slot(i).x, SLOT_Y, 'toss-ball').setScale(ART_SCALE * 0.9).setDepth(21).setVisible(false));
    this.hint = scene.add
      .text(this.slot(size).x - 8, SLOT_Y, '轻点扔', { fontSize: '15px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0, 0.5)
      .setDepth(21)
      .setStroke('#2b2118', 4);
  }

  slot(i: number): { x: number; y: number } {
    return { x: SLOT_X + i * SLOT_GAP, y: SLOT_Y };
  }

  // `pocket` holds the texture of each item, in this world's look.
  render(pocket: readonly string[], urgent: boolean, now: number): void {
    const pulse = urgent && pocket.length > 0 ? 1 + 0.18 * Math.abs(Math.sin(now / 110)) : 1;
    this.icons.forEach((icon, i) => {
      const kind = pocket[i];
      icon.setVisible(kind !== undefined);
      if (kind) icon.setTexture(kind).setScale(ART_SCALE * 0.9 * (i === 0 ? pulse : 1));
    });
    this.slots[0].setScale(pulse).setStrokeStyle(2, urgent && pocket.length > 0 ? 0xff5252 : 0xffffff, 0.9);
    this.hint.setText(urgent && pocket.length > 0 ? '快扔！' : '轻点扔').setColor(urgent && pocket.length > 0 ? '#ff8a80' : '#ffffff');
  }
}
