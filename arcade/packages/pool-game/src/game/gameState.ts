// src/game/gameState.ts
import {
  GameState,
  Ball,
  Vector2D,
  TableDimensions,
  ShotResult,
  BALL_RADIUS,
  TABLE_CONFIG,
} from './types';

export function createInitialState(): GameState {
  return {
    balls: createInitialBalls(),
    currentPlayer: 1,
    player1Type: null,
    player2Type: null,
    isBreakShot: true,
    isShooting: false,
    gameOver: false,
    winner: null,
    cueAngle: 0,
    cuePower: 0,
    pocketedBalls: [],
  };
}

function createInitialBalls(): Ball[] {
  const balls: Ball[] = [];
  const rackPosition: Vector2D = {
    x: TABLE_CONFIG.width * 0.75,
    y: TABLE_CONFIG.height / 2,
  };

  // Add cue ball
  balls.push({
    id: 0,
    position: {
      x: TABLE_CONFIG.width * 0.25,
      y: TABLE_CONFIG.height / 2,
    },
    velocity: { x: 0, y: 0 },
    color: 'white',
    radius: BALL_RADIUS,
    isStriped: false,
    isPocketed: false,
    isCue: true,
    wasPocketed: false,
    number: 0,
  });

  // Create rack formation
  let ballCount = 1;
  const rows = 5;
  const spacing = BALL_RADIUS * 2.1; // Slight gap between balls

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col <= row; col++) {
      if (ballCount <= 15) {
        const x = rackPosition.x + row * spacing * Math.cos(Math.PI / 6);
        const y = rackPosition.y + (col - row / 2) * spacing;

        balls.push({
          id: ballCount,
          position: { x, y },
          velocity: { x: 0, y: 0 },
          color: getBallColor(ballCount),
          number: ballCount,
          radius: BALL_RADIUS,
          isStriped: ballCount > 8,
          isPocketed: false,
          isCue: false,
          wasPocketed: false,
        });
        ballCount++;
      }
    }
  }

  return balls;
}

export function checkPocketCollisions(
  ball: Ball,
  table: TableDimensions
): boolean {
  const pockets: Vector2D[] = [
    { x: table.cushionWidth, y: table.cushionWidth },
    { x: table.width / 2, y: table.cushionWidth },
    { x: table.width - table.cushionWidth, y: table.cushionWidth },
    { x: table.cushionWidth, y: table.height - table.cushionWidth },
    { x: table.width / 2, y: table.height - table.cushionWidth },
    {
      x: table.width - table.cushionWidth,
      y: table.height - table.cushionWidth,
    },
  ];

  for (const pocket of pockets) {
    const dx = pocket.x - ball.position.x;
    const dy = pocket.y - ball.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < table.pocketRadius) {
      return true;
    }
  }

  return false;
}

export function updateGameState(
  state: GameState,
  table: TableDimensions
): ShotResult {
  const result: ShotResult = {
    ballsPocketed: [],
    scratch: false,
  };

  // Check for pocketed balls
  state.balls.forEach((ball) => {
    if (!ball.isPocketed && checkPocketCollisions(ball, table)) {
      ball.isPocketed = true;
      result.ballsPocketed.push(ball);

      if (ball.isCue) {
        result.scratch = true;
      }
    }
  });

  // Determine player types after break
  if (state.isBreakShot && result.ballsPocketed.length > 0) {
    const firstPocketed = result.ballsPocketed[0];
    if (!firstPocketed.isCue) {
      state.player1Type = firstPocketed.isStriped ? 'stripes' : 'solids';
      state.player2Type = firstPocketed.isStriped ? 'solids' : 'stripes';
    }
    state.isBreakShot = false;
  }

  // Handle scratch
  if (result.scratch) {
    handleScratch(state);
  }

  // Check for game over
  if (checkGameOver(state)) {
    state.gameOver = true;
  }

  return result;
}

function handleScratch(state: GameState): void {
  const cueBall = state.balls.find((ball) => ball.isCue);
  if (cueBall) {
    cueBall.isPocketed = false;
    cueBall.position = {
      x: TABLE_CONFIG.width * 0.25,
      y: TABLE_CONFIG.height / 2,
    };
    cueBall.velocity = { x: 0, y: 0 };
  }
  // Switch turns on scratch
  state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
}

function checkGameOver(state: GameState): boolean {
  const blackBall = state.balls.find((ball) => ball.number === 8);
  if (!blackBall?.isPocketed) return false;

  const currentPlayerType =
    state.currentPlayer === 1 ? state.player1Type : state.player2Type;
  const playerBalls = state.balls.filter(
    (ball) =>
      !ball.isCue &&
      !ball.isPocketed &&
      ball.number !== 8 &&
      ball.isStriped === (currentPlayerType === 'stripes')
  );

  // If black ball is pocketed and player had cleared their balls, they win
  state.winner =
    playerBalls.length === 0
      ? state.currentPlayer
      : state.currentPlayer === 1
        ? 2
        : 1;
  return true;
}

function getBallColor(number: number): string {
  const colors: { [key: number]: string } = {
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
  return colors[number] || '#FFFFFF';
}
