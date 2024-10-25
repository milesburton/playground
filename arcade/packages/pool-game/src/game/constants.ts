export const BALL_RADIUS = 10;
export const BALL_MASS = 0.17; // kg
export const FRICTION_COEFFICIENT = 0.02;
export const MINIMUM_SPEED = 0.01;
export const RESTITUTION = 0.8;
export const CUE_POWER_MULTIPLIER = 0.2;
export const MIN_SPEED = 0.02;

export const INITIAL_BALL_POSITIONS = [
  // Cue ball
  { x: 200, y: 200 },
  // Rack positions (triangular formation)
  { x: 600, y: 200 }, // Apex
  { x: 620, y: 190 }, // Second row
  { x: 620, y: 210 },
  { x: 640, y: 180 }, // Third row
  { x: 640, y: 200 },
  { x: 640, y: 220 },
  { x: 660, y: 170 }, // Fourth row
  { x: 660, y: 190 },
  { x: 660, y: 210 },
  { x: 660, y: 230 },
  { x: 680, y: 160 }, // Fifth row
  { x: 680, y: 180 },
  { x: 680, y: 200 },
  { x: 680, y: 220 },
  { x: 680, y: 240 },
];

export const POCKET_POSITIONS = [
  { x: 20, y: 20 },
  { x: 400, y: 15 },
  { x: 780, y: 20 },
  { x: 20, y: 380 },
  { x: 400, y: 385 },
  { x: 780, y: 380 },
];

export interface TableDimensions {
  width: number;
  height: number;
  cushionWidth: number;
  pocketRadius: number;
  // Adding some standard colors for consistent use
  feltColor: string;
  cushionColor: string;
  pocketColor: string;
}
