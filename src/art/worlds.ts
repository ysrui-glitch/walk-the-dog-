import { INK, dot, line, paint, sticker, type Art } from './sticker';

const BLOB = 'M-22,2 Q-24,-8 -10,-8 Q0,-12 12,-8 Q24,-6 22,4 Q20,10 6,9 Q-10,12 -22,2 Z';
const tube = (d: string, color: string, width: number): string => `<path d="${d}" ${line(INK, width + 2.8)}/><path d="${d}" ${line(color, width)}/>`;
const leg = (x: number, y: number, angle: number, fill: string, length = 12): string =>
  `<rect x="-3" y="-1" width="6" height="${length}" rx="3" transform="translate(${x} ${y}) rotate(${angle})" ${paint(fill, 2)}/>`;
const eye = (x: number, y: number, r = 2): string => `${dot(x, y, r)}${dot(x + r * 0.35, y - r * 0.4, r * 0.35, '#fff')}`;
const frond = (angle: number, length: number, fill: string): string =>
  `<g transform="rotate(${angle} 0 16)"><path d="M0,16 Q-7,${16 - length / 2} 0,${16 - length} Q7,${16 - length / 2} 0,16 Z" ${paint(fill)}/><path d="M0,13 L0,${19 - length}" ${line('#2e7d32', 1.6)}/></g>`;

function gull(phase: number): Art {
  const wing = phase === 0 ? 'M-8,-3 Q-6,-18 7,-15 Q4,-8 4,-3 Z' : 'M-8,0 Q-4,13 9,10 Q4,4 4,0 Z';
  return sticker(56, 44, `
  <path d="M-14,0 L-22,-5 L-21,5 Z" ${paint('#9aa3ad', 2)}/>
  <path d="M-6,9 l-6,3 M-1,9 l-6,3" ${line('#ff9800', 2.4)}/>
  <ellipse cx="-2" cy="2" rx="14" ry="8" ${paint('#ffffff')}/>
  <circle cx="11" cy="-6" r="7" ${paint('#ffffff')}/>
  <path d="M17,-8 L24,-5 L17,-3 Z" ${paint('#ffc107', 1.8)}/>
  ${eye(13, -8, 1.7)}
  <path d="${wing}" ${paint('#b0bec5')}/>`);
}

function rabbit(phase: number): Art {
  const fur = '#f7f7f7';
  const lift = phase === 0 ? 0 : 3;
  const [hind, front] = phase === 0 ? [60, -45] : [10, 10];
  return sticker(54, 50, `<g transform="translate(0 ${lift})">
  <ellipse cx="2" cy="-12" rx="3" ry="7" transform="rotate(-38 4 -6)" ${paint(fur)}/>
  ${leg(-8, 6, hind, fur, 10)}
  <circle cx="-16" cy="0" r="4.5" ${paint('#ffffff')}/>
  <ellipse cx="-3" cy="3" rx="13" ry="8.5" ${paint(fur)}/>
  ${leg(8, 7, front, fur, 9)}
  <circle cx="10" cy="-4" r="7.5" ${paint(fur)}/>
  <ellipse cx="7" cy="-13" rx="3.2" ry="8" transform="rotate(-20 8 -7)" ${paint(fur)}/>
  <ellipse cx="7" cy="-13" rx="1.4" ry="5" transform="rotate(-20 8 -7)" fill="#f8bbd0"/>
  ${eye(12, -6, 1.7)}${dot(17, -3, 1.4, '#f48fb1')}</g>`);
}

function lizard(phase: number): Art {
  const green = '#7cc142';
  const dark = '#5a9e2f';
  const swing = phase === 0 ? 40 : -40;
  return sticker(56, 40, `
  ${tube('M-8,1 Q-20,3 -22,-6', green, 3.2)}
  ${leg(-6, 3, swing, dark, 9)}${leg(8, 3, -swing, dark, 9)}
  <ellipse cx="0" cy="0" rx="12" ry="5.5" ${paint(green)}/>
  ${leg(-3, 4, -swing, green, 9)}${leg(10, 3, swing, green, 9)}
  <ellipse cx="15" cy="-3" rx="7" ry="4.6" ${paint(green)}/>
  ${eye(16, -5, 1.5)}${dot(-4, -2, 1.4, '#ffd84a')}${dot(2, -3, 1.4, '#ffd84a')}${dot(-9, 0, 1.1, '#ffd84a')}
  <path d="M17,-1 Q19,0 21,-1.5" ${line(INK, 1.3)}/>`);
}

function raptor(phase: number): Art {
  const skin = '#4db6ac';
  const dark = '#2f8f86';
  const swing = phase === 0 ? 32 : -32;
  return sticker(56, 46, `
  <path d="M-6,-3 Q-16,-7 -23,-9 Q-16,2 -4,4 Z" ${paint(skin)}/>
  ${leg(-2, 4, -swing, dark, 12)}
  <ellipse cx="0" cy="0" rx="10" ry="7.5" transform="rotate(-20)" ${paint(skin)}/>
  ${leg(2, 5, swing, skin, 12)}
  ${tube('M7,-2 L11,1', skin, 2)}
  <path d="M5,-12 Q5,-19 12,-19 Q17,-19 19,-14 L22,-12 Q23,-8 19,-7 L10,-7 Q5,-7 5,-12 Z" ${paint(skin)}/>
  <path d="M-5,-6 l2,4 M-1,-7 l2,4" ${line(dark, 1.8)}/>
  ${eye(13, -14, 2)}
  <path d="M15,-9.5 Q18,-8.5 20,-10" ${line(INK, 1.3)}/>`);
}

function alien(phase: number): Art {
  const green = '#8bdc5a';
  const dark = '#5fae3a';
  const swing = phase === 0 ? 30 : -30;
  return sticker(50, 48, `<g transform="translate(0 1)">
  <path d="M2,-14 Q1,-19 -3,-20" ${line(INK, 1.8)}/><circle cx="-3" cy="-20" r="2.4" ${paint('#ffd84a', 1.4)}/>
  ${leg(-3, 6, -swing, dark, 10)}
  <ellipse cx="0" cy="4" rx="7" ry="7.5" ${paint(green)}/>
  ${leg(2, 7, swing, green, 10)}
  ${tube(phase === 0 ? 'M3,2 L9,6' : 'M3,2 L8,-2', green, 2.6)}
  <ellipse cx="3" cy="-7" rx="11" ry="8.5" ${paint(green)}/>
  <ellipse cx="8" cy="-8" rx="3.6" ry="4" ${paint('#ffffff', 1.6)}/>${dot(9.5, -8, 1.8)}
  <path d="M8,-2 Q10,-1 12,-3" ${line(INK, 1.4)}/></g>`);
}


export const WORLD_ART: Readonly<Record<string, Art>> = {
  // Sea: a wooden boardwalk over the ocean.
  'ob-buoy': sticker(40, 50, `<ellipse cx="0" cy="14" rx="16" ry="5" ${paint('#4fc3f7', 2)}/><path d="M-6,-7 L-4,-14 L4,-14 L6,-7" ${paint('#9aa3ad', 2)}/><circle cx="0" cy="-16" r="3.5" ${paint('#ffe066', 1.8)}/><path d="M-12,14 L-8,-7 L8,-7 L12,14 Z" ${paint('#e53935')}/><path d="M-10.9,8 L10.9,8 L9.7,2 L-9.7,2 Z" fill="#fff"/><path d="M-12,14 L-8,-7 L8,-7 L12,14 Z" ${line(INK)}/>`),
  'ob-barrel': sticker(40, 48, `<path d="M-11,-18 Q-17,0 -11,18 L11,18 Q17,0 11,-18 Z" ${paint('#b0773f')}/><path d="M-4,-17 Q-6,0 -4,17 M4,-17 Q6,0 4,17" ${line('#8a5a33', 1.8)}/><path d="M-13.2,-9 L13.2,-9 M-13.2,9 L13.2,9" ${line('#5f6b77', 3)}/><ellipse cx="0" cy="-18" rx="11" ry="3" ${paint('#d9a36a', 2)}/>`),
  'ob-crate': sticker(44, 44, `<rect x="-16" y="-16" width="32" height="32" rx="2" ${paint('#d9a35b')}/><rect x="-11" y="-11" width="22" height="22" ${line('#a8743a', 2)}/><path d="M-10,10 L10,-10" ${line('#a8743a', 3.4)}/>${dot(-13, -13, 1.2)}${dot(13, -13, 1.2)}${dot(-13, 13, 1.2)}${dot(13, 13, 1.2)}`),
  'cross-shark': sticker(72, 50, `<path d="M-16,17 Q-10,11 -4,17 M6,17 Q12,11 18,17" ${line('#4fc3f7', 2.6)}/><path d="M-20,4 L-29,-8 L-24,5 L-29,14 Z" ${paint('#6c8fb3')}/><path d="M-2,-9 L3,-19 L10,-8 Z" ${paint('#6c8fb3')}/><path d="M-22,4 Q-8,-12 14,-8 Q26,-5 29,3 Q18,11 -2,10 Q-14,10 -22,4 Z" ${paint('#6c8fb3')}/><path d="M-4,8 Q10,4 26,5 Q18,10 -2,10 Z" fill="#eef4fa"/><path d="M2,8 L-4,15 L9,9 Z" ${paint('#56789c', 2)}/>${eye(16, -3, 2)}<path d="M18,3 Q23,7 28,3 Z" ${paint('#ffffff', 1.6)}/>`),
  'pud-seaweed': sticker(54, 28, `<path d="${BLOB}" ${paint('#3d9a4b', 2)}/><path d="M-16,2 Q-12,-4 -8,2 Q-4,8 0,2 Q4,-4 8,2 Q12,7 16,2" ${line('#7ccf6a', 2.2)}/><path d="M-10,-4 Q-6,-8 -2,-4 M6,-5 Q10,-8 13,-4" ${line('#2e7d32', 2)}/>`),
  'gull-0': gull(0),
  'gull-1': gull(1),
  'dec-fish': sticker(30, 24, `<path d="M-5,0 L-12,-6 L-12,6 Z" ${paint('#ff9800', 1.8)}/><ellipse cx="2" cy="0" rx="9" ry="6.5" ${paint('#ffa726', 1.8)}/><path d="M-1,-5 Q2,0 -1,5" ${line('#e65100', 1.4)}/>${eye(6, -1.5, 1.5)}`),
  'dec-jellyfish': sticker(28, 34, `${tube('M-6,0 Q-8,5 -5,9 Q-3,12 -6,14 M0,0 Q-2,6 1,10 Q3,13 0,15 M6,0 Q4,5 7,9 Q9,12 6,14', '#ce93d8', 1.6)}<path d="M-10,1 Q-10,-12 0,-12 Q10,-12 10,1 Q5,-1 0,1 Q-5,-1 -10,1 Z" ${paint('#f48fb1', 1.8)}/>${dot(-3, -5, 1.3)}${dot(3, -5, 1.3)}<ellipse cx="-4" cy="-9" rx="2.4" ry="1.4" fill="#fff" fill-opacity="0.7"/>`),
  'dec-whale': sticker(40, 32, `<path d="M3,-8 Q2,-12 -1,-13 M3,-8 Q4,-12 7,-13" ${line('#4fc3f7', 2.2)}/><path d="M-9,2 Q-14,-2 -15,-8 Q-11,-6 -10,-3 Q-9,-8 -5,-9 Q-6,-3 -7,1 Z" ${paint('#5c8ee6', 1.8)}/><path d="M-11,3 Q-9,-7 4,-7 Q15,-7 15,3 Q15,9 6,9 L-6,9 Q-11,9 -11,3 Z" ${paint('#5c8ee6', 1.8)}/><path d="M-6,8 Q4,4 14,5 Q12,9 6,9 L-6,9 Z" fill="#b8d4ff"/>${eye(9, -1, 1.4)}<path d="M10,3 Q12,4 14,2.5" ${line(INK, 1.2)}/>`),
  'dec-coral': sticker(30, 34, `${tube('M0,12 L0,2 M0,5 Q-7,4 -7,-5 M-7,-1 Q-10,-3 -10,-7 M0,2 Q6,-1 6,-9 M6,-4 Q9,-4 9,-8 M0,2 L1,-11', '#ff7f7f', 3.4)}<ellipse cx="0" cy="12" rx="8" ry="3" ${paint('#b0a7a0', 1.8)}/>`),

  // Snow.
  'ob-snowman': sticker(40, 56, `<path d="M-10,8 L-17,2 M10,8 L17,2" ${line('#6d4c2f', 2.4)}/><circle cx="0" cy="11" r="11" ${paint('#ffffff')}/><circle cx="0" cy="-6" r="8.5" ${paint('#ffffff')}/><path d="M3,2 L6,12 L10,10 L6,2 Z" ${paint('#e53935', 1.8)}/><path d="M-8,1 Q0,4 8,1 L8,4 Q0,7 -8,4 Z" ${paint('#e53935', 1.8)}/><rect x="-5.5" y="-23" width="11" height="9" rx="1.5" ${paint('#2f3540', 2)}/><rect x="-8.5" y="-16" width="17" height="3" rx="1.5" ${paint('#2f3540', 2)}/><path d="M1,-5.5 L10,-4 L1,-2.5 Z" ${paint('#ff9800', 1.6)}/>${dot(-3, -8, 1.5)}${dot(3, -8.5, 1.5)}${dot(0, 10, 1.6)}${dot(0, 16, 1.6)}`),
  'ob-snowpine': sticker(42, 56, `<rect x="-3.5" y="12" width="7" height="9" ${paint('#8a5a33')}/><path d="M0,-24 L-15,2 L-8,2 L-17,14 L17,14 L8,2 L15,2 Z" ${paint('#2e8b57')}/><path d="M0,-24 L-5.8,-14 Q-3,-11 0,-13 Q3,-11 5.8,-14 Z" ${paint('#ffffff', 1.8)}/><path d="M-15,2 L-8,2 Q-9,5 -11,4 Q-13,6 -15,2 Z M15,2 L8,2 Q9,5 11,4 Q13,6 15,2 Z M-17,14 L-9,14 Q-11,17 -13,16 Q-15,18 -17,14 Z M17,14 L9,14 Q11,17 13,16 Q15,18 17,14 Z" ${paint('#ffffff', 1.6)}/><ellipse cx="0" cy="21" rx="13" ry="3" ${paint('#ffffff', 1.8)}/>`),
  'ob-iceblock': sticker(44, 44, `<rect x="-16" y="-8" width="26" height="25" rx="1.5" ${paint('#b3e5fc')}/><path d="M-16,-8 L-10,-15 L16,-15 L10,-8 Z" ${paint('#e1f5fe')}/><path d="M10,-8 L16,-15 L16,10 L10,17 Z" ${paint('#81d4fa')}/><path d="M-12,-4 L-12,8 M-8,-4 L-8,0" ${line('#ffffff', 2.4)}/>`),
  'cross-penguin': sticker(64, 40, `${tube('M-27,-4 l6,0 M-26,5 l7,0', '#e1f5fe', 2)}<path d="M-19,3 L-25,-1 L-24,6 Z" ${paint('#ff9800', 1.6)}/><ellipse cx="-2" cy="2" rx="19" ry="9" ${paint('#2f3540')}/><ellipse cx="0" cy="6" rx="14" ry="4" fill="#ffffff"/><circle cx="16" cy="-3" r="8" ${paint('#2f3540')}/><circle cx="18" cy="-2" r="4.5" fill="#ffffff"/>${eye(19, -4, 1.5)}<path d="M22,-2 L28,0 L22,2 Z" ${paint('#ff9800', 1.6)}/><path d="M-2,-2 Q-12,-9 -16,-5 Q-10,0 -2,2 Z" ${paint('#2f3540', 2)}/>`),
  'bar-snowdrift': sticker(70, 36, `<path d="M-30,12 Q-28,-2 -16,-4 Q-10,-12 2,-9 Q10,-14 20,-6 Q30,-2 30,12 Z" ${paint('#f4fbff')}/><path d="M-18,4 Q-10,0 -4,4 M6,0 Q14,-4 20,2" ${line('#bcdcf0', 2.4)}/>${dot(-4, -6, 1.6, '#bcdcf0')}${dot(12, 6, 1.4, '#bcdcf0')}`),
  'pud-ice': sticker(54, 28, `<path d="${BLOB}" ${paint('#b3e5fc', 2)}/><path d="M-13,1 L-5,-5 M-7,4 L3,-4" ${line('#ffffff', 2.4)}/><path d="M12,-4 l0,6 M9,-1 l6,0" ${line('#ffffff', 1.6)}/>`),
  'rabbit-0': rabbit(0),
  'rabbit-1': rabbit(1),
  'dec-igloo': sticker(36, 30, `<path d="M-15,8 A15,15 0 0 1 15,8 Z" ${paint('#f4fbff')}/><path d="M-13,1 L13,1 M-9,-4 L9,-4 M-5,-4 L-5,1 M6,-7 L6,-4 M8,1 L8,8 M-10,1 L-10,8" ${line('#bcdcf0', 1.6)}/><path d="M-4.5,8 L-4.5,3 Q0,-2 4.5,3 L4.5,8 Z" ${paint('#5f6b77', 1.8)}/>`),
  'dec-mitten': sticker(26, 30, `<path d="M-6,1 Q-11,0 -11,-4 Q-10,-8 -6,-5" ${paint('#e53935', 1.8)}/><path d="M-6,6 L-7,-4 Q-7,-11 0,-11 Q7,-11 7,-3 L7,6 Z" ${paint('#e53935', 1.8)}/><path d="M-4,-2 L4,-2" ${line('#ffffff', 2)}/><rect x="-8" y="5" width="16" height="6" rx="2" ${paint('#ffffff', 1.8)}/>`),
  'dec-snowball': sticker(24, 24, `<circle r="8" ${paint('#f4fbff', 1.8)}/><path d="M-5,3 Q0,7 5,3" ${line('#bcdcf0', 2)}/>`),

  // Desert.
  'ob-cactus': sticker(40, 56, `<ellipse cx="0" cy="19" rx="12" ry="3.5" ${paint('#e8c47c', 2)}/>${tube('M-5,4 L-10,4 Q-12,4 -12,2 L-12,-8', '#4caf50', 6)}${tube('M5,-2 L10,-2 Q12,-2 12,-4 L12,-12', '#4caf50', 6)}<rect x="-6" y="-20" width="12" height="39" rx="6" ${paint('#4caf50')}/><path d="M-2,-13 L-2,14 M2.5,-13 L2.5,14" ${line('#3b8f3f', 1.6)}/><circle cx="0" cy="-21" r="3" ${paint('#ff8fb1', 1.6)}/>`),
  'ob-skull': sticker(46, 36, `${tube('M-7,-6 Q-14,-7 -15,-13', '#f3e5c8', 3.5)}${tube('M7,-6 Q14,-7 15,-13', '#f3e5c8', 3.5)}<path d="M-9,-8 Q0,-12 9,-8 Q10,0 6,4 L5,10 Q0,13 -5,10 L-6,4 Q-10,0 -9,-8 Z" ${paint('#fff6e6')}/><ellipse cx="-4" cy="-2" rx="2.6" ry="3" fill="${INK}"/><ellipse cx="4" cy="-2" rx="2.6" ry="3" fill="${INK}"/>${dot(-1.8, 7.5, 1.1)}${dot(1.8, 7.5, 1.1)}<path d="M2,-10 L3,-7 L1,-5" ${line(INK, 1.2)}/>`),
  'ob-boulder': sticker(48, 40, `<path d="M-19,12 Q-21,-2 -12,-10 Q-2,-17 10,-12 Q20,-6 19,6 Q18,13 10,13 L-14,13 Q-19,13 -19,12 Z" ${paint('#c98b55')}/><path d="M-10,-6 Q-4,-11 4,-9" ${line('#e8b07e', 2.4)}/><path d="M6,2 L10,-2 L14,3" ${line('#9c6436', 1.8)}/>`),
  'cross-tumbleweed': sticker(52, 48, `${tube('M-21,-6 l5,0 M-22,2 l5,0 M-20,10 l5,0', '#fff6e6', 2)}<circle cx="3" cy="0" r="15" ${paint('#d8b878')}/><path d="M-8,-6 Q2,-14 12,-4 Q14,8 2,10 Q-8,8 -6,-2 Q0,-8 8,-2 Q8,6 0,4" ${line('#8d6e3f', 1.8)}/><path d="M-6,8 Q4,-2 14,6 M-8,0 Q0,12 10,-10" ${line('#a88552', 1.6)}/>`),
  'bar-dune': sticker(70, 34, `<path d="M-30,12 Q-20,-10 0,-10 Q18,-10 30,12 Z" ${paint('#f0c674')}/><path d="M-18,4 Q-8,-2 2,2 M-6,9 Q6,3 18,7 M8,-4 Q14,-6 18,-2" ${line('#d4a24c', 2)}/>`),
  'pud-quicksand': sticker(54, 28, `<path d="${BLOB}" ${paint('#c79a5b', 2)}/><path d="M0,0 Q4,-3 7,0 Q8,5 0,5 Q-9,4 -9,-1 Q-8,-7 2,-7 Q13,-6 14,1" ${line('#9c7442', 2)}/>`),
  'lizard-0': lizard(0),
  'lizard-1': lizard(1),
  'dec-pyramid': sticker(40, 32, `<path d="M-15,10 L0,-11 L15,10 Z" ${paint('#f0c674')}/><path d="M0,-11 L15,10 L4,10 Z" ${paint('#d9a84e', 2)}/><path d="M-7.5,0 L2,0 M-11,5 L3,5" ${line('#c99a44', 1.4)}/>`),
  'dec-camel': sticker(42, 34, `<g transform="translate(-2 0)">${tube('M-8,3 L-8,11 M-4,3 L-4,11 M5,3 L5,11 M9,3 L9,11', '#d9a35b', 1.8)}<path d="M-12,0 l-2,5" ${line(INK, 1.8)}/><path d="M-12,4 Q-13,-4 -6,-4 Q-3,-11 1,-4 Q4,-9 8,-3 Q12,-2 11,4 Z" ${paint('#d9a35b', 2)}/><path d="M9,-1 Q14,-3 13,-9 L17,-9 Q19,-8 18,-6 L15,-6 Q16,0 11,3 Z" ${paint('#d9a35b', 2)}/>${dot(15, -7.6, 1)}</g>`),
  'dec-oasis': sticker(40, 36, `<ellipse cx="2" cy="8" rx="13" ry="4.5" ${paint('#4fc3f7', 1.8)}/>${tube('M-6,8 Q-8,0 -4,-6', '#a0693a', 2.2)}<g transform="translate(-4 -6) scale(0.55) translate(-2 10)"><path d="M2,-10 Q-12,-18 -18,-6 Q-8,-12 2,-10 Q14,-20 18,-6 Q8,-12 2,-10 Q2,-24 -6,-22 Q2,-18 2,-10" ${paint('#43a047', 3.4)}/></g><ellipse cx="6" cy="7" rx="4" ry="1.2" fill="#fff" fill-opacity="0.7"/>`),

  // Prehistoric.
  'ob-fern': sticker(44, 50, `${frond(-42, 26, '#3b8f3f')}${frond(42, 26, '#3b8f3f')}${frond(-18, 32, '#4caf50')}${frond(18, 32, '#4caf50')}${frond(0, 36, '#5cbf55')}`),
  'ob-volcanorock': sticker(46, 40, `<path d="M-18,12 Q-20,-2 -10,-10 Q0,-16 10,-10 Q19,-4 18,12 Z" ${paint('#5d4a44')}/>${tube('M-6,-8 L-2,-2 L-6,4 M4,-10 L6,-2 L12,2', '#ff7a1a', 2)}${dot(-11, -2, 1.6, '#8a756e')}`),
  'cross-trex': sticker(74, 60, `<path d="M-6,-4 Q-20,-6 -31,6 Q-18,6 -4,6 Z" ${paint('#6cc04a')}/><rect x="-11" y="2" width="9" height="16" rx="4" ${paint('#4f9a36')}/><ellipse cx="-5" cy="19" rx="6" ry="3" ${paint('#4f9a36', 2)}/><ellipse cx="0" cy="-1" rx="14" ry="12" ${paint('#6cc04a')}/><ellipse cx="4" cy="3" rx="8" ry="7" fill="#d7f0a8"/><g transform="rotate(-28 6 4)"><rect x="2" y="2" width="9" height="15" rx="4" ${paint('#6cc04a')}/><ellipse cx="8" cy="17" rx="6" ry="3" ${paint('#6cc04a', 2)}/></g>${tube('M12,-4 L16,-1', '#6cc04a', 2.4)}<path d="M4,-12 Q4,-24 18,-24 Q30,-24 30,-15 Q30,-8 20,-8 L10,-8 Q4,-6 4,-12 Z" ${paint('#6cc04a')}/><path d="M16,-12 Q22,-9 28,-13" ${line(INK, 1.8)}/>${eye(17, -18, 2.2)}${dot(27, -19, 1)}${dot(-6, -6, 2, '#4f9a36')}${dot(-1, -9, 1.6, '#4f9a36')}${dot(-10, -1, 1.6, '#4f9a36')}`),
  'bar-fallentrunk': sticker(70, 36, `<rect x="-29" y="-10" width="54" height="20" rx="8" ${paint('#7a5230')}/><ellipse cx="25" cy="0" rx="6" ry="10" ${paint('#c9925a')}/><ellipse cx="25" cy="0" rx="3" ry="5" ${line('#7a5230', 1.6)}/><path d="M-20,-3 l14,0 M-14,4 l12,0 M4,-4 l10,0" ${line('#5c3d22', 2)}/><path d="M-24,-10 Q-20,-15 -14,-11 Q-10,-15 -4,-10 Z" ${paint('#6cc04a', 2)}/>`),
  'pud-tar': sticker(54, 28, `<path d="${BLOB}" ${paint('#2a2430', 2)}/><ellipse cx="-8" cy="-2" rx="5" ry="1.6" fill="#8a7f99" fill-opacity="0.6"/><circle cx="7" cy="-2" r="4" ${paint('#3d3546', 1.6)}/>${dot(5.6, -3.4, 1.1, '#c9c0d6')}`),
  'raptor-0': raptor(0),
  'raptor-1': raptor(1),
  'dec-volcano': sticker(40, 40, `<circle cx="-2" cy="-11" r="4" ${paint('#cfd8dc', 1.6)}/><circle cx="3" cy="-14" r="4.5" ${paint('#cfd8dc', 1.6)}/><path d="M-15,14 L-5,-6 L5,-6 L15,14 Z" ${paint('#8d6e63')}/><path d="M-5,-6 L5,-6 L6.5,-3 Q3,1 1,-2 Q-2,3 -3,-2 L-6.5,-3 Z" ${paint('#ff7a1a', 1.8)}/>`),
  'dec-egg': sticker(24, 30, `<ellipse cx="0" cy="1" rx="8" ry="11" ${paint('#fff6e6', 1.8)}/>${dot(-3, -3, 2, '#8bc34a')}${dot(3, 3, 2.4, '#8bc34a')}${dot(-2, 6.5, 1.5, '#8bc34a')}${dot(3.5, -6, 1.3, '#8bc34a')}`),
  'dec-pterodactyl': sticker(40, 34, `<path d="M-1,0 Q-6,-9 -14,-10 Q-8,-3 -3,3 Z" ${paint('#8e63c4', 1.8)}/><ellipse cx="0" cy="2" rx="7" ry="3.5" ${paint('#ab7ad6', 1.8)}/><path d="M4,0 L4,-5 L9,-4 L16,0 L9,1 Z" ${paint('#ab7ad6', 1.8)}/><path d="M5,-4 L0,-8 L7,-4.5" ${paint('#ab7ad6', 1.6)}/><path d="M1,1 Q-2,-10 -12,-12 Q-6,-2 -2,4 Z" ${paint('#c49ae8', 1.8)}/>${dot(7, -2.4, 0.9)}`),
  'dec-ammonite': sticker(28, 28, `<circle r="10" ${paint('#e0a96d', 1.8)}/><path d="M0,0 Q2,-3 4,0 Q4,5 -1,5 Q-7,4 -7,-1 Q-6,-8 1,-8 Q9,-7 9,1" ${line('#a86b3c', 1.6)}/>`),

  // Space: a metal walkway among the stars.
  'ob-asteroid': sticker(46, 42, `<path d="M-17,4 Q-19,-8 -8,-13 Q4,-18 13,-9 Q20,-2 16,8 Q10,16 -2,14 Q-14,14 -17,4 Z" ${paint('#8d84a6')}/><circle cx="-6" cy="-4" r="4" ${paint('#6f6688', 1.8)}/><circle cx="7" cy="4" r="3" ${paint('#6f6688', 1.8)}/><circle cx="6" cy="-8" r="2" ${paint('#6f6688', 1.6)}/>`),
  'ob-satellite': sticker(52, 42, `<path d="M-14,0 L14,0" ${line(INK, 3)}/><rect x="-21" y="-7" width="12" height="14" rx="1.5" ${paint('#3d8bfd', 2)}/><rect x="9" y="-7" width="12" height="14" rx="1.5" ${paint('#3d8bfd', 2)}/><path d="M-15,-6 L-15,6 M-20,0 L-10,0 M15,-6 L15,6 M10,0 L20,0" ${line('#9fd0ff', 1.4)}/><rect x="-6" y="-9" width="12" height="18" rx="2" ${paint('#ffcc33')}/><path d="M0,-11 L2,-16" ${line(INK, 1.8)}/>${dot(2, -16, 1.8, '#ff5c7a')}<path d="M-6,-14 Q0,-8 6,-14 Z" ${paint('#e0e0e0', 1.8)}/>`),
  'ob-crystal': sticker(40, 50, `<ellipse cx="0" cy="17" rx="15" ry="4" ${paint('#7d8a96', 2)}/><path d="M-12,16 L-14,2 L-9,-6 L-5,2 L-5,16 Z" ${paint('#4dd0e1')}/><path d="M4,16 L6,0 L11,-8 L14,0 L12,16 Z" ${paint('#80deea')}/><path d="M-5,16 L-6,-8 L0,-19 L6,-8 L5,16 Z" ${paint('#b388ff')}/><path d="M0,-17 L0,14 M-3,-8 L-3,4" ${line('#e1d5ff', 1.6)}/>`),
  'cross-ufo': sticker(66, 50, `<path d="M-8,4 L-18,20 L18,20 L8,4 Z" fill="#fff59d" fill-opacity="0.75"/><path d="M-10,-4 Q-10,-17 0,-17 Q10,-17 10,-4 Z" ${paint('#b3e5fc')}/><circle cx="2" cy="-8" r="4.5" ${paint('#8bdc5a', 1.6)}/>${dot(4, -9, 1.2)}<path d="M-10,-4 Q-10,-17 0,-17 Q10,-17 10,-4" ${line(INK)}/><ellipse cx="0" cy="0" rx="27" ry="7" ${paint('#9aa3ad')}/>${dot(-16, 1, 2.2, '#ffd84a')}${dot(-6, 3, 2.2, '#ff5c7a')}${dot(6, 3, 2.2, '#4fc3f7')}${dot(16, 1, 2.2, '#ffd84a')}`),
  'bar-laser': sticker(70, 38, `<path d="M-22,-2 L22,-2" stroke="#ff8a80" stroke-width="8" stroke-opacity="0.5" stroke-linecap="round"/><path d="M-22,-2 L22,-2" ${line('#ff1744', 3.2)}/><path d="M-22,-2 L22,-2" ${line('#ffffff', 1.2)}/><rect x="-30" y="-10" width="8" height="22" rx="2" ${paint('#9aa3ad')}/><rect x="22" y="-10" width="8" height="22" rx="2" ${paint('#9aa3ad')}/><circle cx="-26" cy="-2" r="3" ${paint('#ff1744', 1.6)}/><circle cx="26" cy="-2" r="3" ${paint('#ff1744', 1.6)}/><rect x="-31" y="11" width="10" height="4" rx="1.5" ${paint('#5f6b77', 2)}/><rect x="21" y="11" width="10" height="4" rx="1.5" ${paint('#5f6b77', 2)}/>`),
  'pud-slime': sticker(54, 28, `<path d="${BLOB}" ${paint('#8bdc5a', 2)}/><ellipse cx="-8" cy="-3" rx="5" ry="1.6" fill="#ffffff" fill-opacity="0.6"/><circle cx="8" cy="0" r="3" ${paint('#b6f08f', 1.4)}/><circle cx="13" cy="-4" r="1.8" ${paint('#b6f08f', 1.2)}/>`),
  'alien-0': alien(0),
  'alien-1': alien(1),
  'dec-planet': sticker(40, 30, `${tube('M-16,0 A16,4.5 0 0 1 16,0', '#ffd84a', 2)}<circle r="9" ${paint('#ff8a65', 1.8)}/><path d="M-8,-3 Q0,-1 8,-4" ${line('#e5674a', 1.6)}/>${tube('M-16,0 A16,4.5 0 0 0 16,0', '#ffd84a', 2)}`),
  'dec-rocket': sticker(28, 44, `<path d="M-3,10 Q0,18 3,10 Z" ${paint('#ff9800', 1.6)}/><path d="M-5,3 L-9,11 L-5,10 Z M5,3 L9,11 L5,10 Z" ${paint('#e53935', 1.8)}/><path d="M-5,10 L-5,-4 Q-5,-12 0,-16 Q5,-12 5,-4 L5,10 Z" ${paint('#eceff1', 2)}/><path d="M-4,-9 Q-2,-14 0,-16 Q2,-14 4,-9 Z" ${paint('#e53935', 1.8)}/><circle cx="0" cy="-2" r="2.6" ${paint('#4fc3f7', 1.6)}/>`),
  'dec-comet': sticker(36, 26, `${tube('M-14,-6 L4,-2 M-15,1 L3,0 M-11,7 L4,3', '#81d4fa', 2)}<path d="M8,-7 L9.8,-2.6 L14.5,-2.2 L11,0.9 L12,5.5 L8,3.1 L4,5.5 L5,0.9 L1.5,-2.2 L6.2,-2.6 Z" ${paint('#ffd84a', 1.6)}/>`),
  'dec-astronaut': sticker(32, 38, `<rect x="-9" y="-4" width="5" height="11" rx="1.5" ${paint('#b0bec5', 1.8)}/>${leg(-2, 8, 10, '#eceff1', 6)}${leg(3, 8, -15, '#eceff1', 6)}<rect x="-6" y="-3" width="12" height="13" rx="4" ${paint('#eceff1', 2)}/>${tube('M4,0 L9,-4', '#eceff1', 3)}<circle cx="1" cy="-8" r="7" ${paint('#eceff1', 2)}/><ellipse cx="3" cy="-8" rx="4.5" ry="3.5" ${paint('#3949ab', 1.6)}/>${dot(1.5, -9.5, 1.1, '#fff')}${dot(-1, 4, 1.4, '#ff5c7a')}`),
};
