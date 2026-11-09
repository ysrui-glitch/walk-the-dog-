import type { Biome } from './biomes';
import { defaultStore, type ScoreStore } from './best';

// 贴纸册: six stickers in every world, each earned by doing one of that world's things once. They give a reason to
// play again besides the high score, and lead players to find each world's rules.
export type StickerEvent =
  | 'catch'
  | 'car'
  | 'poop'
  | 'shield_pop'
  | 'cat_treed'
  | 'red'
  | 'dodge_roller'
  | 'smash_roller'
  | 'slope'
  | 'stray_fed'
  | 'surf'
  | 'tide_full'
  | 'miss'
  | 'feed'
  | 'outrun'
  | 'skid'
  | 'tow'
  | 'braved'
  | 'lift'
  | 'ring'
  | 'hole_passed';

export interface Sticker {
  readonly id: string;
  readonly world: Biome['id'];
  readonly on: StickerEvent;
  readonly name: string;
  // How to earn it, shown while it is still missing.
  readonly hint: string;
  readonly art: string;
}

type Row = readonly [StickerEvent, string, string, string];

const PAGES: Readonly<Record<Biome['id'], readonly Row[]>> = {
  city: [
    ['red', '红灯停', '狗遇到红灯停下来', 'dec-lamp'],
    ['dodge_roller', '躲开外卖车', '躲开逆行的外卖车', 'ob-delivery'],
    ['smash_roller', '撞飞外卖车', '开汽车撞开外卖车', 'fx-bolt'],
    ['poop', '城市好主人', '在城市捡起便便', 'poop'],
    ['catch', '街头抓绳', '在城市抓住狗绳', 'dec-house'],
    ['car', '城市飙车', '在城市坐上汽车', 'ride-car'],
  ],
  park: [
    ['slope', '草坡滑行', '走路时顺着草坡滑下去', 'dec-flower'],
    ['stray_fed', '引开野狗', '扔东西把野狗引开', 'buddy-poodle'],
    ['cat_treed', '松鼠上树', '狗追松鼠，松鼠逃上树', 'squirrel-0'],
    ['poop', '公园好主人', '在公园捡起便便', 'dec-mushroom'],
    ['catch', '公园抓绳', '在公园抓住狗绳', 'dec-butterfly'],
    ['car', '公园兜风', '在公园坐上汽车', 'dec-tree'],
  ],
  beach: [
    ['surf', '冲浪高手', '踩着交通工具冲一次浪', 'ride-surf'],
    ['tide_full', '潮水涨满', '看着潮水涨满三条道', 'fx-wave'],
    ['shield_pop', '气球救命', '在海滩让气球替你挡一次', 'ride-balloon'],
    ['poop', '海滩好主人', '在海滩捡起便便', 'dec-shell'],
    ['catch', '海边抓绳', '在海滩抓住狗绳', 'dec-starfish'],
    ['car', '沙滩跑车', '在海滩坐上汽车', 'dec-boat'],
  ],
  sea: [
    ['miss', '躲过鲨鱼', '鲨鱼扑过来时换道躲开', 'fx-fin'],
    ['feed', '喂饱鲨鱼', '扔东西喂走鲨鱼', 'toss-fish'],
    ['outrun', '甩掉鲨鱼', '坐快船甩掉鲨鱼', 'ride-jetski'],
    ['shield_pop', '救生圈', '让救生圈替你挡一次', 'shield-ring'],
    ['catch', '海上抓绳', '在大海抓住狗绳', 'dec-fish'],
    ['car', '快艇', '在大海坐上快艇', 'ride-speedboat'],
  ],
  snow: [
    ['skid', '狗狗滑冰', '看狗在冰上滑倒', 'dec-mitten'],
    ['tow', '雪橇狗', '在冰上被狗拉着滑', 'ride-sled'],
    ['smash_roller', '砸碎大雪球', '砸碎或撞碎一个大雪球', 'toss-snowball'],
    ['dodge_roller', '躲开大雪球', '躲开滚下来的大雪球', 'ob-giantsnowball'],
    ['catch', '雪地抓绳', '在雪地抓住狗绳', 'dec-igloo'],
    ['car', '驯鹿雪橇', '在雪地坐上驯鹿雪橇', 'ride-sleigh'],
  ],
  desert: [
    ['braved', '骆驼勇士', '骑骆驼冲过龙卷风', 'ride-camel'],
    ['dodge_roller', '躲开龙卷风', '躲开卷下来的龙卷风', 'ob-tornado'],
    ['cat_treed', '蜥蜴逃跑', '狗追蜥蜴，蜥蜴逃上仙人掌', 'lizard-0'],
    ['poop', '沙漠好主人', '在沙漠捡起便便', 'dec-camel'],
    ['catch', '沙漠抓绳', '在沙漠抓住狗绳', 'dec-pyramid'],
    ['car', '越野车', '在沙漠坐上越野车', 'ride-jeep'],
  ],
  prehistoric: [
    ['lift', '翼龙飞行', '被翼龙叼起来飞', 'dec-pterodactyl'],
    ['feed', '喂霸王龙', '扔东西喂走霸王龙', 'toss-meat'],
    ['miss', '躲过霸王龙', '霸王龙扑过来时躲开', 'fx-trexhead'],
    ['outrun', '甩掉霸王龙', '骑大恐龙甩掉霸王龙', 'ride-raptor'],
    ['catch', '史前抓绳', '在史前抓住狗绳', 'dec-egg'],
    ['car', '骑腕龙', '在史前骑上腕龙', 'ride-brachio'],
  ],
  space: [
    ['ring', '穿越加速环', '穿过一个加速环', 'fx-boostring'],
    ['hole_passed', '逃离黑洞', '从黑洞旁边擦过去', 'fx-blackhole'],
    ['cat_treed', '外星人逃跑', '狗追外星人，外星人逃走', 'alien-0'],
    ['shield_pop', '防护罩', '让防护罩替你挡一次', 'shield-bubble'],
    ['catch', '太空抓绳', '在太空抓住狗绳', 'dec-astronaut'],
    ['car', '小火箭', '在太空坐上小火箭', 'ride-rocket'],
  ],
};

export const STICKERS: readonly Sticker[] = (Object.keys(PAGES) as Biome['id'][]).flatMap((world) =>
  PAGES[world].map(([on, name, hint, art]) => ({ id: `${world}-${on}`, world, on, name, hint, art })),
);

const BY_ID: ReadonlyMap<string, Sticker> = new Map(STICKERS.map((s) => [s.id, s]));

export function stickerFor(world: Biome['id'], on: StickerEvent): Sticker | undefined {
  return BY_ID.get(`${world}-${on}`);
}

export function pageOf(world: Biome['id']): readonly Sticker[] {
  return STICKERS.filter((s) => s.world === world);
}

export const STICKERS_KEY = 'walk-the-dog:stickers';

// The stickers you have. Unknown ids (from older saves) and anything unreadable are dropped.
export function loadStickers(store: ScoreStore | undefined = defaultStore()): ReadonlySet<string> {
  try {
    const parsed: unknown = JSON.parse(store?.getItem(STICKERS_KEY) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string' && BY_ID.has(id)) : []);
  } catch {
    return new Set();
  }
}

export function saveStickers(owned: ReadonlySet<string>, store: ScoreStore | undefined = defaultStore()): void {
  try {
    store?.setItem(STICKERS_KEY, JSON.stringify([...owned]));
  } catch {
    // Stickers earned still show for this session even if they can't persist.
  }
}
