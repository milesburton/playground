// src/game/types.ts

// Vector2D: A simple 2D vector type
export interface Vector2D {
  x: number;
  y: number;
}

// Ball: Defines properties of each ball in the game
export interface Ball {
  id: number;                    // Unique identifier for each ball
  number: number;                // Ball number (1-15 for solids/stripes, 0 for cue ball)
  position: Vector2D;            // Current position on the table
  velocity: Vector2D;            // Current velocity vector
  radius: number;                // Radius of the ball
  isPocketed: boolean;           // Whether the ball has been pocketed
  wasPocketed: boolean;          // Tracks if the ball was recently pocketed in this frame
  isCue: boolean;                // True if this is the cue ball
  isStriped: boolean;            // True for striped balls, false for solids
  color: string;                 // Color of the ball
  outlineColor?: string;         // Optional outline color for the ball
}

// TableDimensions: Dimensions and configuration of the pool table
export interface TableDimensions {
  width: number;                 // Width of the table
  height: number;                // Height of the table
  cushionWidth: number;          // Width of the cushion area around the table
  pocketRadius: number;          // Radius of each pocket
}

// GameState: Overall state of the game
export interface GameState {
  balls: Ball[];                 // Array of all balls in the game
  cueAngle: number;              // Angle of the cue aim in radians
  cuePower: number;              // Power applied to the cue ball during a shot
  currentPlayer: number;         // Current player's turn (1 or 2)
  player1Type: 'solids' | 'stripes' | null; // Type assigned to player 1
  player2Type: 'solids' | 'stripes' | null; // Type assigned to player 2
  isShooting: boolean;           // Whether a shot is currently in progress
  isBreakShot: boolean;          // True if it's the break shot
  gameOver: boolean;             // True if the game is over
  winner: number | null;         // Winner of the game, if applicable (1 or 2)
  pocketedBalls: Ball[];         // List of balls that have been pocketed
}

// ShotResult: The result of a single shot
export interface ShotResult {
  scratch: boolean;              // True if the cue ball was pocketed
  ballsPocketed: Ball[];         // Array of balls pocketed in the shot
}

// GameSettings: Configurations for game setup and play
export interface GameSettings {
  friction: number;              // Friction coefficient for ball deceleration
  cushionRestitution: number;    // Restitution (bounciness) for cushion collisions
  ballRestitution: number;       // Restitution for ball-ball collisions
}

// Constants for physics and gameplay
export const FRICTION = 0.98;               // Friction applied to ball movement
export const MIN_SPEED = 0.02;              // Minimum speed threshold to stop a ball
export const CUSHION_RESTITUTION = 0.9;     // Cushion collision restitution
export const BALL_RESTITUTION = 0.9;        // Ball collision restitution
export const BALL_RADIUS = 10;              // Standard radius for balls on the table

// Default configurations for TableDimensions and GameSettings
export const TABLE_CONFIG: TableDimensions = {
  width: 800,                      // Width of the table in pixels
  height: 400,                     // Height of the table in pixels
  cushionWidth: 20,                // Width of the cushion in pixels
  pocketRadius: 15                 // Radius of each pocket in pixels
};

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  friction: FRICTION,
  cushionRestitution: CUSHION_RESTITUTION,
  ballRestitution: BALL_RESTITUTION
};
