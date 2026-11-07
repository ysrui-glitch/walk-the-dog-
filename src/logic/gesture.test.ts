import { describe, expect, it } from 'vitest';
import { SWIPE_PX, endGesture, moveGesture, startGesture, type GestureAction } from './gesture';

// Plays a finger path through the tracker and returns every action it fired, including on lift.
function swipe(path: readonly [number, number][]): GestureAction[] {
  const [first, ...rest] = path;
  let g = startGesture(...first);
  const actions: GestureAction[] = [];
  for (const [x, y] of rest) {
    const step = moveGesture(g, x, y);
    g = step.gesture;
    if (step.action) actions.push(step.action);
  }
  const last = path[path.length - 1];
  const lifted = endGesture(g, ...last);
  return lifted ? [...actions, lifted] : actions;
}

describe('touch gestures', () => {
  it('a short sideways flick changes lane before the finger lifts', () => {
    expect(swipe([[100, 300], [110, 301], [100 + SWIPE_PX, 302]])).toEqual(['right']);
    expect(swipe([[100, 300], [80, 298]])).toEqual(['left']);
  });

  it('a short flick is never mistaken for a throw', () => {
    expect(swipe([[100, 300], [114, 302]])).toEqual([]);
  });

  it('one long swipe can cross two lanes', () => {
    expect(swipe([[100, 300], [120, 300], [140, 301]])).toEqual(['right', 'right']);
  });

  it('a tap that barely moves throws, on lift', () => {
    expect(swipe([[100, 300], [104, 303]])).toEqual(['throw']);
  });

  it('flicking upwards throws; dragging down does nothing', () => {
    expect(swipe([[100, 300], [102, 260]])).toEqual(['throw']);
    expect(swipe([[100, 300], [102, 360]])).toEqual([]);
  });

  it('a lane change ends the gesture for throwing', () => {
    expect(swipe([[100, 300], [125, 300], [126, 250]])).toEqual(['right']);
  });
});
