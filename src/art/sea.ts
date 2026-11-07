import { INK, dot, line, paint, sticker, type Art } from './sticker';

// The sea's own rides (standing on top, except the speedboat which carries the owner), the life ring that replaces
// the balloon, and the bits that make open water read as water: wave crests and sparkles.
const hull = (d: string, fill: string): string => `<path d="${d}" ${paint(fill)}/>`;
const splash = (x: number, y: number): string => `<path d="M${x},${y} q-6,-6 -12,-2 M${x - 2},${y + 4} q-8,-2 -14,2" ${line('#ffffff', 2.2)}/>`;

export const SEA_ART: Readonly<Record<string, Art>> = {
  'ride-surf': sticker(62, 22, `<ellipse cx="0" cy="0" rx="27" ry="6" ${paint('#ffcc33')}/><path d="M-20,0 L20,0" ${line('#ff7043', 2.4)}/><path d="M-6,5 L-2,10" ${line(INK, 2)}/>${splash(-26, 2)}`),
  'ride-paddle': sticker(62, 50, `<path d="M16,10 L4,-20" ${line(INK, 4.4)}/><path d="M16,10 L4,-20" ${line('#a0693a', 2.4)}/><ellipse cx="17" cy="12" rx="4" ry="6" ${paint('#ff7043', 1.8)}/><ellipse cx="-2" cy="8" rx="26" ry="5" ${paint('#4dd0e1')}/>${splash(-26, 10)}`),
  'ride-pedalo': sticker(70, 50, `${hull('M-30,2 L30,2 Q28,16 0,16 Q-28,16 -30,2 Z', '#ffffff')}<path d="M-24,9 L24,9" ${line('#3d8bfd', 3)}/><path d="M24,2 Q22,-16 30,-22 Q36,-20 32,-14 Q28,-10 30,2" ${paint('#ffffff')}/>${dot(31, -18, 1.4)}<path d="M33,-17 l4,1" ${line('#ff7043', 2)}/><circle cx="-12" cy="2" r="9" ${paint('#ff7043')}/><path d="M-12,-6 L-12,10 M-20,2 L-4,2" ${line(INK, 1.8)}/>`),
  'ride-jetski': sticker(70, 42, `${hull('M-30,6 Q-30,-4 -18,-6 L6,-6 L14,-14 L22,-14 L18,-4 L30,0 Q32,8 20,10 L-24,10 Q-30,10 -30,6 Z', '#e53935')}<rect x="-14" y="-12" width="16" height="6" rx="3" ${paint('#3a3f4a')}/><path d="M14,-14 L10,-22 l6,-2" ${line(INK, 3)}/><path d="M-26,8 L24,8" ${line('#ffffff', 2)}/>${splash(-30, 8)}${splash(-34, 2)}`),
  'ride-speedboat': sticker(96, 50, `${hull('M-44,0 L40,0 Q46,2 40,12 L-38,14 Q-44,10 -44,0 Z', '#ffffff')}<path d="M-40,7 L42,6" ${line('#3d8bfd', 3.4)}/><path d="M-6,0 L2,-16 L22,-16 L28,0 Z" ${paint('#cfe9ff', 2)}/><circle cx="12" cy="-10" r="6" ${paint('#ffd3ab', 1.8)}/><path d="M6,-11 A6,6 0 0 1 18,-11 Q12,-15 6,-11 Z" fill="#5a3a22"/>${dot(14, -10, 1)}${splash(-46, 10)}${splash(-50, 4)}`),
  'shield-ring': sticker(46, 26, `<ellipse cx="0" cy="0" rx="19" ry="8" ${paint('#ffffff', 2.6)}/><path d="M-12,-6 L-8,6 M8,-6 L12,6 M-19,0 L-15,0 M15,0 L19,0" ${line('#e53935', 5)}/><ellipse cx="0" cy="0" rx="10" ry="3.5" fill="#2f9fd8" stroke="${INK}" stroke-width="2"/>`),
  'fx-wave': sticker(46, 16, `<path d="M-18,4 Q-12,-6 -4,2 Q2,-6 10,2 Q14,-4 18,2" ${line('#ffffff', 3)}/>`, 0.1),
  'fx-sparkle': sticker(16, 16, `<path d="M0,-6 L1.6,-1.6 L6,0 L1.6,1.6 L0,6 L-1.6,1.6 L-6,0 L-1.6,-1.6 Z" fill="#ffffff"/>`, 0.1),
};
