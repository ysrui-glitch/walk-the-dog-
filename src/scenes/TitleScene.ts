import Phaser from 'phaser';
import { ART_SCALE, BREEDS, type BreedId } from '../art';
import { HEIGHT, WIDTH } from '../config';
import { loadBest } from '../logic/best';
import { loadBreed, saveBreed } from '../logic/prefs';

const HOW_TO = [
  '狗突然狂奔了！你是主人，快追！',
  '左右滑动换车道，轻点或上滑扔东西',
  '捡滑板、自行车、汽车才追得上',
  '网球让狗跑回来，骨头让它停下',
  '看到猫，先扔东西，不然狗就追猫去了',
  '绳子拉到头会脱手，狗就跑丢了',
];

const PICKER_Y = 268;
const PICKER_GAP = 56;

export class TitleScene extends Phaser.Scene {
  private breed: BreedId = 'golden';

  constructor() {
    super('title');
  }

  create(): void {
    this.breed = loadBreed();
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x6abe5a).setOrigin(0);
    this.add
      .text(WIDTH / 2, 84, '遛狗大作战', { fontSize: '44px', color: '#fff', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setStroke('#2e5d27', 6);
    this.chaseIntro();
    this.breedPicker();
    this.add
      .text(WIDTH / 2, 410, HOW_TO.join('\n'), { fontSize: '14px', color: '#fff', align: 'center', lineSpacing: 8, wordWrap: { width: WIDTH - 24 } })
      .setOrigin(0.5);

    const best = loadBest();
    if (best > 0) this.add.text(WIDTH / 2, 520, `最高 ${best}`, { fontSize: '20px', color: '#ffd54f', fontStyle: 'bold' }).setOrigin(0.5).setStroke('#2e5d27', 4);

    const start = this.add.text(WIDTH / 2, 575, '点击开始', { fontSize: '28px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setStroke('#2e5d27', 6);
    this.tweens.add({ targets: start, alpha: 0.3, yoyo: true, repeat: -1, duration: 600 });

    const go = () => this.scene.start('game');
    // A tap on a breed picks the dog; a tap anywhere else starts the chase.
    this.input.on('pointerup', (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length === 0) go();
    });
    this.input.keyboard?.once('keydown-SPACE', go);
  }

  // A row of dog portraits under the picture; the chosen one sits on a highlighted tile and is remembered.
  private breedPicker(): void {
    const ids = Object.keys(BREEDS) as BreedId[];
    const tiles = ids.map((id, i) => {
      const x = WIDTH / 2 + (i - (ids.length - 1) / 2) * PICKER_GAP;
      const tile = this.add.rectangle(x, PICKER_Y, 52, 62, 0xffffff, 0.18).setStrokeStyle(2, 0xffffff, 0.5);
      this.add.image(x, PICKER_Y - 8, `buddy-${id}`).setScale(ART_SCALE * 0.6);
      this.add.text(x, PICKER_Y + 21, BREEDS[id].name, { fontSize: id === 'tugou' ? '9px' : '11px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setStroke('#2e5d27', 3);
      tile.setInteractive({ useHandCursor: true }).on('pointerup', () => this.pick(id));
      return { id, tile };
    });
    const paint = () => tiles.forEach(({ id, tile }) => tile.setFillStyle(id === this.breed ? 0xffd54f : 0xffffff, id === this.breed ? 0.85 : 0.18));
    this.events.on('breed', paint);
    paint();
    this.add.text(WIDTH / 2, PICKER_Y - 44, '选一只狗', { fontSize: '13px', color: '#e8f5e9' }).setOrigin(0.5);
  }

  private pick(id: BreedId): void {
    this.breed = id;
    saveBreed(id);
    this.events.emit('breed');
  }

  // The dog runs ahead and the owner chases on a skateboard, leash between them: the whole game in one picture.
  private chaseIntro(): void {
    const leash = this.add.graphics();
    const dog = this.add.image(250, 165, `dog-${this.breed}-run-0`).setScale(ART_SCALE);
    const board = this.add.image(110, 202, 'ride-skate').setScale(ART_SCALE * 0.8);
    const owner = this.add.image(110, 166, 'owner-ride').setScale(ART_SCALE * 0.8);
    let frame = 0;
    this.time.addEvent({
      delay: 110,
      loop: true,
      callback: () => {
        frame = (frame + 1) % 4;
        dog.setTexture(`dog-${this.breed}-run-${frame}`).setY(165 - (frame % 2) * 3);
        owner.setY(166 + Math.sin(frame) * 1.5);
        board.setY(202 + Math.sin(frame) * 1.5);
        leash.clear().lineStyle(3, 0x8d6e63, 1);
        new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(127, 158), new Phaser.Math.Vector2(185, 148 + (frame % 2) * 8), new Phaser.Math.Vector2(255, 163)).draw(leash, 20);
      },
    });
  }
}
