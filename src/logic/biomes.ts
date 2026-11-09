import type { RideKind, TossKind } from './chase';
import type { WorldRules } from './hazards';
import type { EntityKind } from './world';

// The chase passes through themed stretches. Each reskins the road and adds rules of its own (see hazards.ts).
export interface Biome {
  readonly id: 'city' | 'park' | 'beach' | 'sea' | 'snow' | 'desert' | 'prehistoric' | 'space';
  readonly name: string;
  readonly length: number;
  readonly colors: { readonly left: number; readonly right: number; readonly road: number; readonly dash: number; readonly dashAlpha: number };
  readonly skins: Readonly<Partial<Record<EntityKind, readonly string[]>>>;
  readonly decor: readonly string[];
  // What a chased critter escapes up (or onto) at the roadside.
  readonly perch: string;
  // How the ground itself reads: lane markings, and texture scattered over the whole play area (wave crests...).
  readonly ground?: { readonly laneMark: 'dash' | 'none'; readonly overlays: readonly string[] };
  // In water the owner swims when on foot and the dog paddles; nobody stops to poop or pee.
  readonly swim?: boolean;
  // This world's version of each ride and of the balloon (a life ring at sea); `worn` puts it round the waist.
  readonly rides?: Readonly<Partial<Record<RideKind, { readonly key: string; readonly name: string }>>>;
  readonly shield?: { readonly key: string; readonly name: string; readonly worn: boolean };
  // This world's version of the things you throw (a fish instead of a bone at sea), with what the dog does with it.
  // A hard one (a snowball, a coconut) also knocks over the first obstacle ahead of you on its way.
  readonly tosses?: Readonly<Partial<Record<TossKind, TossLook>>>;
  // Space helmets on the owner and the dog.
  readonly helmet?: boolean;
  // This world's own rules (see hazards.ts), and the one line that teaches them as you arrive.
  readonly rules?: WorldRules;
  readonly intro: string;
}

export interface TossLook {
  readonly key: string;
  readonly name: string;
  readonly line: string;
  readonly smash?: boolean;
}

export const DEFAULT_SHIELD = { key: 'ride-balloon', name: '气球', worn: false } as const;

// Skins and decor are texture keys from `src/art`.
const CITY_SKINS: Biome['skins'] = {
  pole: ['ob-cone', 'ob-trash', 'ob-hydrant'],
  crosser: ['cross-car', 'cross-taxi'],
  barrier: ['bar-roadwork'],
  puddle: ['pud-water'],
  critter: ['cat-orange-0'],
  buddy: ['buddy-poodle', 'buddy-husky', 'buddy-collie', 'buddy-shiba', 'buddy-lab', 'buddy-tugou', 'buddy-golden'],
  poop: ['poop'],
};

// The walk gets wilder the further you chase: from your own street out to sea, through snow and desert, back to the
// dinosaurs and finally into space. Distant worlds are the reward for long runs.
export const BIOMES: readonly Biome[] = [
  {
    id: 'city',
    name: '城市',
    length: 320,
    colors: { left: 0x8e93a0, right: 0x8e93a0, road: 0x8e93a0, dash: 0xffffff, dashAlpha: 0.85 },
    skins: CITY_SKINS,
    decor: ['dec-building', 'dec-house', 'dec-lamp', 'dec-tree'],
    perch: 'ob-tree',
    intro: '外卖车会逆行冲来，快躲！\n红灯时，狗会停下来等',
    rules: {
      zone: { kind: 'crosswalk', rows: 1, every: [10, 16] },
      roller: { art: 'ob-delivery', every: [4000, 6500], first: 5000, pxS: 300, warn: '外卖电动车逆行！快躲开', hit: '被外卖车撞了！' },
    },
  },
  {
    id: 'park',
    name: '公园',
    length: 350,
    colors: { left: 0xa6d36b, right: 0xa6d36b, road: 0xa6d36b, dash: 0xffffff, dashAlpha: 0 },
    ground: { laneMark: 'none', overlays: ['fx-grass'] },
    skins: { ...CITY_SKINS, pole: ['ob-tree', 'ob-pine', 'ob-rock'], crosser: ['cross-duck'], barrier: ['bar-log'], puddle: ['pud-mud'], critter: ['squirrel-0'] },
    decor: ['dec-flower', 'dec-mushroom', 'dec-tree', 'dec-butterfly'],
    perch: 'ob-tree',
    intro: '野狗会来撩你的狗，扔东西引开它！\n走路上草坡能滑得飞快',
    rules: { zone: { kind: 'slope', rows: 3, every: [8, 12] }, stray: { art: 'buddy-poodle' } },
  },
  {
    id: 'beach',
    name: '海滩',
    length: 350,
    colors: { left: 0xf7e3a8, right: 0xf7e3a8, road: 0xf7e3a8, dash: 0xffffff, dashAlpha: 0 },
    ground: { laneMark: 'none', overlays: ['fx-sandripple', 'fx-footprints'] },
    skins: { ...CITY_SKINS, pole: ['ob-castle', 'ob-rock'], crosser: ['crab-0'], barrier: ['bar-wave'], puddle: ['pud-foam'], critter: ['gull-0'] },
    decor: ['dec-palm', 'dec-shell', 'dec-boat', 'dec-starfish'],
    perch: 'dec-palm',
    intro: '潮水越涨越高，浪会从后面卷来！\n有车就冲浪，没车躲到沙滩上',
    rules: { tide: true },
  },
  {
    id: 'sea',
    name: '大海',
    length: 400,
    colors: { left: 0x2f9fd8, right: 0x2f9fd8, road: 0x2f9fd8, dash: 0xffffff, dashAlpha: 0 },
    ground: { laneMark: 'none', overlays: ['fx-wave', 'fx-wave', 'fx-sparkle'] },
    swim: true,
    rides: {
      skate: { key: 'ride-surf', name: '冲浪板' },
      scooter: { key: 'ride-paddle', name: '桨板' },
      cycle: { key: 'ride-pedalo', name: '脚踏船' },
      moto: { key: 'ride-jetski', name: '摩托艇' },
      car: { key: 'ride-speedboat', name: '快艇' },
    },
    shield: { key: 'shield-ring', name: '救生圈', worn: true },
    tosses: {
      ball: { key: 'toss-beachball', name: '沙滩球', line: '顶着沙滩球游回来了！' },
      bone: { key: 'toss-fish', name: '小鱼', line: '停下来吃小鱼' },
      whistle: { key: 'toss-conch', name: '海螺号', line: '听到海螺号，回头了！' },
      hotdog: { key: 'toss-shrimp', name: '大虾', line: '大虾！吃得停不下来' },
    },
    skins: { ...CITY_SKINS, pole: ['ob-buoy', 'ob-barrel', 'ob-crate'], crosser: ['cross-shark'], barrier: ['bar-log'], puddle: [], critter: ['gull-0'], buddy: ['dog-husky-swim-0', 'dog-collie-swim-0', 'dog-shiba-swim-0', 'dog-lab-swim-0', 'dog-tugou-swim-0', 'dog-golden-swim-0'] },
    decor: ['dec-fish', 'dec-jellyfish', 'dec-whale', 'dec-coral'],
    perch: 'ob-buoy',
    intro: '鲨鱼会从后面扑你！\n红道闪了就换道，或者扔东西喂它',
    rules: { chaser: { art: 'fx-fin', name: '鲨鱼', feed: 'bone' } },
  },
  {
    id: 'snow',
    name: '雪地',
    length: 400,
    colors: { left: 0xf1f7fc, right: 0xf1f7fc, road: 0xf1f7fc, dash: 0xb9d6ec, dashAlpha: 0.35 },
    ground: { laneMark: 'none', overlays: ['fx-snowfall', 'fx-skitrack'] },
    skins: { ...CITY_SKINS, pole: ['ob-snowman', 'ob-snowpine', 'ob-iceblock'], crosser: ['cross-penguin'], barrier: ['bar-snowdrift'], puddle: ['pud-ice'], critter: ['rabbit-0'] },
    decor: ['dec-igloo', 'dec-mitten', 'dec-snowball'],
    perch: 'ob-snowpine',
    intro: '大雪球会滚下来，快躲！\n狗在冰上会滑倒，快追',
    rules: {
      zone: { kind: 'ice', rows: 4, every: [10, 15] },
      roller: { art: 'ob-giantsnowball', every: [3500, 5500], first: 5000, pxS: 200, grows: true, owed: 'ball', warn: '大雪球滚下来了！\n躲开，或者扔雪球砸碎它', hit: '被大雪球撞飞了！' },
    },
    rides: {
      skate: { key: 'ride-sled', name: '小雪橇' },
      scooter: { key: 'ride-skis', name: '滑雪板' },
      cycle: { key: 'ride-snowboard', name: '单板' },
      moto: { key: 'ride-snowmobile', name: '雪地摩托' },
      car: { key: 'ride-sleigh', name: '驯鹿雪橇' },
    },
    tosses: { ball: { key: 'toss-snowball', name: '雪球', line: '扑雪球去了！', smash: true } },
  },
  {
    id: 'desert',
    name: '沙漠',
    length: 400,
    colors: { left: 0xeccb86, right: 0xeccb86, road: 0xeccb86, dash: 0xffffff, dashAlpha: 0 },
    ground: { laneMark: 'none', overlays: ['fx-sandripple', 'fx-sandripple', 'fx-footprints'] },
    skins: { ...CITY_SKINS, pole: ['ob-cactus', 'ob-skull', 'ob-boulder'], crosser: ['cross-tumbleweed'], barrier: ['bar-dune'], puddle: ['pud-quicksand'], critter: ['lizard-0'] },
    decor: ['dec-pyramid', 'dec-camel', 'dec-oasis'],
    perch: 'ob-cactus',
    intro: '龙卷风会卷下来，快躲！\n骑骆驼就不怕',
    rules: {
      roller: {
        art: 'ob-tornado',
        every: [4000, 6500],
        first: 5000,
        pxS: 170,
        sways: true,
        warn: '龙卷风来了！\n躲开，或者骑骆驼冲过去',
        hit: '被龙卷风卷倒了！',
        braves: { ride: 'cycle', perk: '不怕龙卷风', line: '骆驼顶着龙卷风冲过去了！' },
      },
    },
    rides: {
      skate: { key: 'ride-sandboard', name: '滑沙板' },
      scooter: { key: 'ride-donkey', name: '小毛驴' },
      cycle: { key: 'ride-camel', name: '骆驼' },
      moto: { key: 'ride-dunebuggy', name: '沙地车' },
      car: { key: 'ride-jeep', name: '越野车' },
    },
  },
  {
    id: 'prehistoric',
    name: '史前',
    length: 450,
    colors: { left: 0x9bb66a, right: 0x9bb66a, road: 0x9bb66a, dash: 0xffffff, dashAlpha: 0 },
    ground: { laneMark: 'none', overlays: ['fx-grass', 'fx-grass', 'fx-dinoprint'] },
    skins: { ...CITY_SKINS, pole: ['ob-fern', 'ob-volcanorock'], crosser: ['cross-trex'], barrier: ['bar-fallentrunk'], puddle: ['pud-tar'], critter: ['raptor-0'] },
    decor: ['dec-volcano', 'dec-egg', 'dec-pterodactyl', 'dec-ammonite'],
    perch: 'ob-fern',
    intro: '霸王龙会从后面扑你！\n抓住翼龙就能飞过去',
    rules: {
      chaser: { art: 'fx-trexhead', name: '霸王龙', feed: 'bone', stomps: true },
      boost: { art: 'dec-pterodactyl', chance: 0.04, ms: 2500, factor: 1.6, lifts: true, line: '翼龙把你叼起来飞！' },
    },
    rides: {
      skate: { key: 'ride-stonewheel', name: '石头轮' },
      scooter: { key: 'ride-turtle', name: '大乌龟' },
      cycle: { key: 'ride-raptor', name: '迅猛龙' },
      moto: { key: 'ride-triceratops', name: '三角龙' },
      car: { key: 'ride-brachio', name: '腕龙' },
    },
    tosses: {
      ball: { key: 'toss-coconut', name: '椰子', line: '追着椰子跑回来了！', smash: true },
      bone: { key: 'toss-meat', name: '大肉骨头', line: '停下来啃大肉骨头' },
      frisbee: { key: 'toss-stonedisc', name: '石盘', line: '跳起来接石盘' },
      whistle: { key: 'toss-horn', name: '兽角号', line: '听到兽角号，回头了！' },
      hotdog: { key: 'toss-dinoegg', name: '恐龙蛋', line: '恐龙蛋！舔个不停' },
    },
  },
  {
    id: 'space',
    name: '太空',
    length: 480,
    colors: { left: 0x14173a, right: 0x14173a, road: 0x14173a, dash: 0x7cf3ff, dashAlpha: 0.35 },
    ground: { laneMark: 'none', overlays: ['fx-twinkle', 'fx-twinkle', 'fx-nebula'] },
    skins: { ...CITY_SKINS, pole: ['ob-asteroid', 'ob-satellite', 'ob-crystal'], crosser: ['cross-ufo'], barrier: ['bar-laser'], puddle: ['pud-slime'], critter: ['alien-0'], buddy: [] },
    decor: ['dec-planet', 'dec-rocket', 'dec-comet', 'dec-astronaut'],
    perch: 'ob-satellite',
    intro: '黑洞会把你吸过去，往外划！\n穿过加速环能加速',
    rules: { holes: true, boost: { art: 'fx-boostring', chance: 0.08, ms: 1800, factor: 1.5, line: '穿过加速环！' } },
    helmet: true,
    rides: {
      skate: { key: 'ride-hoverboard', name: '悬浮板' },
      scooter: { key: 'ride-jetboots', name: '火箭靴' },
      cycle: { key: 'ride-rover', name: '月球车' },
      moto: { key: 'ride-rocketbike', name: '火箭摩托' },
      car: { key: 'ride-rocket', name: '小火箭' },
    },
    shield: { key: 'shield-bubble', name: '防护罩', worn: true },
    tosses: {
      ball: { key: 'toss-asteroidball', name: '小行星球', line: '叼着小行星球飘回来了！' },
      bone: { key: 'toss-starbone', name: '星星骨头', line: '停下来啃星星骨头' },
      frisbee: { key: 'toss-minisaucer', name: '迷你飞碟', line: '跳起来接迷你飞碟' },
      whistle: { key: 'toss-radio', name: '对讲机', line: '听到对讲机，回头了！' },
      hotdog: { key: 'toss-spacefood', name: '太空食品', line: '太空食品！吃得停不下来' },
    },
  },
];

const LOOP = BIOMES.reduce((sum, b) => sum + b.length, 0);

// Where a run starts along the route. The very first run starts at home in the city; after that any world can be
// the start, never the same one twice running, and the route carries on in order from there.
export function pickStart(random: () => number, firstRun: boolean, previous?: Biome['id']): Biome['id'] {
  if (firstRun) return 'city';
  const options = BIOMES.filter((b) => b.id !== previous);
  return options[Math.floor(random() * options.length)].id;
}

// Where a world begins along the route, in metres; undefined for a name that isn't a world.
export function biomeStart(id: string): number | undefined {
  let start = 0;
  for (const biome of BIOMES) {
    if (biome.id === id) return start;
    start += biome.length;
  }
  return undefined;
}

// The route loops once the night stretch ends, so long runs keep cycling through the scenery.
export function biomeAt(meters: number): Biome {
  let left = Math.max(0, meters) % LOOP;
  for (const biome of BIOMES) {
    if (left < biome.length) return biome;
    left -= biome.length;
  }
  return BIOMES[0];
}

// How far through its world (0 to 1) a point on the route is.
export function biomeProgress(meters: number): number {
  let left = Math.max(0, meters) % LOOP;
  for (const biome of BIOMES) {
    if (left < biome.length) return left / biome.length;
    left -= biome.length;
  }
  return 0;
}

export function skinFor(biome: Biome, kind: EntityKind, random: () => number): string {
  const options = biome.skins[kind] ?? CITY_SKINS[kind] ?? ['missing'];
  return options[Math.floor(random() * options.length)];
}
