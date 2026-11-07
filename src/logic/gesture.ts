// Touch controls, decided while the finger is still moving: a sideways flick changes lane the moment it is long
// enough (and keeps changing lanes if it carries on), an upward flick throws, and a tap that barely moved throws.
// Waiting for the finger to lift, as the first version did, turned short phone flicks into accidental throws.
export const SWIPE_PX = 18;
export const TAP_PX = 12;
const THROW_UP_PX = 28;

export interface Gesture {
  readonly startX: number;
  readonly startY: number;
  // Where the current lane step is measured from; it moves on after each step so one long swipe can cross two lanes.
  readonly fromX: number;
  readonly fromY: number;
  readonly acted: boolean;
}

export type GestureAction = 'left' | 'right' | 'throw';

export function startGesture(x: number, y: number): Gesture {
  return { startX: x, startY: y, fromX: x, fromY: y, acted: false };
}

export function moveGesture(g: Gesture, x: number, y: number): { gesture: Gesture; action?: GestureAction } {
  const dx = x - g.fromX;
  const dy = y - g.fromY;
  if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
    return { gesture: { ...g, fromX: x, fromY: y, acted: true }, action: dx > 0 ? 'right' : 'left' };
  }
  if (!g.acted && -dy >= THROW_UP_PX && -dy > Math.abs(dx) * 1.5) {
    return { gesture: { ...g, fromX: x, fromY: y, acted: true }, action: 'throw' };
  }
  return { gesture: g };
}

export function endGesture(g: Gesture, x: number, y: number): GestureAction | undefined {
  if (g.acted) return undefined;
  return Math.hypot(x - g.startX, y - g.startY) <= TAP_PX ? 'throw' : undefined;
}
