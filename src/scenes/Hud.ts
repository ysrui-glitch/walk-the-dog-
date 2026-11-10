import Phaser from 'phaser';

// The bar under the score: whatever the scene wants the player to watch (how far away the dog is).
export interface Meter {
  readonly fill: number;
  readonly color: number;
  readonly label: string;
  readonly labelColor: string;
  readonly blink: boolean;
}

const BAR_X = 12;
const BAR_Y = 46;
const BAR_W = 150;
const BAR_H = 10;

export class Hud {
  private readonly status: Phaser.GameObjects.Text;
  private readonly bar: Phaser.GameObjects.Graphics;
  private readonly meterLabel: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const shadow = (t: Phaser.GameObjects.Text) => t.setDepth(20).setShadow(1, 1, '#000', 2);
    this.status = shadow(scene.add.text(BAR_X, 14, '', { fontSize: '20px', color: '#fff', fontStyle: 'bold' }));
    this.meterLabel = shadow(
      scene.add.text(BAR_X + BAR_W + 8, BAR_Y + BAR_H / 2, '', { fontSize: '14px', color: '#fff', fontStyle: 'bold' }).setOrigin(0, 0.5),
    );
    this.bar = scene.add.graphics().setDepth(20);
    this.hint = shadow(scene.add.text(BAR_X, BAR_Y + BAR_H + 6, '', { fontSize: '13px', color: '#c5e1a5', fontStyle: 'bold' }));
  }

  // `hint`: a short line under the bar, such as what picking up the next poop will open.
  render(score: number, meters: number, best: number, meter: Meter, now: number, hint = ''): void {
    const bestText = best > 0 ? `  最高 ${best}` : '';
    this.status.setText(`${Math.floor(score)}  ${meters}m${bestText}`);
    const alpha = meter.blink ? 0.55 + 0.45 * Math.sin(now / 70) : 1;
    this.bar
      .clear()
      .fillStyle(0x000000, 0.35)
      .fillRoundedRect(BAR_X, BAR_Y, BAR_W, BAR_H, 4)
      .fillStyle(meter.color, alpha)
      .fillRoundedRect(BAR_X, BAR_Y, Math.max(4, BAR_W * meter.fill), BAR_H, 4);
    this.meterLabel.setText(meter.label).setColor(meter.labelColor).setAlpha(alpha);
    this.hint.setText(hint);
  }
}
