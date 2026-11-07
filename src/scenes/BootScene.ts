import Phaser from 'phaser';
import { loadArt } from '../art';
import { HEIGHT, WIDTH } from '../config';

// Draws every sticker into a texture before the first screen, so nothing pops in mid-game.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    const label = this.add.text(WIDTH / 2, HEIGHT / 2, '准备狗绳…', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    void loadArt(this.textures).then(() => {
      label.destroy();
      this.scene.start('title');
    });
  }
}
