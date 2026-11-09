import Phaser from 'phaser';
import { ART_SCALE } from '../art';
import { HEIGHT, WIDTH } from '../config';
import { BIOMES, type Biome } from '../logic/biomes';
import { STICKERS, loadStickers, pageOf } from '../logic/stickers';

const TAB_W = 80;
const TAB_GAP = 6;
const TAB_H = 34;
const CARD_W = 158;
const CARD_H = 136;

// 贴纸册: one page per world, six stickers each. A sticker you have shows in colour with its name; one you don't
// shows as a shadow with how to earn it.
export class AlbumScene extends Phaser.Scene {
  private page: Biome['id'] = 'city';
  private cards: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('album');
  }

  create(): void {
    const owned = loadStickers();
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x3e5c76).setOrigin(0);
    this.add.text(WIDTH / 2, 36, `贴纸册  ${owned.size}/${STICKERS.length}`, { fontSize: '24px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setStroke('#1d2d3b', 5);
    const back = this.add.text(18, 36, '‹ 返回', { fontSize: '18px', color: '#fff', fontStyle: 'bold' }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    back.on('pointerup', () => this.scene.start('title'));
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('title'));

    const tabs = BIOMES.map((biome, i) => {
      const x = (WIDTH - 4 * TAB_W - 3 * TAB_GAP) / 2 + TAB_W / 2 + (i % 4) * (TAB_W + TAB_GAP);
      const y = 84 + Math.floor(i / 4) * (TAB_H + TAB_GAP);
      const got = pageOf(biome.id).filter((s) => owned.has(s.id)).length;
      const tab = this.add.rectangle(x, y, TAB_W, TAB_H, 0xffffff, 0.15).setStrokeStyle(2, 0xffffff, 0.5).setInteractive({ useHandCursor: true });
      this.add.text(x, y, `${biome.name} ${got}/6`, { fontSize: '13px', color: got === 6 ? '#ffd54f' : '#fff', fontStyle: 'bold' }).setOrigin(0.5);
      tab.on('pointerup', () => {
        this.page = biome.id;
        paint();
      });
      return { id: biome.id, tab };
    });
    const paint = () => {
      for (const { id, tab } of tabs) tab.setFillStyle(id === this.page ? 0xffd54f : 0xffffff, id === this.page ? 0.6 : 0.15);
      this.showPage(owned);
    };
    paint();
  }

  private showPage(owned: ReadonlySet<string>): void {
    for (const c of this.cards) c.destroy();
    this.cards = pageOf(this.page).flatMap((sticker, i) => {
      const x = WIDTH / 2 + (i % 2 === 0 ? -1 : 1) * (CARD_W / 2 + 5);
      const y = 228 + Math.floor(i / 2) * (CARD_H + 10);
      const have = owned.has(sticker.id);
      const card = this.add.rectangle(x, y, CARD_W, CARD_H, 0xffffff, have ? 0.95 : 0.25).setStrokeStyle(3, have ? 0xffd54f : 0xffffff, have ? 1 : 0.4);
      const art = this.add.image(x, y - 22, sticker.art).setScale(ART_SCALE * 1.3);
      // A missing sticker is a faded shadow of itself.
      if (!have) art.setTintFill(0x1d2d3b).setAlpha(0.35);
      const name = this.add.text(x, y + 30, have ? sticker.name : '？？？', { fontSize: '15px', color: have ? '#2b2118' : '#fff', fontStyle: 'bold' }).setOrigin(0.5);
      const hint = this.add.text(x, y + 52, sticker.hint, { fontSize: '11px', color: have ? '#6d5c4a' : '#e3eef7', align: 'center', wordWrap: { width: CARD_W - 12 } }).setOrigin(0.5);
      return [card, art, name, hint];
    });
  }
}
