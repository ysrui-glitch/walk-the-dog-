import Phaser from 'phaser';
import { ART_SCALE } from '../art';
import { HEIGHT, LANE_X, OWNER_Y, ROW_SPACING_PX, WIDTH, type Lane } from '../config';
import type { Biome } from '../logic/biomes';
import type { ChaseSpec } from '../logic/chase';
import {
  CHARGE_FIRST_MS,
  CHARGE_START_PX,
  HOLE_EVERY_MS,
  HOLE_FIRST_MS,
  PESTER_MS,
  PULL_MIN_AHEAD_PX,
  PULL_MS,
  PULL_RANGE_PX,
  SHARK_FIRST_MS,
  SHARK_LUNGE_MS,
  SHARK_START_BEHIND,
  STRAY_EVERY_MS,
  STRAY_FIRST_MS,
  STRAY_PX_S,
  SURF_BOOST,
  SURF_MS,
  TIDE_FIRST_MS,
  WADE_FACTOR,
  bandAt,
  between,
  dogMeetsZone,
  dogReached,
  lightAt,
  chargerY,
  nextCharger,
  nextShark,
  nextTide,
  pullTowards,
  sharkAway,
  sharkHungry,
  waterLanes,
  waveFront,
  withPickup,
  zoneRow,
  type Band,
  type DogZoneEvent,
  type Charger,
  type ChargerEvent,
  type RollerRule,
  type Shark,
  type SharkEvent,
  type Tide,
  type TideEvent,
  type WorldRules,
  type ZoneKind,
} from '../logic/hazards';

export type Say = (x: number, y: number, text: string, color: string) => void;
export type HazardEvent = SharkEvent | TideEvent | DogZoneEvent | ChargerEvent | 'rise' | 'zone' | 'roller' | 'stray' | 'pester' | 'hole' | 'pull' | 'swallow' | 'hole_passed';

export interface Tick {
  readonly now: number;
  readonly dt: number;
  readonly dy: number;
  readonly ownerLane: Lane;
  readonly rideTier: number;
  readonly dogX: number;
  readonly dogY: number;
  // How far through the current world the owner is, 0 to 1.
  readonly progress: number;
  // Something else already has the dog's attention, so a stray waits its turn.
  readonly dogBusy: boolean;
}

type Zone = { -readonly [K in keyof Band]: Band[K] } & { readonly kind: ZoneKind; dogDone: boolean };
type Stray = { readonly kind: 'none'; readonly nextAt: number } | { readonly kind: 'coming' | 'pestering'; x: number; y: number; until: number };
interface Hole {
  readonly lane: Lane;
  y: number;
  nextPullAt: number;
  passed: boolean;
}

const FIN_MOVE_PX_S = 260;
const LANE_EDGES: Readonly<Record<Lane, readonly [number, number]>> = { 0: [0, 130], 1: [130, 230], 2: [230, WIDTH] };
const ROW_SPAWN_Y = -40;
const STOMP_EVERY_MS = 650;
// Black holes drift down slower than the road, so they hang over you for a while.
const HOLE_DRIFT = 0.45;
const HOLE_HIT_PX = 28;
// A hole tugs at you almost as soon as it is in range.
const FIRST_PULL_MS = 200;
const STRAY_REACH_PX = 30;

// Each world's rules on screen: the chaser (shark, T-rex) and its lunge, the rising tide and its waves, the crosswalk,
// the stray dog, black holes, and chargers (a husky sled from behind, a diving pterodactyl). Rollers are road entities
// and live in the scene; this decides when they come.
export class WorldHazards {
  shark: Shark = { kind: 'away', nextAt: Infinity };
  // Set when a black hole has just pulled the owner a lane over.
  pulled: Lane | undefined;
  private rules: WorldRules = {};
  private tide: Tide = { kind: 'calm', nextAt: Infinity };
  private water: readonly Lane[] = [];
  private seaEdge = 0;
  private zones: Zone[] = [];
  private zoneRowsLeft = 0;
  private rowsToZone = Infinity;
  private inZone: ZoneKind | undefined;
  private surfUntil = 0;
  private washed: readonly Lane[] = [];
  private rollerAt = Infinity;
  private stray: Stray = { kind: 'none', nextAt: Infinity };
  private holes: Hole[] = [];
  private charger: Charger = { kind: 'none', nextAt: Infinity };
  private holeAt = Infinity;
  private nextStompAt = 0;
  // Something to throw that the next row owes the player: a fish for a shark, a snowball for a giant snowball.
  private owed: string | undefined;
  private finX: number = LANE_X[1];
  private readonly fin: Phaser.GameObjects.Image;
  private readonly straySprite: Phaser.GameObjects.Image;
  private readonly chargerSprite: Phaser.GameObjects.Image;
  private readonly strayMark: Phaser.GameObjects.Text;
  private readonly holeSprites: Phaser.GameObjects.Image[];
  private readonly sea: Phaser.GameObjects.Graphics;
  private readonly ground: Phaser.GameObjects.Graphics;
  private readonly lungeMark: Phaser.GameObjects.Graphics;
  private readonly lungeSign: Phaser.GameObjects.Text;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly say: Say,
    private readonly random: () => number = Math.random,
  ) {
    this.ground = scene.add.graphics().setDepth(1.5);
    this.sea = scene.add.graphics().setDepth(1.6);
    this.lungeMark = scene.add.graphics().setDepth(1.7);
    this.lungeSign = scene.add.text(0, OWNER_Y - 120, '!', { fontSize: '56px', color: '#ff1744', fontStyle: 'bold' }).setOrigin(0.5).setDepth(23).setStroke('#ffffff', 6).setVisible(false);
    this.fin = scene.add.image(0, 0, 'fx-fin').setScale(ART_SCALE * 1.2).setDepth(22).setVisible(false);
    this.chargerSprite = scene.add.image(0, 0, 'ob-huskysled').setScale(ART_SCALE * 1.2).setDepth(12).setVisible(false);
    this.straySprite = scene.add.image(0, 0, 'buddy-poodle').setScale(ART_SCALE * 0.9).setDepth(10).setVisible(false);
    this.strayMark = scene.add.text(0, 0, '!', { fontSize: '40px', color: '#ff9100', fontStyle: 'bold' }).setOrigin(0.5).setDepth(23).setStroke('#ffffff', 6).setVisible(false);
    this.holeSprites = Array.from({ length: 3 }, () => scene.add.image(0, 0, 'fx-blackhole').setScale(ART_SCALE).setDepth(3).setVisible(false));
  }

  // Each world's rules start a moment after you arrive and stop when you leave.
  enter(biome: Biome, now: number): void {
    const rules = biome.rules ?? {};
    this.rules = rules;
    this.shark = { kind: 'away', nextAt: rules.chaser ? now + SHARK_FIRST_MS : Infinity };
    this.fin.setTexture(rules.chaser?.art ?? 'fx-fin');
    this.tide = { kind: 'calm', nextAt: rules.tide ? now + TIDE_FIRST_MS : Infinity };
    this.water = [];
    this.rowsToZone = rules.zone ? 2 : Infinity;
    this.zoneRowsLeft = 0;
    this.rollerAt = rules.roller ? now + rules.roller.first : Infinity;
    this.stray = { kind: 'none', nextAt: rules.stray ? now + STRAY_FIRST_MS : Infinity };
    if (rules.stray) this.straySprite.setTexture(rules.stray.art);
    this.holeAt = rules.holes ? now + HOLE_FIRST_MS : Infinity;
    this.charger = { kind: 'none', nextAt: rules.charger ? now + CHARGE_FIRST_MS : Infinity };
    if (rules.charger) this.chargerSprite.setTexture(rules.charger.art);
  }

  roller(): RollerRule | undefined {
    return this.rules.roller;
  }

  // Lays zones into the road (clear of obstacles), and hands over what the last hazard owes you.
  planRow(row: ChaseSpec[]): ChaseSpec[] {
    if (this.owed) {
      const tag = this.owed;
      this.owed = undefined;
      return withPickup(row, tag, this.random);
    }
    const zone = this.rules.zone;
    if (!zone) return row;
    if (this.zoneRowsLeft === 0 && --this.rowsToZone <= 0) {
      this.zoneRowsLeft = zone.rows;
      const half = ROW_SPACING_PX / 2;
      this.zones.push({ kind: zone.kind, top: ROW_SPAWN_Y - (zone.rows - 1) * ROW_SPACING_PX - half, bottom: ROW_SPAWN_Y + half, dogDone: false });
    }
    if (this.zoneRowsLeft === 0) return row;
    if (--this.zoneRowsLeft === 0) this.rowsToZone = Math.round(between(this.random, zone.every));
    return zoneRow(row);
  }

  update(t: Tick): HazardEvent[] {
    const events: HazardEvent[] = [];
    this.pulled = undefined;
    this.updateChaser(t, events);
    this.updateTide(t, events);
    this.updateZones(t, events);
    this.updateStray(t, events);
    this.updateHoles(t, events);
    this.updateCharger(t, events);
    if (t.now >= this.rollerAt && this.rules.roller) {
      const roller = this.rules.roller;
      this.rollerAt = t.now + between(this.random, roller.every);
      if (roller.owed) this.owed = roller.owed;
      this.say(WIDTH / 2, 150, roller.warn, '#ffecb3');
      events.push('roller');
    }
    this.draw(t.now, t.dt);
    return events;
  }

  private updateChaser({ now, dt, ownerLane, rideTier }: Tick, events: HazardEvent[]): void {
    const chaser = this.rules.chaser;
    const step = nextShark(this.shark, { now, dt, ownerLane, rideTier, random: this.random });
    this.shark = step.shark;
    if (step.event) events.push(step.event);
    const name = chaser?.name ?? '';
    if (step.event === 'appear') {
      if (chaser) this.owed = chaser.feed;
      this.say(WIDTH / 2, OWNER_Y - 90, `${name}来了！\n看准红道躲开，或者扔东西喂它`, '#ff8a80');
    }
    if (step.event === 'lunge') this.say(LANE_X[this.sharkLane()], OWNER_Y - 40, '要扑过来了！', '#ff5252');
    if (step.event === 'miss') this.say(this.finX, OWNER_Y - 40, `${name}扑空了！`, '#a5d6a7');
    if (step.event === 'outrun') this.say(WIDTH / 2, OWNER_Y - 60, `甩掉${name}了！`, '#a5d6a7');
    if (chaser?.stomps && this.shark.kind !== 'away' && now >= this.nextStompAt) {
      this.nextStompAt = now + STOMP_EVERY_MS;
      this.scene.cameras.main.shake(90, 0.004);
    }
  }

  private updateTide({ now, ownerLane, progress }: Tick, events: HazardEvent[]): void {
    const water = this.rules.tide ? waterLanes(progress) : [];
    if (water.length > this.water.length && this.water.length > 0) {
      this.say(WIDTH / 2, OWNER_Y - 150, water.length === 3 ? '潮水涨满了！前面就是大海' : '潮水涨上来了！', '#4fc3f7');
      events.push('rise');
    }
    this.water = water;
    const tide = nextTide(this.tide, now, OWNER_Y, ownerLane, water, this.random);
    if (tide.event === 'warn') this.say(WIDTH / 2, OWNER_Y - 120, water.length === 3 ? '大浪来了！快找车冲浪' : '浪要来了！\n有车就冲浪，没车躲到沙滩上', '#4fc3f7');
    if (tide.event === 'gone' && this.tide.kind === 'wave') this.washed = this.tide.lanes;
    if (tide.event) events.push(tide.event);
    this.tide = tide.tide;
  }

  private updateCharger({ now, dt, ownerLane }: Tick, events: HazardEvent[]): void {
    const step = nextCharger(this.charger, now, dt, ownerLane, this.random);
    this.charger = step.charger;
    if (step.event) events.push(step.event);
    const name = this.rules.charger?.name ?? '';
    if (step.event === 'charge_coming') this.say(WIDTH / 2, OWNER_Y - 120, `${name}冲过来了！快让开`, '#ff8a80');
    if (step.event === 'charge_miss') this.say(WIDTH / 2, OWNER_Y - 80, `躲开${name}了！`, '#a5d6a7');
  }

  chargerName(): string {
    return this.rules.charger?.name ?? '';
  }

  private updateZones({ now, dy, dogY }: Tick, events: HazardEvent[]): void {
    for (const z of this.zones) Object.assign(z, { top: z.top + dy, bottom: z.bottom + dy });
    this.zones = this.zones.filter((z) => z.top < HEIGHT);
    const here = bandAt(this.zones, OWNER_Y)?.kind;
    if (here && here !== this.inZone) events.push('zone');
    this.inZone = here;
    for (const z of this.zones.filter((zone) => !zone.dogDone && dogReached(zone, dogY))) {
      z.dogDone = true;
      const reaction = dogMeetsZone(z.kind, now);
      if (reaction) events.push(reaction);
    }
  }

  private updateStray({ now, dt, dogX, dogY, dogBusy }: Tick, events: HazardEvent[]): void {
    const s = this.stray;
    if (s.kind === 'none') {
      if (now < s.nextAt || dogBusy) return;
      const side = this.random() < 0.5 ? 24 : WIDTH - 24;
      this.stray = { kind: 'coming', x: side, y: OWNER_Y - 30, until: Infinity };
      this.owed = 'bone';
      this.say(WIDTH / 2, OWNER_Y - 110, '野狗！扔东西引开它', '#ffab40');
      events.push('stray');
      return;
    }
    if (s.kind === 'pestering') {
      Object.assign(s, { x: dogX + 34, y: dogY + 8 });
      if (now >= s.until) this.stray = { kind: 'none', nextAt: now + between(this.random, STRAY_EVERY_MS) };
      return;
    }
    const dx = dogX - s.x;
    const dyToDog = dogY - s.y;
    const dist = Math.hypot(dx, dyToDog);
    if (dist < STRAY_REACH_PX) {
      this.stray = { kind: 'pestering', x: s.x, y: s.y, until: now + PESTER_MS };
      events.push('pester');
      return;
    }
    const step = Math.min(dist, STRAY_PX_S * dt);
    s.x += (dx / dist) * step;
    s.y += (dyToDog / dist) * step;
  }

  private updateHoles({ now, dy, ownerLane }: Tick, events: HazardEvent[]): void {
    if (now >= this.holeAt && this.rules.holes) {
      this.holeAt = now + between(this.random, HOLE_EVERY_MS);
      this.holes.push({ lane: Math.floor(this.random() * 3) as Lane, y: -60, nextPullAt: Infinity, passed: false });
      this.say(WIDTH / 2, 150, '黑洞！会把你吸过去\n往外划，别被吸进去', '#ce93d8');
      events.push('hole');
    }
    for (const h of this.holes) {
      h.y += dy * HOLE_DRIFT;
      const ahead = OWNER_Y - h.y;
      if (ahead > PULL_MIN_AHEAD_PX && ahead <= PULL_RANGE_PX) {
        if (h.nextPullAt === Infinity) h.nextPullAt = now + FIRST_PULL_MS;
        if (now >= h.nextPullAt && ownerLane !== h.lane) {
          h.nextPullAt = now + PULL_MS;
          this.pulled = pullTowards(ownerLane, h.lane);
          events.push('pull');
        }
      }
    }
    const swallowed = this.holes.find((h) => Math.abs(OWNER_Y - h.y) < HOLE_HIT_PX && h.lane === ownerLane);
    if (swallowed) events.push('swallow');
    for (const h of this.holes.filter((hole) => hole !== swallowed && !hole.passed && hole.y > OWNER_Y + HOLE_HIT_PX)) {
      h.passed = true;
      events.push('hole_passed');
    }
    this.holes = this.holes.filter((h) => h !== swallowed && h.y < HEIGHT + 60);
  }

  speedFactor(now: number, ownerLane: Lane, onFoot: boolean): number {
    const wading = onFoot && this.water.includes(ownerLane);
    return (now < this.surfUntil ? SURF_BOOST : 1) * (wading ? WADE_FACTOR : 1);
  }

  // How many lanes the tide has covered.
  flooded(): number {
    return this.water.length;
  }

  surf(now: number): void {
    this.surfUntil = now + SURF_MS;
  }

  surfing(now: number): boolean {
    return now < this.surfUntil;
  }

  strayAbout(): boolean {
    return this.stray.kind !== 'none';
  }

  // One of the lanes the last wave washed over, where it left something behind.
  washedLane(): Lane | undefined {
    return this.washed[Math.floor(this.random() * this.washed.length)];
  }

  // A throw goes to whatever is after you or your dog, if anything is: the chaser swims or stomps off with it, the
  // stray runs off with it. Says where it went and who took it.
  takeThrow(now: number): { x: number; y: number; who: string; taker: 'chaser' | 'stray' } | undefined {
    if (sharkHungry(this.shark)) {
      const at = { x: this.fin.x, y: this.fin.y, who: this.rules.chaser?.name ?? '', taker: 'chaser' as const };
      this.shark = sharkAway(now, this.random);
      return at;
    }
    if (this.stray.kind !== 'none') {
      const at = { x: this.stray.x, y: Math.max(40, this.stray.y), who: '野狗', taker: 'stray' as const };
      this.stray = { kind: 'none', nextAt: now + between(this.random, STRAY_EVERY_MS) };
      return at;
    }
    return undefined;
  }

  private sharkLane(): Lane {
    return this.shark.kind === 'away' ? 1 : this.shark.lane;
  }

  private draw(now: number, dt: number): void {
    this.drawChaser(now, dt);
    this.drawSea(now, dt);
    this.drawZones(now);
    this.drawCharger(now);
    const s = this.stray;
    this.straySprite.setVisible(s.kind !== 'none' && s.y > -30);
    this.strayMark.setVisible(s.kind === 'coming' && s.y > -10);
    if (s.kind !== 'none') this.straySprite.setPosition(s.x, s.y - Math.abs(Math.sin(now / 80)) * 4).setFlipX(s.kind === 'coming' && s.x > WIDTH / 2);
    if (s.kind === 'coming') this.strayMark.setPosition(s.x, s.y - 40).setScale(1 + 0.15 * Math.sin(now / 60));
    for (const [i, sprite] of this.holeSprites.entries()) {
      const h = this.holes[i];
      sprite.setVisible(h !== undefined);
      if (h) sprite.setPosition(LANE_X[h.lane], h.y).setAngle(now / 4);
    }
  }

  // A charger: its lane flashes red, harder as it nears, then it rushes through. A diving pterodactyl grows as it
  // swoops down; a husky sled comes up from behind.
  private drawCharger(now: number): void {
    const c = this.charger;
    const rule = this.rules.charger;
    this.chargerSprite.setVisible(c.kind !== 'none' && rule !== undefined);
    if (c.kind === 'none' || !rule) return;
    const y = chargerY(rule.from, c.d, OWNER_Y);
    if (c.kind === 'coming') {
      const [l, r] = LANE_EDGES[c.lane];
      const near = 1 - Math.min(1, c.d / CHARGE_START_PX);
      this.lungeMark.fillStyle(0xff1744, 0.12 + 0.28 * near + 0.08 * Math.sin(now / 50)).fillRect(l, 0, r - l, HEIGHT);
      this.lungeMark.lineStyle(4, 0xff1744, 0.9).strokeRect(l + 2, 0, r - l - 4, HEIGHT);
    }
    const swoop = rule.from === 'ahead' ? 1 + 0.8 * (1 - Math.min(1, Math.abs(c.d) / CHARGE_START_PX)) : 1;
    // From behind there is little screen below the owner, so it peeks in at the bottom edge until it is close.
    const shown = rule.from === 'behind' ? Math.min(y, HEIGHT - 30) : Math.max(y, 20);
    this.chargerSprite.setPosition(LANE_X[c.lane], shown).setScale(ART_SCALE * 1.2 * swoop);
  }

  private drawChaser(now: number, dt: number): void {
    const s = this.shark;
    this.lungeMark.clear();
    this.fin.setVisible(s.kind !== 'away');
    if (s.kind !== 'away') {
      const to = LANE_X[s.lane];
      this.finX += Math.sign(to - this.finX) * Math.min(Math.abs(to - this.finX), FIN_MOVE_PX_S * dt);
      // Below the owner there is little screen left, so the approach is squeezed into it, drawn over the pocket.
      const y = s.kind === 'hunt' ? OWNER_Y + 26 + (Math.min(s.behind, SHARK_START_BEHIND) / SHARK_START_BEHIND) * (HEIGHT - OWNER_Y - 36) : OWNER_Y + 30 - 50 * (1 - (s.at - now) / SHARK_LUNGE_MS);
      this.fin.setPosition(this.finX + Math.sin(now / 120) * 3, y).setFlipX(Math.sin(now / 400) > 0);
      const [l, r] = LANE_EDGES[s.lane];
      if (s.kind === 'hunt') this.lungeMark.fillStyle(0xff1744, 0.12).fillRect(l, OWNER_Y + 10, r - l, HEIGHT - OWNER_Y - 10);
      if (s.kind === 'lunge') {
        // The whole lane it will bite in flashes red, top to bottom, with a big "!" in it: get out of that lane.
        const flash = 0.5 + 0.5 * Math.sin(now / 45);
        this.lungeMark.fillStyle(0xff1744, 0.2 + 0.25 * flash).fillRect(l, 0, r - l, HEIGHT);
        this.lungeMark.lineStyle(4, 0xff1744, 0.9).strokeRect(l + 2, 0, r - l - 4, HEIGHT);
      }
    }
    this.lungeSign.setVisible(s.kind === 'lunge');
    if (s.kind === 'lunge') this.lungeSign.setPosition(LANE_X[s.lane], OWNER_Y - 110).setScale(1 + 0.15 * Math.sin(now / 45));
    // A black hole's pull shows as a purple glow down its lane.
    for (const h of this.holes.filter((hole) => OWNER_Y - hole.y <= PULL_RANGE_PX && hole.y < OWNER_Y)) {
      const [l, r] = LANE_EDGES[h.lane];
      this.lungeMark.fillStyle(0x7c4dff, 0.14 + 0.08 * Math.sin(now / 70)).fillRect(l, h.y, r - l, OWNER_Y - h.y + 40);
    }
  }

  private drawSea(now: number, dt: number): void {
    this.sea.clear();
    // The sea's edge creeps across as the tide comes in.
    const edge = this.water.length ? LANE_EDGES[this.water[this.water.length - 1]][1] : 0;
    if (this.seaEdge === 0 || edge === 0) this.seaEdge = edge;
    this.seaEdge += Math.sign(edge - this.seaEdge) * Math.min(Math.abs(edge - this.seaEdge), 60 * dt);
    if (this.seaEdge > 1) {
      this.sea.fillStyle(0x2f9fd8, 0.5).fillRect(0, 0, this.seaEdge, HEIGHT);
      this.sea.lineStyle(5, 0xffffff, 0.9).beginPath();
      for (let y = 0; y <= HEIGHT; y += 16) this.sea.lineTo(Math.min(WIDTH, this.seaEdge + 5 * Math.sin(y / 20 + now / 220)), y);
      this.sea.strokePath();
    }
    const t = this.tide;
    if (t.kind === 'calm') return;
    const right = LANE_EDGES[t.lanes[t.lanes.length - 1]][1];
    if (t.kind === 'warn') {
      // The water the wave will roll through flashes, with a line of foam waiting at the bottom edge.
      this.sea.fillStyle(0xffffff, 0.12 + 0.1 * Math.sin(now / 80)).fillRect(0, 0, right, HEIGHT);
      this.sea.fillStyle(0xffffff, 0.95).fillRect(0, HEIGHT - 10 - 5 * Math.sin(now / 120), right, 10);
      return;
    }
    // The wave: a band of deep water behind a foaming front that sweeps up the screen.
    const front = waveFront(t, now)!;
    this.sea.fillStyle(0x1565c0, 0.45).fillRect(0, front, right, 160);
    this.sea.fillStyle(0x81d4fa, 0.8).fillRect(0, front, right, 24);
    this.sea.lineStyle(7, 0xffffff, 0.95).beginPath();
    for (let x = 0; x <= right; x += 10) this.sea.lineTo(x, front + 5 * Math.sin(x / 14 + now / 90));
    this.sea.strokePath();
  }

  private drawZones(now: number): void {
    const g = this.ground.clear();
    for (const z of this.zones) {
      // A zebra crossing, with its light at the roadside: red stops the dog.
      const h = z.bottom - z.top;
      g.fillStyle(0xffffff, 0.9);
      for (let x = 10; x < WIDTH - 10; x += 34) g.fillRect(x, z.top + 30, 20, h - 60);
      const red = lightAt(now) === 'red';
      g.fillStyle(0x263238, 1).fillRoundedRect(WIDTH - 34, z.top + 10, 26, 46, 6);
      g.fillStyle(red ? 0xff1744 : 0x4a1010, 1).fillCircle(WIDTH - 21, z.top + 22, 8);
      g.fillStyle(red ? 0x0f3d1a : 0x00e676, 1).fillCircle(WIDTH - 21, z.top + 44, 8);
    }
  }
}
