import Phaser from 'phaser';
import { ART_SCALE } from '../art';
import { CROSSER_SPEED, HEIGHT, LANE_X, LANES, OWNER_Y, ROW_SPACING_PX, WIDTH, type Lane } from '../config';
import { BEST_DISTANCE_KEY, loadBest } from '../logic/best';
import { loadBreed } from '../logic/prefs';
import { DEFAULT_SHIELD, biomeAt, biomeStart, pickStart, skinFor, type Biome } from '../logic/biomes';
import {
  CATCH_GAP,
  CAT_CHASE_MS,
  LOST_GAP,
  PEE_CHANCE,
  PEE_MS,
  POOP_EVERY_MS,
  POOP_MS,
  RIDES,
  SNIFF_MS,
  START_GAP,
  TOSSES,
  TREE_BARK_MS,
  dogBaseSpeed,
  dogPace,
  mountRide,
  nextSlip,
  nextGap,
  ownerSpeed,
  planChaseRow,
  settleMood,
  type DogMood,
  type Ride,
  type RideKind,
  type Slip,
  type TossKind,
} from '../logic/chase';
import { endGesture, moveGesture, startGesture, type Gesture, type GestureAction } from '../logic/gesture';
import { isObstacle, laneAt, xOf, type Entity, type EntityKind } from '../logic/world';
import { sfx } from '../sfx';
import { track } from '../telemetry';
import { DogActor, OwnerActor, type DogLook } from './Actors';
import { CatChase } from './CatChase';
import { EntityView } from './EntityView';
import type { EndData } from './EndScene';
import { Hud, type Meter } from './Hud';
import { PocketView } from './PocketView';
import { PX_PER_METER, RecordLine } from './RecordLine';
import { Scenery } from './Scenery';

const HIT_PX = 26;
const OWNER_MOVE_SPEED = 900;
const DOG_MOVE_SPEED = 320;
const DOG_LOOKAHEAD_PX = 260;
const DOG_DODGE_PX = 140;
const STUN_MS = 700;
const HIT_GRACE_MS = 1500;
// You can't overtake the dog: reaching it, the dog darts a bit further ahead, so it never just sits glued in front
// of a fast ride. Grabbing the leash on the way scores, at most once per cooldown.
const CATCH_COOLDOWN_MS = 6000;
const CATCH_LEAP_PX = 140;
// What each ride does beyond going fast, shown when you grab it.
const RIDE_PERK: Partial<Record<RideKind, string>> = { car: '撞飞障碍' };
const SHIELD_GRACE_MS = 1000;
const CATCH_SPRINT_MS = 1200;
const SAMPLE_EVERY_MS = 1000;
const SCORE_CATCH = 500;
const SCORE_PICKUP = 20;
const SCORE_SMASH = 30;
const SCORE_POOP = 100;
const RIDE_CRASH_GRACE_MS = 1000;
// Crashing on a ride is no longer free: you stagger for a moment, and every crash spills something from your pocket.
const RIDE_CRASH_STAGGER_MS = 400;
// Poop is picked up by passing anywhere near it in its lane, not only dead centre.
const POOP_REACH_PX = 44;
// Pee is only worth showing where the player can see it.
const PEE_MIN_Y = 60;
const THROW_LOOK: Readonly<Record<'stop' | 'back' | 'slow', DogLook>> = { stop: 'wag', back: 'run', slow: 'run' };
const HAPTIC_CRASH_MS = 40;
const HAPTIC_LOST_MS = 220;
const POCKET_SIZE = 5;
const SPEED_LINES = 14;
const OFFSCREEN_Y = 30;
const DANGER_GAP = 700;
const LEASH_SLACK = Phaser.Display.Color.ValueToColor(0x8d6e63);
const LEASH_MID = Phaser.Display.Color.ValueToColor(0xffa000);
const LEASH_TAUT = Phaser.Display.Color.ValueToColor(0xe53935);
const SLIPPERY: ReadonlySet<EntityKind> = new Set(['puddle']);


// 追狗: the dog bolts, dragging out a long leash. You play the owner, grabbing ever faster rides to keep up and throwing
// things to hold the dog up, while cats, other dogs and lamp posts pull the dog's attention around. If the gap
// grows past LOST_GAP the dog is gone.
export class ChaseScene extends Phaser.Scene {
  private elapsed = 0;
  private run = 0;
  private score = 0;
  private meters = 0;
  private gap = START_GAP;
  private mood: DogMood = { kind: 'run' };
  private moodIcon = '';
  private dogLook: DogLook = 'run';
  private dogX = LANE_X[1];
  private dogTarget: Lane = 1;
  private nextWanderAt = 0;
  private ownerLane: Lane = 1;
  private ownerX: number = LANE_X[1];
  private ride: Ride | undefined;
  private bestRide: RideKind | undefined;
  private stunnedUntil = 0;
  private invulnerableUntil = 0;
  private pocket: TossKind[] = [];
  private entities: Entity[] = [];
  private nextId = 0;
  private rowDistance = 0;
  private biome: Biome = biomeAt(0);
  private catches = 0;
  private nextCatchAt = 0;
  private smashed = 0;
  private rowsSinceRide = 0;
  private nextPoopAt = 0;
  private poopsPicked = 0;
  private poopsTotal = 0;
  private ended = false;
  // Where along the route this run began; `meters` is distance travelled, so records stay fair wherever you start.
  private routeOffset = 0;
  private slip: Slip = { kind: 'held' };
  private nextSampleAt = 0;
  private best = 0;

  private scenery!: Scenery;
  private view!: EntityView;
  private hud!: Hud;
  private recordLine!: RecordLine;
  private owner!: OwnerActor;
  private rideBar!: Phaser.GameObjects.Graphics;
  private dog!: DogActor;
  private bubble!: Phaser.GameObjects.Image;
  private marker!: Phaser.GameObjects.Text;
  private markerDog!: Phaser.GameObjects.Image;
  private pocketView!: PocketView;
  private leash!: Phaser.GameObjects.Graphics;
  private catChase!: CatChase;
  private shielded = false;
  private streaks!: Phaser.GameObjects.Graphics;
  private streakPos: { x: number; y: number }[] = [];

  constructor() {
    super('game');
  }

  create(): void {
    const start = testStartWorld() ?? pickStart(Math.random, loadBest() === 0, lastStart);
    lastStart = start;
    this.routeOffset = biomeStart(start) ?? 0;
    Object.assign(this, {
      elapsed: 0,
      run: Date.now(),
      score: 0,
      meters: 0,
      gap: START_GAP,
      mood: { kind: 'sprint', until: CATCH_SPRINT_MS },
      moodIcon: 'fx-dash',
      dogLook: 'run',
      dogX: LANE_X[1],
      dogTarget: 1,
      nextWanderAt: 2000,
      ownerLane: 1,
      ownerX: LANE_X[1],
      ride: undefined,
      bestRide: undefined,
      stunnedUntil: 0,
      invulnerableUntil: 0,
      pocket: ['ball'],
      entities: [],
      nextId: 0,
      rowDistance: ROW_SPACING_PX - 96,
      biome: biomeAt(this.routeOffset),
      catches: 0,
      nextCatchAt: 0,
      smashed: 0,
      rowsSinceRide: 0,
      nextPoopAt: Phaser.Math.Between(...POOP_EVERY_MS),
      poopsPicked: 0,
      poopsTotal: 0,
      ended: false,
      slip: { kind: 'held' },
      nextSampleAt: 0,
      best: loadBest(),
    });
    track('run_start', { run: this.run, mode: 'drag', variant: 'chase', touch: matchMedia('(pointer: coarse)').matches, start });

    this.scenery = new Scenery(this, this.biome);
    this.streaks = this.add.graphics().setDepth(1);
    this.streakPos = Array.from({ length: SPEED_LINES }, () => ({ x: Phaser.Math.Between(50, WIDTH - 50), y: Phaser.Math.Between(0, HEIGHT) }));
    this.leash = this.add.graphics().setDepth(6);
    this.catChase = new CatChase(this);
    this.shielded = false;
    const breed = loadBreed();
    this.view = new EntityView(this, breed);
    this.owner = new OwnerActor(this);
    this.rideBar = this.add.graphics().setDepth(11);
    this.dog = new DogActor(this, breed);
    this.bubble = this.add.image(0, 0, 'fx-dash').setScale(ART_SCALE).setDepth(11);
    this.marker = this.add.text(0, 76, '', { fontSize: '18px', color: '#fff', fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(20).setStroke('#2b2118', 4);
    this.markerDog = this.add.image(0, 76, `dog-${breed}-run-0`).setScale(ART_SCALE * 0.45).setDepth(20);
    this.pocketView = new PocketView(this, POCKET_SIZE);
    this.hud = new Hud(this);
    // A test run started in a far world must not show or break the real distance record.
    this.recordLine = new RecordLine(this, loadBest(undefined, BEST_DISTANCE_KEY));
    this.bindInput();
    this.popText(WIDTH / 2, 300, `在${this.biome.name}，狗狗突然狂奔！快追！`, '#ffeb3b');
  }

  private bindInput(): void {
    const keys = this.input.keyboard;
    for (const [key, step] of [['LEFT', -1], ['A', -1], ['RIGHT', 1], ['D', 1]] as const) keys?.on(`keydown-${key}`, () => this.steer(step));
    for (const key of ['SPACE', 'UP', 'W']) keys?.on(`keydown-${key}`, () => this.toss());
    let gesture: Gesture | undefined;
    const act = (action: GestureAction | undefined) => {
      if (action === 'throw') this.toss();
      else if (action) this.steer(action === 'left' ? -1 : 1);
    };
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => (gesture = startGesture(p.x, p.y)));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!gesture || !p.isDown) return;
      const step = moveGesture(gesture, p.x, p.y);
      gesture = step.gesture;
      act(step.action);
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!gesture) return;
      const action = endGesture(gesture, p.x, p.y);
      if (!action && !gesture.acted) track('gesture_ignored', { run: this.run, t: this.elapsed, dx: Math.round(p.x - gesture.startX), dy: Math.round(p.y - gesture.startY) });
      gesture = undefined;
      act(action);
    });
  }

  private steer(step: -1 | 1): void {
    if (this.ended) return;
    this.ownerLane = Phaser.Math.Clamp(this.ownerLane + step, 0, 2) as Lane;
    track('move', { run: this.run, t: this.elapsed });
  }

  update(_time: number, deltaMs: number): void {
    if (this.ended) return;
    const dt = Math.min(deltaMs, 50) / 1000;
    this.elapsed += deltaMs;
    const seconds = this.elapsed / 1000;
    this.mood = settleMood(this.mood, this.elapsed);
    if (this.ride && this.elapsed >= this.ride.until) this.dropRide(`${this.rideName(this.ride.kind)}用完了`);

    const dogBase = dogBaseSpeed(seconds);
    const ownerV = ownerSpeed(dogBase, this.ride?.kind, this.isStunned(), seconds);
    this.gap = nextGap(this.gap, dogBase * dogPace(this.mood), ownerV, dt);
    if (this.gap <= CATCH_GAP) this.closeCall();

    const dy = ownerV * dt;
    this.score += dy / 10;
    this.meters += dy / PX_PER_METER;
    if (this.recordLine.update(Math.floor(this.meters))) track('record', { run: this.run, t: this.elapsed, meters: Math.floor(this.meters) });
    this.scenery.scroll(dy);
    this.renderStreaks(dy);
    const biome = biomeAt(this.meters + this.routeOffset);
    if (biome !== this.biome) {
      this.biome = biome;
      this.scenery.enter(biome);
    }
    this.rowDistance += dy;
    this.spawn(seconds);
    this.moveEntities(dy, dt);

    this.stepOwner(dt);
    this.stepDog(dt);
    if (this.catChase.update(this.elapsed, this.dogY(), dt, this.biome.perch)) {
      this.setMood({ kind: 'stop', until: this.elapsed + TREE_BARK_MS }, 'fx-alert', '躲到树上了！狗在树下汪汪叫', '#80deea', 'stand');
    }
    this.maybePoop();
    this.ownerContacts();
    this.dogContacts();
    this.cull();
    this.render();
    this.updateSlip();
    this.sample();
    if (this.slip.kind === 'lost') this.finish();
  }

  private updateSlip(): void {
    const before = this.slip.kind;
    const next = nextSlip(this.slip, this.gap, this.elapsed);
    this.slip = next;
    if (before === 'held' && next.kind === 'slipping') {
      this.popText(this.ownerX, OWNER_Y - 70, '绳子要脱手了！', '#ff5252');
      this.cameras.main.shake(200, 0.006);
      sfx.hurt();
      navigator.vibrate?.([60, 60, 60]);
      track('slip', { run: this.run, t: this.elapsed, ride: this.ride?.kind ?? null, pocket: this.pocket.length });
    } else if (before === 'slipping' && next.kind === 'held') {
      this.popText(this.ownerX, OWNER_Y - 70, '抓住了！', '#a5d6a7');
      sfx.charged();
      track('slip_saved', { run: this.run, t: this.elapsed });
    }
  }

  // One gap reading a second, so the playtest log shows how each run was lost, not just when.
  private sample(): void {
    if (this.elapsed < this.nextSampleAt) return;
    this.nextSampleAt = this.elapsed + SAMPLE_EVERY_MS;
    track('tick', { run: this.run, t: this.elapsed, gap: Math.round(this.gap), ride: this.ride?.kind ?? null, mood: this.mood.kind, stunned: this.isStunned() });
  }

  private isStunned(): boolean {
    return this.elapsed < this.stunnedUntil;
  }

  private dogY(): number {
    return OWNER_Y - this.gap;
  }

  private spawn(seconds: number): void {
    if (this.rowDistance < ROW_SPACING_PX) return;
    this.rowDistance -= ROW_SPACING_PX;
    // The very first row hands over a skateboard right in front of you: the chase is about grabbing rides.
    const row = this.nextId === 0 ? [{ kind: 'ride' as const, lane: 1 as Lane, tag: 'skate' }] : planChaseRow(Math.random, this.meters, seconds, this.rowsSinceRide);
    this.rowsSinceRide = row.some((spec) => spec.kind === 'ride') ? 0 : this.rowsSinceRide + 1;
    // A world can leave a kind out entirely (no puddles at sea): an empty skin list means none of those here.
    for (const spec of row.filter((r) => this.biome.skins[r.kind]?.length !== 0)) {
      const e: Entity = { id: this.nextId++, kind: spec.kind, lane: spec.lane, y: -40, consumed: false, ignoredByDog: false, tag: spec.tag };
      if (e.kind === 'crosser') {
        e.x = e.lane === 0 ? 10 : WIDTH - 10;
        e.vx = e.lane === 0 ? CROSSER_SPEED : -CROSSER_SPEED;
      }
      this.entities.push(e);
      this.view.create(e, this.biome);
    }
  }

  private moveEntities(dy: number, dt: number): void {
    for (const e of this.entities) {
      e.y += dy;
      if (e.kind === 'crosser' && e.x !== undefined) {
        e.x += (e.vx ?? 0) * dt;
        e.lane = laneAt(e.x);
        if (e.x < -40 || e.x > WIDTH + 40) e.consumed = true;
      }
      this.view.sync(e, this.elapsed);
    }
  }

  private stepOwner(dt: number): void {
    const to = LANE_X[this.ownerLane];
    this.ownerX += Math.sign(to - this.ownerX) * Math.min(Math.abs(to - this.ownerX), OWNER_MOVE_SPEED * dt);
  }

  // The dog heads for anything interesting ahead of it, swerves around obstacles, and otherwise wanders.
  private stepDog(dt: number): void {
    const y = this.dogY();
    const ahead = (e: Entity) => !e.consumed && e.y < y && y - e.y < DOG_LOOKAHEAD_PX;
    const bait = this.entities.filter((e) => ahead(e) && (e.kind === 'critter' || e.kind === 'buddy')).sort((a, b) => b.y - a.y)[0];
    const blocked = (lane: Lane) => this.entities.some((e) => ahead(e) && isObstacle(e.kind) && e.lane === lane && y - e.y < DOG_DODGE_PX);
    if (this.catChase.active) this.dogTarget = this.catChase.target;
    else if (bait) this.dogTarget = bait.lane;
    else if (blocked(this.dogTarget)) this.dogTarget = LANES.find((lane) => !blocked(lane)) ?? this.dogTarget;
    else if (this.elapsed >= this.nextWanderAt) {
      this.dogTarget = Phaser.Math.Clamp(this.dogTarget + (Math.random() < 0.5 ? -1 : 1), 0, 2) as Lane;
      this.nextWanderAt = this.elapsed + Phaser.Math.Between(1500, 3000);
    }
    const to = LANE_X[this.dogTarget];
    this.dogX += Math.sign(to - this.dogX) * Math.min(Math.abs(to - this.dogX), DOG_MOVE_SPEED * dt);
  }

  private touching(e: Entity, x: number, y: number): boolean {
    return !e.consumed && Math.abs(e.y - y) < HIT_PX && Math.abs(xOf(e) - x) < HIT_PX;
  }

  private ownerContacts(): void {
    for (const e of this.entities) {
      if (e.kind === 'poop' && !e.consumed && Math.abs(e.y - OWNER_Y) < HIT_PX && Math.abs(xOf(e) - this.ownerX) < POOP_REACH_PX) this.pickPoop(e);
      if (!this.touching(e, this.ownerX, OWNER_Y)) continue;
      if (e.kind === 'ride') this.mount(e);
      else if (e.kind === 'toss') this.pocketItem(e);
      else if (e.kind === 'shield') this.tieBalloon(e);
      else if (isObstacle(e.kind) || SLIPPERY.has(e.kind)) this.hitObstacle(e);
    }
  }

  private mount(e: Entity): void {
    this.consume(e);
    const kind = e.tag as RideKind;
    const toppedUp = this.ride !== undefined && RIDES[kind].tier < RIDES[this.ride.kind].tier;
    this.ride = mountRide(this.ride, kind, this.elapsed);
    const order = Object.keys(RIDES) as RideKind[];
    if (!this.bestRide || order.indexOf(kind) > order.indexOf(this.bestRide)) this.bestRide = kind;
    this.score += SCORE_PICKUP;
    const perk = RIDE_PERK[kind] ? `\n${RIDE_PERK[kind]}` : '';
    const label = toppedUp ? `${this.rideName(this.ride.kind)} 续航 +1.5秒` : `${this.rideName(kind)} ${'★'.repeat(RIDES[kind].tier)}${perk}`;
    this.popText(this.ownerX, OWNER_Y - 50, label, '#ffeb3b');
    sfx.charged();
    track('ride', { run: this.run, t: this.elapsed, kind, gap: Math.round(this.gap) });
  }

  // Rides and the balloon go by this world's names: a surfboard at sea, a skateboard in town.
  private rideName(kind: RideKind): string {
    return this.biome.rides?.[kind]?.name ?? RIDES[kind].name;
  }

  private tossLook(kind: TossKind): { key: string; name: string; line: string } {
    return this.biome.tosses?.[kind] ?? { key: `toss-${kind}`, name: TOSSES[kind].name, line: TOSSES[kind].line };
  }

  // No poop or pee where it couldn't happen: in the water, or inside a space suit.
  private toiletAllowed(): boolean {
    return !this.biome.swim && !this.biome.helmet;
  }

  private shieldName(): string {
    return (this.biome.shield ?? DEFAULT_SHIELD).name;
  }

  private tieBalloon(e: Entity): void {
    this.consume(e);
    this.score += SCORE_PICKUP;
    this.popText(this.ownerX, OWNER_Y - 60, this.shielded ? `已经有${this.shieldName()}了 +${SCORE_PICKUP}` : `${(this.biome.shield ?? DEFAULT_SHIELD).worn ? '套上' : '绑上'}${this.shieldName()}！替你挡一次撞击`, '#e1f5fe');
    this.shielded = true;
    sfx.charged();
    track('shield', { run: this.run, t: this.elapsed, ride: this.ride?.kind ?? null });
  }

  private pocketItem(e: Entity): void {
    const kind = e.tag as TossKind;
    this.score += SCORE_PICKUP;
    const full = this.pocket.length >= POCKET_SIZE;
    e.consumed = true;
    const sprite = this.view.take(e.id);
    if (full || !sprite) sprite?.destroy();
    else {
      // The pickup flies down into its pocket slot, and only lands there when it arrives.
      const target = this.pocketView.slot(this.pocket.length);
      this.tweens.add({ targets: sprite, x: target.x, y: target.y, scale: ART_SCALE * 0.9, duration: 320, ease: 'Cubic.easeIn', onComplete: () => sprite.destroy() });
    }
    if (!full) this.pocket = [...this.pocket, kind];
    track('pocket', { run: this.run, t: this.elapsed, kind, full, held: this.pocket.length });
    this.popText(this.ownerX, OWNER_Y - 50, full ? `口袋满了 +${SCORE_PICKUP}` : `+${this.tossLook(kind).name}`, '#ffffff');
    sfx.pickup(1);
  }

  private hitObstacle(e: Entity): void {
    const ride = this.ride && RIDES[this.ride.kind];
    if (this.elapsed < this.invulnerableUntil) return;
    if (ride?.smashes) {
      this.consume(e);
      this.smashed += 1;
      this.score += SCORE_SMASH;
      this.cameras.main.shake(80, 0.006);
      sfx.smash(1);
      return;
    }
    this.consume(e);
    if (this.shielded) {
      // The balloon takes the knock: ride, pocket and owner all come through untouched.
      this.shielded = false;
      this.owner.popBalloon();
      this.invulnerableUntil = this.elapsed + SHIELD_GRACE_MS;
      this.popText(this.ownerX, OWNER_Y - 60, `啪！${this.shieldName()}替你挡了一下`, '#e1f5fe');
      sfx.pop();
      track('shield_pop', { run: this.run, t: this.elapsed, kind: e.kind, ride: this.ride?.kind ?? null });
      return;
    }
    track('chase_hit', { run: this.run, t: this.elapsed, kind: e.kind, gap: Math.round(this.gap), ride: this.ride?.kind ?? null, spilled: this.pocket[0] ?? null });
    this.spill();
    if (ride) {
      // The ride takes most of the knock: it breaks and you stagger, but you stay on your feet.
      this.popText(this.ownerX, OWNER_Y - 50, `${this.rideName(this.ride!.kind)}撞坏了！`, '#ffcc80');
      this.owner.breakRide();
      navigator.vibrate?.(HAPTIC_CRASH_MS);
      this.ride = undefined;
      this.stunnedUntil = this.elapsed + RIDE_CRASH_STAGGER_MS;
      this.invulnerableUntil = this.elapsed + RIDE_CRASH_GRACE_MS;
      this.cameras.main.shake(100, 0.008);
      sfx.rideCrash();
      return;
    }
    this.stunnedUntil = this.elapsed + STUN_MS;
    this.invulnerableUntil = this.elapsed + HIT_GRACE_MS;
    this.cameras.main.shake(160, 0.012);
    const fall = e.tag === 'pee' ? '踩到狗尿滑倒了！' : SLIPPERY.has(e.kind) ? '踩到水坑滑倒了！' : '摔了一跤！';
    this.popText(this.ownerX, OWNER_Y - 50, fall, '#ff8a80');
    sfx.hurt();
    navigator.vibrate?.(HAPTIC_CRASH_MS * 2);
  }

  // A cat or squirrel sends the dog bolting, unless it's busy with something you threw; another dog stops it for a
  // sniff; a lamp post now and then stops it for a pee.
  private dogContacts(): void {
    const busy = this.mood.kind === 'stop' || this.mood.kind === 'back' || this.catChase.active;
    for (const e of this.entities) {
      if (e.ignoredByDog || !this.touching(e, this.dogX, this.dogY())) continue;
      e.ignoredByDog = true;
      if (e.kind === 'critter' && !busy) {
        this.consume(e);
        const critter = skinFor(this.biome, 'critter', () => 0);
        this.catChase.start(critter, e.lane, this.dogX, this.dogY(), this.elapsed);
        this.setMood({ kind: 'sprint', until: this.elapsed + CAT_CHASE_MS }, 'fx-dash', '看到了！狂追！', '#ff8a80', 'run');
      } else if (e.kind === 'buddy' && !busy) {
        this.setMood({ kind: 'stop', until: this.elapsed + SNIFF_MS }, 'fx-sniff', '停下来闻一闻', '#80deea', 'stand');
      } else if (e.kind === 'pole' && this.toiletAllowed() && this.mood.kind === 'run' && this.dogY() > PEE_MIN_Y && Math.random() < PEE_CHANCE) {
        this.pee();
      }
    }
  }

  // The dog cocks a leg against the post and leaves a puddle behind: a free breather, and a slippery one to dodge.
  private pee(): void {
    this.setMood({ kind: 'stop', until: this.elapsed + PEE_MS }, 'fx-drops', '抬腿撒尿…别踩到！', '#ffe066', 'pee');
    const e: Entity = { id: this.nextId++, kind: 'puddle', tag: 'pee', lane: laneAt(this.dogX), y: this.dogY() + 16, consumed: false, ignoredByDog: true };
    this.entities.push(e);
    this.view.create(e, this.biome);
  }

  // A crash knocks the first thing out of your pocket; it tumbles away across the road.
  private spill(): void {
    const [lost, ...rest] = this.pocket;
    if (!lost) return;
    this.pocket = rest;
    const from = this.pocketView.slot(0);
    const item = this.add.image(from.x, from.y, this.tossLook(lost).key).setScale(ART_SCALE).setDepth(22);
    this.tweens.add({ targets: item, x: from.x + Phaser.Math.Between(40, 120), y: from.y - Phaser.Math.Between(60, 120), angle: 360, alpha: 0, duration: 600, ease: 'Quad.easeOut', onComplete: () => item.destroy() });
    this.popText(from.x + 40, from.y - 40, `掉了${this.tossLook(lost).name}`, '#ffcc80');
  }

  private setMood(mood: DogMood, icon: string, line: string, color: string, look: DogLook): void {
    this.mood = mood;
    this.moodIcon = icon;
    this.dogLook = look;
    this.popText(this.dogX, Math.max(110, this.dogY() - 30), line, color);
    track('dog_event', { run: this.run, t: this.elapsed, mood: mood.kind, glyph: icon, gap: Math.round(this.gap) });
  }

  // Now and then the dog stops for a poop, which stays on the road: pick it up as you pass for a good-owner bonus.
  private maybePoop(): void {
    const y = this.dogY();
    if (!this.toiletAllowed() || this.elapsed < this.nextPoopAt || this.mood.kind !== 'run' || this.catChase.active || y < 120) return;
    this.nextPoopAt = this.elapsed + Phaser.Math.Between(...POOP_EVERY_MS);
    this.setMood({ kind: 'stop', until: this.elapsed + POOP_MS }, 'poop', '狗狗停下来拉粑粑…', '#ffcc80', 'squat');
    const e: Entity = { id: this.nextId++, kind: 'poop', lane: laneAt(this.dogX), y: y + 14, consumed: false, ignoredByDog: true };
    this.entities.push(e);
    this.view.create(e, this.biome);
    this.poopsTotal += 1;
  }

  private pickPoop(e: Entity): void {
    this.consume(e);
    this.poopsPicked += 1;
    this.score += SCORE_POOP;
    this.popText(this.ownerX, OWNER_Y - 50, `捡起便便！好主人 +${SCORE_POOP}`, '#a5d6a7');
    sfx.pickup(3);
    track('poop', { run: this.run, t: this.elapsed, picked: true });
  }

  private toss(): void {
    if (this.ended) return;
    const [kind, ...rest] = this.pocket;
    if (!kind) {
      this.popText(this.ownerX, OWNER_Y - 50, '口袋空了', '#ffcc80');
      return;
    }
    this.pocket = rest;
    this.catChase.escape();
    const spec = TOSSES[kind];
    const look = this.tossLook(kind);
    const thrown = this.add.image(this.ownerX, OWNER_Y - 20, look.key).setScale(ART_SCALE).setDepth(12);
    this.tweens.add({ targets: thrown, x: this.dogX, y: Math.max(20, this.dogY()), angle: 540, duration: 350, onComplete: () => thrown.destroy() });
    this.setMood({ kind: spec.mood, until: this.elapsed + spec.ms }, look.key, look.line, '#ffeb3b', THROW_LOOK[spec.mood]);
    sfx.charged();
    track('toss', { run: this.run, t: this.elapsed, kind, gap: Math.round(this.gap) });
  }

  // Catching right up with the dog scores big, but it slips away again with a burst of speed.
  private closeCall(): void {
    this.gap += CATCH_LEAP_PX;
    this.mood = { kind: 'sprint', until: this.elapsed + CATCH_SPRINT_MS };
    this.moodIcon = 'fx-dash';
    this.dogLook = 'run';
    if (this.elapsed < this.nextCatchAt) {
      this.popText(this.dogX, Math.max(110, this.dogY() - 30), '嗖！窜出去了', '#ffcc80');
      return;
    }
    this.catches += 1;
    this.score += SCORE_CATCH;
    this.nextCatchAt = this.elapsed + CATCH_COOLDOWN_MS;
    this.cameras.main.flash(120, 255, 240, 150);
    this.popText(this.dogX, Math.max(110, this.dogY() - 30), `抓住狗绳了！+${SCORE_CATCH}`, '#ffeb3b');
    this.time.delayedCall(450, () => this.popText(this.dogX, Math.max(110, this.dogY() - 30), '又挣脱了！', '#ff8a80'));
    sfx.record();
    track('catch', { run: this.run, t: this.elapsed });
  }


  private dropRide(message: string): void {
    sfx.rideEnd();
    this.ride = undefined;
    this.popText(this.ownerX, OWNER_Y - 50, message, '#ffcc80');
  }

  private consume(e: Entity): void {
    e.consumed = true;
    this.view.fade(e.id);
  }

  private cull(): void {
    const gone = this.entities.filter((e) => e.y > HEIGHT + 60 || (e.kind === 'crosser' && e.consumed));
    for (const e of gone.filter((g) => g.kind === 'poop' && !g.consumed)) {
      this.popText(xOf(e), HEIGHT - 60, '便便没捡…', '#ffcc80');
      track('poop', { run: this.run, t: this.elapsed, picked: false });
    }
    for (const e of gone) this.view.remove(e.id);
    this.entities = this.entities.filter((e) => !gone.includes(e));
  }

  private render(): void {
    const y = this.dogY();
    const running = this.mood.kind !== 'stop';
    this.dog.update(this.elapsed, this.dogX, y, running ? 'run' : this.dogLook, dogPace(this.mood), this.biome.swim);
    this.dog.wearHelmet(Boolean(this.biome.helmet));
    this.owner.update(this.elapsed, this.ownerX, this.ride?.kind, this.isStunned(), this.elapsed < this.invulnerableUntil, this.shielded, this.biome);
    this.renderLeash();
    this.renderRideTimer();
    this.bubble.setPosition(this.dogX + 22, y - 30).setTexture(this.moodIcon).setVisible(this.mood.kind !== 'run' && y > -20);
    const lost = this.gap > DANGER_GAP;
    const markerX = Phaser.Math.Clamp(this.dogX, 50, WIDTH - 90);
    const blink = lost ? 0.6 + 0.4 * Math.sin(this.elapsed / 80) : 1;
    this.markerDog.setVisible(y < OFFSCREEN_Y).setPosition(markerX, 76).setAlpha(blink);
    this.marker
      .setVisible(y < OFFSCREEN_Y)
      .setPosition(markerX + 20, 76)
      .setText(`↑ ${Math.round((this.gap - OWNER_Y) / PX_PER_METER)}m`)
      .setColor(lost ? '#ff5252' : '#ffffff')
      .setAlpha(blink);
    this.pocketView.render(this.pocket.map((k) => this.tossLook(k).key), lost, this.elapsed);
    this.hud.render(this.score, Math.floor(this.meters), this.best, this.gapMeter(), this.elapsed);
  }

  private renderRideTimer(): void {
    this.rideBar.clear();
    if (!this.ride) return;
    const left = (this.ride.until - this.elapsed) / RIDES[this.ride.kind].ms;
    const x = this.ownerX;
    this.rideBar.fillStyle(0x000000, 0.4).fillRect(x - 22, OWNER_Y + 42, 44, 5).fillStyle(left < 0.3 ? 0xff7043 : 0xffeb3b, 1).fillRect(x - 22, OWNER_Y + 42, 44 * left, 5);
  }

  // The leash only shows how far ahead the dog is: slack and brown up close, taut, thin and red near the end of its
  // length. When the dog is off screen it runs off the top edge.
  private renderLeash(): void {
    const t = Phaser.Math.Clamp((this.gap - CATCH_GAP) / (LOST_GAP - CATCH_GAP), 0, 1);
    const from = this.owner.hand();
    const to = this.dogY() > -20 ? this.dog.collar() : { x: this.dogX, y: -10 };
    const hand = new Phaser.Math.Vector2(from.x, from.y);
    const end = new Phaser.Math.Vector2(to.x, Math.max(-10, to.y));
    const slack = (1 - t) * 45 * Math.sin(this.elapsed / 260);
    const strain = t > 0.7 ? Phaser.Math.FloatBetween(-3, 3) : 0;
    const bend = new Phaser.Math.Vector2((hand.x + end.x) / 2 + slack + strain, (hand.y + end.y) / 2);
    const color = t < 0.5 ? Phaser.Display.Color.Interpolate.ColorWithColor(LEASH_SLACK, LEASH_MID, 50, t * 100) : Phaser.Display.Color.Interpolate.ColorWithColor(LEASH_MID, LEASH_TAUT, 50, (t - 0.5) * 100);
    const slipping = this.slip.kind === 'slipping';
    this.leash.clear().lineStyle(4 - 2 * t, Phaser.Display.Color.GetColor(color.r, color.g, color.b), slipping ? 0.4 + 0.6 * Math.abs(Math.sin(this.elapsed / 50)) : 1);
    new Phaser.Curves.QuadraticBezier(hand, bend, end).draw(this.leash, 24);
  }

  // Speed lines on the road, more and longer the faster the ride, so a better ride feels faster at a glance.
  private renderStreaks(dy: number): void {
    const ride = this.ride && !this.isStunned() ? RIDES[this.ride.kind] : undefined;
    this.streaks.clear();
    if (!ride) return;
    const shown = Math.min(SPEED_LINES, ride.tier * 2);
    this.streaks.lineStyle(2, 0xffffff, 0.12 + 0.05 * ride.tier);
    for (const [i, p] of this.streakPos.entries()) {
      p.y += dy * 1.5;
      if (p.y > HEIGHT) Object.assign(p, { y: -40, x: Phaser.Math.Between(50, WIDTH - 50) });
      if (i < shown) this.streaks.lineBetween(p.x, p.y, p.x, p.y + 10 + 12 * ride.tier);
    }
  }

  private gapMeter(): Meter {
    const fill = 1 - (this.gap - CATCH_GAP) / (LOST_GAP - CATCH_GAP);
    const color = fill > 0.6 ? 0x66bb6a : fill > 0.3 ? 0xffa726 : 0xef5350;
    return { fill, color, label: fill < 0.3 ? '狗要跑丢了！' : '离狗狗', labelColor: fill < 0.3 ? '#ff8a80' : '#fff', blink: fill < 0.3 };
  }

  private popText(x: number, y: number, text: string, color: string): void {
    const t = this.add.text(x, y, text, { fontSize: '18px', color, fontStyle: 'bold' }).setOrigin(0.5).setDepth(30).setStroke('#2b2118', 5);
    // Keep the whole line on screen, even for something said at the edge of the road.
    t.setX(Phaser.Math.Clamp(x, t.width / 2 + 6, WIDTH - t.width / 2 - 6)).setScale(0.6);
    this.tweens.add({ targets: t, scale: 1, duration: 160, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, delay: 250, duration: 750, onComplete: () => t.destroy() });
  }

  private finish(): void {
    this.ended = true;
    const meters = Math.floor(this.meters);
    track('run_end', { run: this.run, t: this.elapsed, score: Math.floor(this.score), meters, catches: this.catches, smashed: this.smashed, pocketLeft: this.pocket.length, onRide: this.ride?.kind ?? null });
    this.popText(WIDTH / 2, 300, '绳子脱手了…狗狗跑丢了', '#ff8a80');
    navigator.vibrate?.(HAPTIC_LOST_MS);
    const data: EndData = {
      score: Math.floor(this.score),
      meters,
      lines: [`抓住狗绳 ${this.catches} 次   捡便便 ${this.poopsPicked}/${this.poopsTotal}`, ...(this.bestRide ? [`最快坐过 ${RIDES[this.bestRide].name}`] : []), ...(this.smashed ? [`开车撞飞 ${this.smashed} 个`] : [])],
    };
    this.time.delayedCall(700, () => this.scene.start('end', data));
  }
}

let lastStart: Biome['id'] | undefined;

// Dev only: `?world=space` (or sea, snow, desert, prehistoric...) always starts the chase in that world.
function testStartWorld(): Biome['id'] | undefined {
  if (!import.meta.env.DEV) return undefined;
  const world = new URLSearchParams(window.location.search).get('world');
  return world !== null && biomeStart(world) !== undefined ? (world as Biome['id']) : undefined;
}
