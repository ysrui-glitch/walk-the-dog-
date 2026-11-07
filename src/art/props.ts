import { INK, dot, line, paint, sticker } from './sticker';

const wheel = (x: number, y: number, r: number): string => `<circle cx="${x}" cy="${y}" r="${r}" ${paint('#3a3f4a')}/><circle cx="${x}" cy="${y}" r="${r * 0.4}" fill="#c9ced6"/>`;
const SKIN = '#ffd3ab';

// Rides, side on and facing right. The owner stands on top of the smaller ones; the car carries them inside.
export const RIDE_ART = {
  skate: sticker(56, 22, `<rect x="-24" y="-6" width="48" height="7" rx="3.5" ${paint('#3d8bfd')}/><path d="M-14,-3 l6,0 M4,-3 l8,0" ${line('#ffd84a', 2)}/>${wheel(-15, 4, 4)}${wheel(15, 4, 4)}`),
  scooter: sticker(56, 52, `<path d="M18,8 L14,-20" ${line(INK, 6)}/><path d="M18,8 L14,-20" ${line('#9aa3ad', 3)}/><path d="M8,-21 l14,0" ${line(INK, 5)}/><rect x="-22" y="2" width="38" height="6" rx="3" ${paint('#2fb67c')}/>${wheel(-17, 12, 5)}${wheel(17, 12, 5)}`),
  cycle: sticker(70, 48, `${wheel(-19, 8, 11)}${wheel(20, 8, 11)}<path d="M-19,8 L-4,-10 L14,-10 L20,8 M-4,-10 L2,8 L14,-10 M-19,8 L2,8" ${line(INK, 5)}/><path d="M-19,8 L-4,-10 L14,-10 L20,8 M-4,-10 L2,8 L14,-10 M-19,8 L2,8" ${line('#e8503a', 2.6)}/><rect x="-10" y="-16" width="11" height="4" rx="2" ${paint('#3a3f4a')}/><path d="M14,-10 L12,-19 l7,0" ${line(INK, 3)}/>`),
  moto: sticker(72, 46, `${wheel(-20, 9, 10)}${wheel(21, 9, 10)}<path d="M-26,0 Q-24,-12 -8,-12 L6,-12 L16,-2 L28,-2 Q30,6 22,6 L-22,6 Q-28,6 -26,0 Z" ${paint('#18a7a0')}/><rect x="-14" y="-17" width="18" height="6" rx="3" ${paint('#3a3f4a')}/><path d="M16,-2 L12,-20 l6,-2" ${line(INK, 3)}/>${dot(27, 1, 2.6, '#ffe58a')}`),
  car: sticker(92, 52, `${wheel(-25, 12, 9)}${wheel(26, 12, 9)}<path d="M-40,8 Q-42,-6 -28,-8 L-16,-22 Q-12,-26 -4,-26 L12,-26 Q20,-26 24,-20 L32,-8 Q42,-6 42,4 L42,10 L-40,10 Z" ${paint('#3d8bfd')}/><path d="M-12,-20 L-4,-21 L-4,-9 L-20,-9 Z M2,-21 L14,-21 Q18,-21 21,-16 L25,-9 L2,-9 Z" ${paint('#cfe9ff', 2)}/><circle cx="8" cy="-14" r="6" ${paint(SKIN, 1.8)}/><path d="M2,-15 A6,6 0 0 1 14,-15 Q8,-19 2,-15 Z" fill="#5a3a22"/>${dot(10, -14, 1)}${dot(39, -2, 2.6, '#ffe58a')}`),
  balloon: sticker(40, 60, `<path d="M0,10 Q-4,18 2,26" ${line(INK, 1.6)}/><ellipse cx="0" cy="-8" rx="15" ry="18" ${paint('#ff5c7a')}/><path d="M-3,10 L3,10 L0,6 Z" ${paint('#ff5c7a', 1.6)}/><ellipse cx="-6" cy="-16" rx="4" ry="6" fill="#fff" fill-opacity="0.55"/>`),
} as const;

// Things you pocket and throw.
export const TOSS_ART = {
  ball: sticker(30, 30, `<circle r="10" ${paint('#c8e63c')}/><path d="M-8,-5 Q0,1 8,-5 M-8,5 Q0,-1 8,5" ${line('#fff', 1.8)}/>`),
  bone: sticker(38, 24, `<path d="M-10,-3 L10,-3 A4.5,4.5 0 1 1 13,-8 A4.5,4.5 0 1 1 13,6 A4.5,4.5 0 1 1 10,3 L-10,3 A4.5,4.5 0 1 1 -13,6 A4.5,4.5 0 1 1 -13,-8 A4.5,4.5 0 1 1 -10,-3 Z" ${paint('#fff6e6')}/>`),
  frisbee: sticker(36, 24, `<ellipse cx="0" cy="0" rx="14" ry="6" ${paint('#ff5c7a')}/><ellipse cx="0" cy="-1" rx="7" ry="2.5" ${paint('#ff9db0', 1.6)}/>`),
  whistle: sticker(36, 30, `<path d="M-12,-4 L6,-11 L6,11 L-12,4 Z" ${paint('#ffcc33')}/><rect x="-16" y="-5" width="6" height="10" rx="2" ${paint('#3a3f4a')}/><path d="M10,-6 Q14,0 10,6 M13,-9 Q19,0 13,9" ${line(INK, 1.8)}/>`),
  hotdog: sticker(40, 26, `<rect x="-15" y="-5" width="30" height="11" rx="5.5" ${paint('#f2b562')}/><rect x="-17" y="-6" width="34" height="7" rx="3.5" ${paint('#d9534f')}/><path d="M-11,-3 l3,-2 l3,2 l3,-2 l3,2 l3,-2 l3,2 l3,-2" ${line('#ffd400', 1.6)}/>`),
} as const;

// Obstacles: anything that knocks the owner over sits on a ground shadow drawn by the entity view.
export const OBSTACLE_ART = {
  cone: sticker(40, 48, `<rect x="-15" y="12" width="30" height="6" rx="2" ${paint('#ff7a1a')}/><path d="M-10,12 L-3,-18 L3,-18 L10,12 Z" ${paint('#ff7a1a')}/><path d="M-7,1 L7,1 L5.6,-5 L-5.6,-5 Z" fill="#fff"/>`),
  trash: sticker(36, 48, `<path d="M-11,-10 L11,-10 L9,18 L-9,18 Z" ${paint('#7d8a96')}/><rect x="-14" y="-16" width="28" height="7" rx="3" ${paint('#5f6b77')}/><path d="M-4,-20 l8,0" ${line(INK, 3)}/><path d="M-4,-4 L-3,13 M4,-4 L3,13" ${line('#5f6b77', 2)}/>`),
  hydrant: sticker(36, 48, `<rect x="-9" y="-8" width="18" height="24" rx="3" ${paint('#e53935')}/><path d="M-10,-8 Q0,-22 10,-8 Z" ${paint('#e53935')}/><rect x="-14" y="-2" width="28" height="7" rx="3" ${paint('#c62828')}/><rect x="-12" y="14" width="24" height="5" rx="2" ${paint('#c62828')}/>`),
  tree: sticker(48, 56, `<rect x="-4" y="6" width="8" height="16" rx="2" ${paint('#8a5a33')}/><circle cx="-8" cy="-2" r="11" ${paint('#4caf50')}/><circle cx="8" cy="-2" r="11" ${paint('#4caf50')}/><circle cx="0" cy="-12" r="13" ${paint('#5cbf55')}/><circle cx="-4" cy="-14" r="3" fill="#8fdc7a"/>`),
  pine: sticker(42, 56, `<rect x="-3.5" y="12" width="7" height="10" ${paint('#8a5a33')}/><path d="M0,-24 L-15,2 L-8,2 L-17,14 L17,14 L8,2 L15,2 Z" ${paint('#2e8b57')}/>`),
  rock: sticker(46, 36, `<path d="M-18,10 Q-20,-4 -8,-10 Q2,-16 12,-8 Q20,-2 18,10 Z" ${paint('#9e9e9e')}/><path d="M-6,-4 Q0,-8 6,-4" ${line('#c7c7c7', 2)}/>`),
  castle: sticker(48, 50, `<rect x="-17" y="-2" width="34" height="20" ${paint('#e8c47c')}/><rect x="-19" y="-12" width="12" height="12" ${paint('#e8c47c')}/><rect x="7" y="-12" width="12" height="12" ${paint('#e8c47c')}/><rect x="-5" y="-16" width="10" height="16" ${paint('#e8c47c')}/><path d="M0,-16 L0,-24 L7,-21 L0,-19" ${paint('#ff5c7a', 1.8)}/><path d="M-4,18 L-4,8 Q0,4 4,8 L4,18" ${paint('#b98d4a', 2)}/>`),
} as const;

export const BARRIER_ART = {
  roadwork: sticker(70, 40, `<path d="M-24,4 L-24,16 M24,4 L24,16" ${line(INK, 4)}/><rect x="-30" y="-12" width="60" height="16" rx="3" ${paint('#ffffff')}/><path d="M-22,-12 L-30,0 M-8,-12 L-20,4 M6,-12 L-6,4 M20,-12 L8,4 M30,-6 L22,4" ${line('#ff7a1a', 5)}/><rect x="-30" y="-12" width="60" height="16" rx="3" ${line(INK)}/>`),
  log: sticker(70, 34, `<rect x="-28" y="-9" width="54" height="18" rx="9" ${paint('#a0693a')}/><ellipse cx="26" cy="0" rx="6" ry="9" ${paint('#e0b07a')}/><circle cx="26" cy="0" r="3" ${line('#a0693a', 1.6)}/><path d="M-18,-3 l14,0 M-12,4 l12,0" ${line('#7a4f2c', 2)}/>`),
  wave: sticker(70, 36, `<path d="M-30,12 Q-26,-8 -10,-10 Q4,-12 6,0 Q-4,-4 -6,4 Q8,10 30,4 L30,12 Z" ${paint('#4fc3f7')}/><path d="M-22,4 Q-14,-6 -4,-6" ${line('#fff', 2.4)}/>`),
} as const;

export const CROSSER_ART = {
  car: sticker(66, 40, `${wheel(-17, 10, 7)}${wheel(18, 10, 7)}<path d="M-28,8 Q-30,-4 -18,-6 L-10,-16 L12,-16 L20,-6 Q30,-4 30,6 L30,10 L-28,10 Z" ${paint('#e53935')}/><path d="M-7,-13 L1,-13 L1,-6 L-13,-6 Z M4,-13 L10,-13 L16,-6 L4,-6 Z" ${paint('#cfe9ff', 1.8)}/>${dot(28, 0, 2.2, '#ffe58a')}`),
  taxi: sticker(66, 44, `${wheel(-17, 12, 7)}${wheel(18, 12, 7)}<path d="M-28,10 Q-30,-2 -18,-4 L-10,-14 L12,-14 L20,-4 Q30,-2 30,8 L30,12 L-28,12 Z" ${paint('#ffcc33')}/><rect x="-5" y="-21" width="12" height="6" rx="2" ${paint('#ffffff', 1.8)}/><path d="M-7,-11 L1,-11 L1,-4 L-13,-4 Z M4,-11 L10,-11 L16,-4 L4,-4 Z" ${paint('#cfe9ff', 1.8)}/><path d="M-26,4 L28,4" ${line(INK, 1.4)}/>`),
  duck: sticker(46, 42, `<ellipse cx="-2" cy="4" rx="15" ry="10" ${paint('#ffd84a')}/><path d="M-16,0 L-22,-6 L-14,-2 Z" ${paint('#ffd84a', 2)}/><circle cx="10" cy="-8" r="8" ${paint('#ffd84a')}/><path d="M16,-8 L24,-6 L16,-4 Z" ${paint('#ff9800', 1.8)}/>${dot(12, -10, 1.6)}<path d="M-4,14 l0,5 M4,14 l0,5" ${line('#ff9800', 2.6)}/>`),
} as const;

export const PUDDLE_ART = {
  water: sticker(54, 28, `<path d="M-22,2 Q-24,-8 -10,-8 Q0,-12 12,-8 Q24,-6 22,4 Q20,10 6,9 Q-10,12 -22,2 Z" ${paint('#64b5f6', 2)}/><ellipse cx="-6" cy="-3" rx="6" ry="2" fill="#fff" fill-opacity="0.7"/>`),
  mud: sticker(54, 28, `<path d="M-22,2 Q-24,-8 -10,-8 Q0,-12 12,-8 Q24,-6 22,4 Q20,10 6,9 Q-10,12 -22,2 Z" ${paint('#8d6e4a', 2)}/><circle cx="-6" cy="-2" r="2.4" fill="#b08a62"/><circle cx="8" cy="2" r="1.8" fill="#b08a62"/>`),
  pee: sticker(48, 24, `<path d="M-18,2 Q-20,-6 -8,-7 Q2,-10 12,-6 Q20,-4 18,3 Q16,8 4,7 Q-8,10 -18,2 Z" ${paint('#ffe066', 2)}/><ellipse cx="-4" cy="-2" rx="5" ry="1.6" fill="#fff" fill-opacity="0.7"/>`),
  foam: sticker(54, 28, `<circle cx="-12" cy="2" r="7" ${paint('#e3f6ff', 2)}/><circle cx="0" cy="-2" r="8" ${paint('#e3f6ff', 2)}/><circle cx="12" cy="3" r="6" ${paint('#e3f6ff', 2)}/>`),
} as const;

export const POOP_ART = sticker(36, 34, `<ellipse cx="0" cy="8" rx="13" ry="5.5" ${paint('#8a5530')}/><ellipse cx="0" cy="1" rx="9.5" ry="5" ${paint('#8a5530')}/><path d="M-5,-4 Q0,-15 6,-6 Q4,-3 -5,-4 Z" ${paint('#8a5530')}/>${dot(-3.5, 1, 1.5, '#fff')}${dot(3.5, 1, 1.5, '#fff')}${dot(-3.5, 1, 0.8)}${dot(3.5, 1, 0.8)}`);

// Little icons over the dog's head and pieces that fly off a broken ride.
export const FX_ART = {
  dash: sticker(30, 24, `<path d="M-10,-6 l14,0 M-12,0 l18,0 M-8,6 l12,0" ${line(INK, 4)}/><path d="M-10,-6 l14,0 M-12,0 l18,0 M-8,6 l12,0" ${line('#e3f2fd', 2)}/>`),
  sniff: sticker(30, 26, `<path d="M-8,6 Q-12,0 -8,-4 Q-4,-8 -8,-12 M0,6 Q-4,0 0,-4 Q4,-8 0,-12 M8,6 Q4,0 8,-4 Q12,-8 8,-12" ${line('#7cb342', 2.4)}/>`),
  drops: sticker(28, 28, `<path d="M-5,-10 Q-1,-2 -5,2 Q-9,-2 -5,-10 Z M5,-4 Q9,4 5,8 Q1,4 5,-4 Z" ${paint('#64b5f6', 1.8)}/>`),
  alert: sticker(22, 30, `<rect x="-3.5" y="-12" width="7" height="15" rx="3" ${paint('#e53935', 1.8)}/><circle cx="0" cy="9" r="3.5" ${paint('#e53935', 1.8)}/>`),
  wheel: sticker(20, 20, wheel(0, 0, 6)),
  bolt: sticker(18, 18, `<path d="M-5,-5 L5,5 M-6,0 L0,-6" ${line('#9aa3ad', 3)}/>`),
  plank: sticker(26, 14, `<rect x="-10" y="-3" width="20" height="6" rx="2" ${paint('#3d8bfd', 1.8)}/>`),
  dust: sticker(22, 22, `<circle r="6" fill="#ffffff" fill-opacity="0.85"/>`, 0.1),
} as const;

// Roadside decor per biome; it never interacts with anything.
export const DECOR_ART = {
  building: sticker(30, 44, `<rect x="-11" y="-18" width="22" height="36" rx="2" ${paint('#90a4ae')}/><path d="M-6,-12 h4 M2,-12 h4 M-6,-4 h4 M2,-4 h4 M-6,4 h4 M2,4 h4" ${line('#fff59d', 3)}/>`),
  house: sticker(32, 36, `<rect x="-10" y="-2" width="20" height="16" ${paint('#ffcc80')}/><path d="M-13,-1 L0,-13 L13,-1 Z" ${paint('#e57373')}/><rect x="-3" y="5" width="6" height="9" ${paint('#8d6e63', 1.6)}/>`),
  lamp: sticker(22, 44, `<path d="M0,18 L0,-12 Q0,-16 5,-16" ${line(INK, 4)}/><path d="M0,18 L0,-12 Q0,-16 5,-16" ${line('#5f6b77', 2)}/><circle cx="6" cy="-14" r="4" ${paint('#fff59d', 1.8)}/>`),
  tree: sticker(30, 36, `<rect x="-2.5" y="4" width="5" height="10" ${paint('#8a5a33', 1.8)}/><circle cx="0" cy="-4" r="10" ${paint('#5cbf55')}/>`),
  flower: sticker(26, 26, `<circle cx="0" cy="-5" r="4" ${paint('#ff8fb1', 1.6)}/><circle cx="5" cy="0" r="4" ${paint('#ff8fb1', 1.6)}/><circle cx="0" cy="5" r="4" ${paint('#ff8fb1', 1.6)}/><circle cx="-5" cy="0" r="4" ${paint('#ff8fb1', 1.6)}/><circle r="3" ${paint('#ffd84a', 1.4)}/>`),
  mushroom: sticker(26, 26, `<rect x="-3" y="0" width="6" height="8" rx="2" ${paint('#fff6e6', 1.8)}/><path d="M-10,1 Q-10,-10 0,-10 Q10,-10 10,1 Z" ${paint('#e53935', 1.8)}/>${dot(-4, -5, 1.8, '#fff')}${dot(4, -4, 1.4, '#fff')}`),
  butterfly: sticker(26, 22, `<ellipse cx="-5" cy="-2" rx="5" ry="6" ${paint('#64b5f6', 1.6)}/><ellipse cx="5" cy="-2" rx="5" ry="6" ${paint('#64b5f6', 1.6)}/><path d="M0,-6 L0,6" ${line(INK, 2)}/>`),
  palm: sticker(40, 52, `<path d="M0,22 Q-3,6 2,-10" ${line(INK, 6)}/><path d="M0,22 Q-3,6 2,-10" ${line('#a0693a', 3.4)}/><path d="M2,-10 Q-12,-18 -18,-6 Q-8,-12 2,-10 Q14,-20 18,-6 Q8,-12 2,-10 Q2,-24 -6,-22 Q2,-18 2,-10" ${paint('#43a047', 2)}/>`),
  shell: sticker(26, 24, `<path d="M-10,6 Q-10,-8 0,-9 Q10,-8 10,6 Z" ${paint('#ffccbc', 1.8)}/><path d="M0,6 L0,-8 M-5,6 L-3,-7 M5,6 L3,-7" ${line('#e9a08d', 1.4)}/>`),
  boat: sticker(32, 34, `<path d="M-12,6 L12,6 L8,12 L-8,12 Z" ${paint('#8d6e63', 1.8)}/><path d="M0,4 L0,-14 L10,2 Z" ${paint('#ffffff', 1.8)}/><path d="M-2,2 L-2,-10 L-10,2 Z" ${paint('#ff8a65', 1.8)}/>`),
  starfish: sticker(26, 26, `<path d="M0,-10 L3,-3 L10,-2 L4,3 L6,10 L0,6 L-6,10 L-4,3 L-10,-2 L-3,-3 Z" ${paint('#ff8a65', 1.8)}/>`),
} as const;
