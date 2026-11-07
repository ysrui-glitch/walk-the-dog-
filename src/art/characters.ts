import { INK, dot, line, paint, sticker, type Art } from './sticker';

// Everyone with legs. Characters face right; each run cycle is four frames so ears, tails and legs swing.

// A dog breed is a palette plus a few shape choices: ear, tail and face markings.
export interface Breed {
  readonly name: string;
  readonly body: string;
  // Far legs and floppy ears.
  readonly dark: string;
  // Chest, muzzle and (for a husky) the face mask.
  readonly light: string;
  readonly collar: string;
  readonly ears: 'floppy' | 'pointy';
  readonly tail: 'straight' | 'curl' | 'bushy';
  readonly mask?: boolean;
  readonly eye?: string;
}

export const BREEDS = {
  golden: { name: '金毛', body: '#eba84a', dark: '#a9692c', light: '#f7d290', collar: '#d9363e', ears: 'floppy', tail: 'bushy' },
  lab: { name: '拉布拉多', body: '#e9c88c', dark: '#c29a5a', light: '#f6e2b8', collar: '#3fae5a', ears: 'floppy', tail: 'straight' },
  collie: { name: '牧羊犬', body: '#2f2b2e', dark: '#1b191b', light: '#ffffff', collar: '#3d8bfd', ears: 'floppy', tail: 'bushy' },
  shiba: { name: '柴犬', body: '#d9803a', dark: '#a85a22', light: '#fff3e0', collar: '#e53935', ears: 'pointy', tail: 'curl' },
  tugou: { name: '中华田园犬', body: '#d4a257', dark: '#a8783a', light: '#f3ddb0', collar: '#ff7043', ears: 'pointy', tail: 'curl' },
  husky: { name: '哈士奇', body: '#8d97a3', dark: '#5f6873', light: '#ffffff', collar: '#e53935', ears: 'pointy', tail: 'bushy', mask: true, eye: '#3fa9f5' },
} as const satisfies Record<string, Breed>;

export type BreedId = keyof typeof BREEDS;

// Dogs met on the road: a poodle plus every breed.
export const POODLE: Breed = { name: '贵宾', body: '#f7f1f3', dark: '#e7b6c9', light: '#ffffff', collar: '#8e5bd6', ears: 'floppy', tail: 'bushy' };

export type DogPose = 'run' | 'stand' | 'squat' | 'pee';

const RUN_LEGS = [28, 10, -26, -8];
const RUN_EARS = [-12, 14, 30, 8];
const RUN_TAILS = [-55, -35, -15, -35];

function leg(x: number, y: number, angle: number, fill: string): string {
  return `<rect x="-3" y="-1" width="6.4" height="14" rx="3.2" transform="translate(${x} ${y}) rotate(${angle})" ${paint(fill)}/>`;
}

function tail(b: Breed, angle: number): string {
  if (b.tail === 'curl') {
    const d = 'M-20,-5 C-30,-14 -26,-28 -16,-24 C-10,-22 -14,-15 -18,-16';
    return `<g transform="rotate(${angle / 4} -20 -5)"><path d="${d}" ${line(INK, 8.5)}/><path d="${d}" ${line(b.body, 5)}/></g>`;
  }
  if (b.tail === 'bushy') return `<g transform="rotate(${angle} -22 -4)"><ellipse cx="-24" cy="-14" rx="6" ry="12" ${paint(b.body)}/><ellipse cx="-24" cy="-23" rx="3.5" ry="4" fill="${b.light}"/></g>`;
  return `<ellipse cx="-24" cy="-13" rx="4.2" ry="10" transform="rotate(${angle} -22 -4)" ${paint(b.body)}/>`;
}

function ear(b: Breed, angle: number): string {
  if (b.ears === 'pointy') return `<path d="M11,-21 L13,-35 L21,-24 Z" transform="rotate(${angle / 5} 15 -22)" ${paint(b.body)}/><path d="M13.5,-23 L14.5,-31 L18.5,-24.5 Z" fill="${b.dark}"/>`;
  return `<ellipse cx="12" cy="-9" rx="4.8" ry="9.5" transform="rotate(${angle} 12 -17)" ${paint(b.dark)}/>`;
}

function dogBody(b: Breed, legSwing: number, earAngle: number, tailAngle: number, frontLift = 0, hindLift = 0): string {
  const mask = b.mask ? `<path d="M9,-12 Q18,-4 28,-8 L30,-14 Q22,-12 18,-20 Q14,-12 9,-12 Z" fill="${b.light}"/>` : '';
  return `
  ${tail(b, tailAngle)}
  ${leg(-15, 5, -legSwing + hindLift, b.dark)}${leg(9, 5, legSwing - frontLift, b.dark)}
  <ellipse cx="-2" cy="0" rx="23" ry="12.5" ${paint(b.body)}/>
  <ellipse cx="6" cy="5" rx="12" ry="5.5" fill="${b.light}"/>
  ${leg(-9, 6, legSwing, b.body)}${leg(14, 5, -legSwing - frontLift, b.body)}
  <rect x="8" y="-10" width="6.5" height="13" rx="2.5" ${paint(b.collar)}/>
  <circle cx="18" cy="-14" r="11.5" ${paint(b.body)}/>
  ${mask}
  <ellipse cx="29" cy="-10" rx="8.5" ry="6" ${paint(b.light === '#ffffff' || b.ears === 'pointy' ? b.light : b.body)}/>
  ${ear(b, earAngle)}
  ${dot(21, -17, 2.2, b.eye ?? INK)}${dot(21, -17, 1, INK)}${dot(22, -18, 0.7, '#fff')}${dot(36.5, -11.5, 2.6)}
  <path d="M27,-5 Q30,-2 33,-5" ${line(INK, 1.6)}/>`;
}

export function dog(b: Breed, pose: DogPose, phase = 0): Art {
  if (pose === 'run') return sticker(84, 64, `<g transform="translate(-3 2)">${dogBody(b, RUN_LEGS[phase], RUN_EARS[phase], RUN_TAILS[phase])}</g>`);
  if (pose === 'stand') return sticker(84, 64, `<g transform="translate(-3 2)">${dogBody(b, 0, 4, -70 + phase * 25)}</g>`);
  if (pose === 'pee') {
    // Hind leg cocked high, a little arc of pee, a very serious face.
    const stream = `<path d="M-18,-4 Q-34,0 -38,24" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M-18,-4 Q-34,0 -38,24" fill="none" stroke="#ffd84a" stroke-width="3.6" stroke-linecap="round"/>`;
    return sticker(96, 64, `<g transform="translate(4 2)">${stream}${dogBody(b, 0, 6, -60, 0, 95)}</g>`);
  }
  // Squatting for a poop: rear end down, tail straight up, front legs braced.
  return sticker(84, 64, `<g transform="translate(-3 6) rotate(-14 0 6)">${dogBody(b, 0, 10, -80, -18)}</g>`);
}

// The owner, side on: four run frames, standing on a ride, and mid-tumble.
export type OwnerPose = 'run' | 'ride' | 'fall';

const SKIN = '#ffd3ab';
const HAIR = '#5a3a22';
const SHIRT = '#ff6b5e';
const PANTS = '#3b4a6b';
const SHOE = '#2f3540';

const OWNER_LEGS = [32, 0, -32, 0];
const OWNER_ARMS = [-30, 0, 30, 0];

function limb(x: number, y: number, angle: number, length: number, fill: string, foot?: string): string {
  const shoe = foot ? `<ellipse cx="2.5" cy="${length}" rx="5" ry="3" ${paint(foot, 2)}/>` : '';
  return `<g transform="translate(${x} ${y}) rotate(${angle})"><rect x="-3.6" y="-2" width="7.2" height="${length + 2}" rx="3.6" ${paint(fill)}/>${shoe}</g>`;
}

function head(mouthOpen: boolean, dizzy = false): string {
  const eyes = dizzy ? `<path d="M2,-27 l4,4 M6,-27 l-4,4" ${line(INK, 1.6)}/>` : dot(5, -25, 1.8);
  const mouth = mouthOpen ? `<ellipse cx="8" cy="-19" rx="2" ry="2.6" fill="${INK}"/>` : `<path d="M5,-19 Q8,-17 10,-19" ${line(INK, 1.5)}/>`;
  return `<circle cx="0" cy="-24" r="11" ${paint(SKIN)}/>
  <path d="M-11,-25 A11,11 0 0 1 11,-26 Q4,-31 -2,-30 Q-8,-27 -11,-25 Z" ${paint(HAIR)}/>
  ${eyes}${mouth}`;
}

function ownerBody(legA: number, legB: number, backArm: number, frontArm: number, mouthOpen: boolean, dizzy = false): string {
  return `
  ${limb(-5, -12, backArm, 13, SKIN)}
  ${limb(-3, 6, legB, 15, PANTS, SHOE)}
  <rect x="-10" y="-14" width="20" height="23" rx="8" ${paint(SHIRT)}/>
  ${limb(3, 6, legA, 15, PANTS, SHOE)}
  ${head(mouthOpen, dizzy)}
  ${limb(4, -10, frontArm, 14, SKIN)}`;
}

export function owner(pose: OwnerPose, phase = 0): Art {
  if (pose === 'run') return sticker(60, 84, `<g transform="translate(0 6) rotate(8 0 20)">${ownerBody(OWNER_LEGS[phase], -OWNER_LEGS[phase], OWNER_ARMS[phase], -70, true)}</g>`);
  if (pose === 'ride') return sticker(60, 84, `<g transform="translate(-2 6) rotate(12 0 20)">${ownerBody(-8, 12, 20, -75, false)}</g>`);
  return sticker(84, 84, `<g transform="translate(0 4) rotate(-75 0 0)">${ownerBody(60, -40, 150, 200, true, true)}</g>`);
}

// Where the leash leaves the owner's hand, relative to the sprite centre in display pixels.
export const OWNER_HAND: Record<OwnerPose, { x: number; y: number }> = {
  run: { x: 20, y: -8 },
  ride: { x: 20, y: -10 },
  fall: { x: 10, y: -14 },
};

// The critters a dog cannot resist: a cat (orange by day, black at night), a squirrel, a crab. Two run frames each.
export function cat(fur: string, stripe: string, phase: number): Art {
  const legs = phase === 0 ? [20, -20] : [-20, 20];
  return sticker(56, 44, `
  <path d="M-16,-2 Q-28,-6 -24,-18" ${line(INK, 7)}/><path d="M-16,-2 Q-28,-6 -24,-18" ${line(fur, 4)}/>
  ${leg(-10, 5, legs[0], fur)}${leg(8, 5, legs[1], fur)}
  <ellipse cx="-1" cy="0" rx="16" ry="9" ${paint(fur)}/>
  ${leg(-5, 6, legs[1], fur)}${leg(12, 5, legs[0], fur)}
  <path d="M-6,-8 l3,6 M0,-9 l2,6" ${line(stripe, 2)}/>
  <path d="M10,-17 L11,-27 L17,-20 Z M20,-19 L24,-28 L26,-17 Z" ${paint(fur)}/>
  <circle cx="17" cy="-12" r="9" ${paint(fur)}/>
  ${dot(20, -13, 1.8)}${dot(25, -10, 1.3, '#f48fb1')}
  <path d="M24,-8 l6,-1 M24,-6 l6,1" ${line(INK, 1)}/>`);
}

export function squirrel(phase: number): Art {
  const fur = '#b5733c';
  const hop = phase === 0 ? 0 : -3;
  return sticker(54, 50, `<g transform="translate(0 ${hop})">
  <path d="M-10,6 C-30,2 -30,-24 -14,-22 C-6,-21 -10,-10 -14,-8" ${paint('#c98a52')}/>
  <ellipse cx="2" cy="4" rx="11" ry="9" ${paint(fur)}/>
  ${leg(0, 9, phase === 0 ? 30 : -10, fur)}
  <path d="M14,-14 L15,-21 L19,-15 Z" ${paint(fur)}/>
  <circle cx="13" cy="-7" r="8" ${paint(fur)}/>
  <ellipse cx="6" cy="6" rx="5" ry="6" fill="#f3d2a8"/>
  ${dot(16, -8, 1.7)}${dot(21, -5, 1.4)}</g>`);
}

export function crab(phase: number): Art {
  const red = '#e8503a';
  const lift = phase === 0 ? -6 : 0;
  return sticker(58, 40, `
  <path d="M-14,6 l-8,8 M-8,8 l-5,9 M8,8 l5,9 M14,6 l8,8" ${line(INK, 3)}/>
  <path d="M-16,-2 Q-24,${-10 + lift} -18,${-16 + lift} M16,-2 Q24,${-10 - lift} 18,${-16 - lift}" ${line(INK, 3)}/>
  <circle cx="-19" cy="${-18 + lift}" r="6" ${paint(red)}/><circle cx="19" cy="${-18 - lift}" r="6" ${paint(red)}/>
  <ellipse cx="0" cy="2" rx="17" ry="10" ${paint(red)}/>
  <path d="M-5,-7 l0,-6 M5,-7 l0,-6" ${line(INK, 2)}/>
  ${dot(-5, -14, 2.6, '#fff')}${dot(5, -14, 2.6, '#fff')}${dot(-5, -14, 1.3)}${dot(5, -14, 1.3)}
  <path d="M-4,4 Q0,7 4,4" ${line(INK, 1.6)}/>`);
}

// In water: only the top of the swimmer shows above a ripple, paws or arms churning in two frames.
const WATER = '#2f9fd8';
const ripple = (cx: number, cy: number, rx: number): string =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="8.5" fill="${WATER}"/><path d="M${cx - rx + 6},${cy - 3} q6,-4 12,0 t12,0 t12,0 t12,0" ${line('#ffffff', 2)}/>`;

export function dogSwim(b: Breed, phase: number): Art {
  const paddle = phase === 0 ? [-40, 30] : [30, -40];
  return sticker(88, 56, `<g transform="translate(-2 4)">${dogBody(b, paddle[0], phase === 0 ? 20 : -6, -20, paddle[1] - paddle[0])}${ripple(4, 4, 36)}</g>`);
}

export function ownerSwim(phase: number): Art {
  const arm = phase === 0 ? -160 : -20;
  return sticker(64, 64, `<g transform="translate(0 14)">${limb(-4, -10, phase === 0 ? 40 : 150, 13, SKIN)}<rect x="-10" y="-14" width="20" height="20" rx="8" ${paint(SHIRT)}/>${head(true)}${limb(4, -10, arm, 14, SKIN)}${ripple(0, 2, 27)}</g>`);
}
