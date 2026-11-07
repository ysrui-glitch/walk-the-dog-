import Phaser from 'phaser';
import { HEIGHT, WIDTH } from '../config';
import { ART_SCALE } from '../art';
import { BEST_DISTANCE_KEY, recordScore } from '../logic/best';
import { loadBreed } from '../logic/prefs';

export interface EndData {
  readonly score: number;
  readonly meters: number;
  readonly lines: readonly string[];
}

export class EndScene extends Phaser.Scene {
  constructor() {
    super('end');
  }

  create(data: EndData): void {
    const records = { score: recordScore(data.score), distance: recordScore(data.meters, undefined, BEST_DISTANCE_KEY) };
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x5d6d7e).setOrigin(0);
    this.add.text(WIDTH / 2, 120, '狗狗跑丢了！', { fontSize: '32px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    // The dog trots off into the distance on a loop.
    const breed = loadBreed();
    const dog = this.add.image(WIDTH / 2, 200, `dog-${breed}-run-0`).setScale(ART_SCALE);
    let frame = 0;
    this.time.addEvent({ delay: 110, loop: true, callback: () => dog.setTexture(`dog-${breed}-run-${(frame = (frame + 1) % 4)}`) });
    this.tweens.add({ targets: dog, x: WIDTH + 60, duration: 2200, repeat: -1, onRepeat: () => dog.setX(-60) });
    this.add.text(WIDTH / 2, 290, String(data.score), { fontSize: '56px', color: '#ffd54f', fontStyle: 'bold' }).setOrigin(0.5);

    if (records.score.isNew) {
      const banner = this.add.text(WIDTH / 2, 345, '新纪录！', { fontSize: '26px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
      this.tweens.add({ targets: banner, scale: 1.15, yoyo: true, repeat: -1, duration: 400 });
    } else {
      this.add.text(WIDTH / 2, 345, `最高 ${records.score.best}`, { fontSize: '22px', color: '#fff' }).setOrigin(0.5);
    }

    const farthest = records.distance;
    const distance = `追了 ${data.meters}m${farthest.isNew ? '  最远纪录！' : `   最远 ${farthest.best}m`}`;
    this.add
      .text(WIDTH / 2, 420, [distance, ...data.lines].join('\n'), { fontSize: '20px', color: '#fff', align: 'center', lineSpacing: 8 })
      .setOrigin(0.5);
    const again = this.add.text(WIDTH / 2, 530, '点击再追一次', { fontSize: '26px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    this.tweens.add({ targets: again, alpha: 0.4, yoyo: true, repeat: -1, duration: 600 });

    const restart = () => this.scene.start('game');
    this.time.delayedCall(400, () => {
      this.input.once('pointerup', restart);
      this.input.keyboard?.once('keydown-SPACE', restart);
    });
  }
}
