import Phaser from 'phaser';
import { HEIGHT, WIDTH } from './config';
import { AlbumScene } from './scenes/AlbumScene';
import { BootScene } from './scenes/BootScene';
import { ChaseScene } from './scenes/ChaseScene';
import { EndScene } from './scenes/EndScene';
import { TitleScene } from './scenes/TitleScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#2d4a2b',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, TitleScene, ChaseScene, EndScene, AlbumScene],
});

if (import.meta.env.DEV) Object.assign(window, { game });

// GamePix requires the game (and audio) to stop while the tab is hidden.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) game.pause();
  else game.resume();
});
