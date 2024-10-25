// Vector for positions and velocities
export interface Vector2D {
  x: number;
  y: number;
}

// Ball properties
export interface Ball {
  id: number;
  position: Vector2D;
  velocity: Vector2D;
  color: string;
  number?: number;
  radius: number;
  isStriped: boolean;
  isPocketed: boolean;
  isCue: boolean;
}

// Game state
export interface GameState {
  balls: Ball[];
  currentPlayer: 1 | 2;
  player1Type: 'stripes' | 'solids' | undefined;
  player2Type: 'stripes' | 'solids' | undefined;
  isBreakShot: boolean;
  isShooting: boolean;
  gameOver: boolean;
  winner?: 1 | 2;
  cueAngle: number;
  cuePower: number;
}

// Table dimensions and colors
export interface TableDimensions {
  width: number;
  height: number;
  cushionWidth: number;
  pocketRadius: number;
  feltColor: string;
  cushionColor: string;
  pocketColor: string;
}

// Physics constants
export const BALL_RADIUS = 10;
export const FRICTION = 0.98; // Air and felt friction
export const MIN_SPEED = 0.01; // Minimum speed before stopping the ball
export const CUSHION_RESTITUTION = 0.6; // Energy retained after cushion collision
export const BALL_RESTITUTION = 0.95; // Energy retained after ball collision
export const MAX_POWER = 1.0; // Maximum shot power
export const MIN_POWER = 0.1; // Minimum shot power

// Standard table configuration
export const TABLE_CONFIG: TableDimensions = {
  width: 800,
  height: 400,
  cushionWidth: 20,
  pocketRadius: 15,
  feltColor: '#0a4d1c',
  cushionColor: '#8B4513',
  pocketColor: '#000000',
};

// Ball colors mapping
export const BALL_COLORS: { [key: number]: string } = {
  1: '#FFD700', // Yellow solid
  2: '#0000FF', // Blue solid
  3: '#FF0000', // Red solid
  4: '#800080', // Purple solid
  5: '#FFA500', // Orange solid
  6: '#008000', // Green solid
  7: '#8B4513', // Brown solid
  8: '#000000', // Black
  9: '#FFD700', // Yellow striped
  10: '#0000FF', // Blue striped
  11: '#FF0000', // Red striped
  12: '#800080', // Purple striped
  13: '#FFA500', // Orange striped
  14: '#008000', // Green striped
  15: '#8B4513', // Brown striped
};

// Game events
export interface GameEvent {
  type: GameEventType;
  data?: any;
}

// Event Types
export enum GameEventType {
  BALL_POCKETED = 'BALL_POCKETED',
  CUE_BALL_SCRATCH = 'CUE_BALL_SCRATCH',
  FOUL = 'FOUL',
  TURN_END = 'TURN_END',
  GAME_OVER = 'GAME_OVER',
  BREAK_SHOT = 'BREAK_SHOT',
  RAIL_HIT = 'RAIL_HIT',
  BALL_HIT = 'BALL_HIT',
  SHOT_TAKEN = 'SHOT_TAKEN',
}

// Player action types
export enum PlayerActionType {
  SHOOT = 'SHOOT',
  PLACE_CUE_BALL = 'PLACE_CUE_BALL',
  ADJUST_ANGLE = 'ADJUST_ANGLE',
  ADJUST_POWER = 'ADJUST_POWER',
  RESET_SHOT = 'RESET_SHOT',
  CALL_POCKET = 'CALL_POCKET',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
}

export interface PlayerAction {
  type: PlayerActionType;
  data: any;
}

// Shot data
export interface ShotData {
  angle: number;
  power: number;
  position: Vector2D;
}

// Game rules
export interface GameRules {
  requireCallShots: boolean;
  allowPlaceBallAfterScratch: boolean;
  mustHitRailAfterContact: boolean;
  foulsLoseTurn: boolean;
}

// Default game rules
export const DEFAULT_GAME_RULES: GameRules = {
  requireCallShots: true,
  allowPlaceBallAfterScratch: true,
  mustHitRailAfterContact: true,
  foulsLoseTurn: true,
};

// Shot result
export interface ShotResult {
  valid: boolean;
  ballsPocketed: Ball[];
  scratch: boolean;
  railsHit: number;
  firstBallHit?: Ball;
}

// Game statistics
export interface GameStatistics {
  shotsTaken: number;
  ballsPocketed: number;
  fouls: number;
  turns: number;
  duration: number;
}

// Player statistics
export interface PlayerStatistics {
  player: 1 | 2;
  shotsTaken: number;
  ballsPocketed: number;
  fouls: number;
  averageShotPower: number;
}

// Animation states
export interface AnimationState {
  isAnimating: boolean;
  ballsInMotion: boolean;
  powerBarVisible: boolean;
  showingShotPreview: boolean;
}

export interface GameSettings {
  friction: number;
  cushionRestitution: number;
  ballRestitution: number;
  maxShotPower: number;
  minShotPower: number;
  requireCallShots: boolean;
  allowPlaceBallAfterScratch: boolean;
  debug: boolean;
  soundEnabled?: boolean;
  showGuideLines?: boolean;
  showPowerMeter?: boolean;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  friction: FRICTION,
  cushionRestitution: CUSHION_RESTITUTION,
  ballRestitution: BALL_RESTITUTION,
  maxShotPower: 1.0,
  minShotPower: 0.1,
  requireCallShots: true,
  allowPlaceBallAfterScratch: true,
  debug: false,
  soundEnabled: true,
  showGuideLines: true,
  showPowerMeter: true,
};
