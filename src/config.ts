export const WIDTH = 360;
export const HEIGHT = 640;

export const LANES = [0, 1, 2] as const;
export type Lane = (typeof LANES)[number];
export const LANE_X: Record<Lane, number> = { 0: 80, 1: 180, 2: 280 };

export const OWNER_Y = 550;
export const ROW_SPACING_PX = 144;
export const CROSSER_SPEED = 170;
