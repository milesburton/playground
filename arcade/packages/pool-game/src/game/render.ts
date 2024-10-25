// src/game/render.ts
import { TableDimensions, Ball, GameState, Vector2D } from './types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private tableDimensions: TableDimensions;

  // Rendering constants
  private readonly POWER_METER = {
    WIDTH: 200,
    HEIGHT: 10,
    MARGIN: 20,
  };

  private readonly CUE_STICK = {
    LENGTH: 150,
    WIDTH: 6,
    TIP_RADIUS: 3,
    GRADIENT_STOPS: [
      { stop: 0, color: '#F4D03F' }, // Tip
      { stop: 0.1, color: '#8B4513' }, // Dark wood
      { stop: 0.5, color: '#D35400' }, // Medium wood
      { stop: 1, color: '#8B4513' }, // Dark wood
    ],
  };

  private readonly GUIDE_LINE = {
    LENGTH: 200,
    DASH: [5, 5],
    COLOR: 'rgba(255, 255, 255, 0.4)',
  };

  constructor(ctx: CanvasRenderingContext2D, dimensions: TableDimensions) {
    this.ctx = ctx;
    this.tableDimensions = dimensions;
  }

  public render(gameState: GameState): void {
    this.clearCanvas();
    this.drawTable();
    this.drawBalls(gameState.balls);

    if (gameState.isShooting) {
      const cueBall = gameState.balls.find((ball) => ball.isCue);
      if (cueBall && !cueBall.isPocketed) {
        this.drawCueStick(cueBall, gameState.cueAngle, gameState.cuePower);
        this.drawPowerMeter(gameState.cuePower);
        if (gameState.cuePower === 0) {
          this.drawShotGuide(cueBall, gameState.cueAngle);
        }
      }
    }

    this.drawGameInfo(gameState);
  }

  public clearCanvas(): void {
    const { width, height } = this.tableDimensions;
    this.ctx.clearRect(0, 0, width, height);
  }

  public drawTable(): void {
    this.drawFelt();
    this.drawCushions();
    this.drawPockets();
    this.drawGuideLines();
    this.drawTableMarkings();
  }

  private drawFelt(): void {
    const { width, height, feltColor } = this.tableDimensions;

    // Draw base felt
    this.ctx.fillStyle = feltColor;
    this.ctx.fillRect(0, 0, width, height);

    // Add felt texture
    this.addFeltTexture();
  }

  private addFeltTexture(): void {
    const { width, height } = this.tableDimensions;
    this.ctx.globalAlpha = 0.05;

    for (let i = 0; i < width; i += 4) {
      for (let j = 0; j < height; j += 4) {
        if (Math.random() > 0.5) {
          this.ctx.fillStyle = '#000000';
          this.ctx.fillRect(i, j, 2, 2);
        }
      }
    }

    this.ctx.globalAlpha = 1.0;
  }

  private drawCushions(): void {
    const { width, height, cushionWidth, cushionColor } = this.tableDimensions;

    // Draw main cushions
    this.ctx.fillStyle = cushionColor;

    // Top cushion
    this.ctx.fillRect(0, 0, width, cushionWidth);
    // Bottom cushion
    this.ctx.fillRect(0, height - cushionWidth, width, cushionWidth);
    // Left cushion
    this.ctx.fillRect(0, 0, cushionWidth, height);
    // Right cushion
    this.ctx.fillRect(width - cushionWidth, 0, cushionWidth, height);

    // Add cushion highlights
    this.addCushionHighlights();
  }

  private addCushionHighlights(): void {
    const { width, height, cushionWidth } = this.tableDimensions;

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 2;

    // Top highlight
    this.ctx.beginPath();
    this.ctx.moveTo(0, cushionWidth);
    this.ctx.lineTo(width, cushionWidth);
    this.ctx.stroke();

    // Bottom highlight
    this.ctx.beginPath();
    this.ctx.moveTo(0, height - cushionWidth);
    this.ctx.lineTo(width, height - cushionWidth);
    this.ctx.stroke();
  }

  private drawPockets(): void {
    const { width, height, cushionWidth, pocketRadius, pocketColor } =
      this.tableDimensions;

    const pockets: Vector2D[] = [
      { x: cushionWidth, y: cushionWidth },
      { x: width / 2, y: cushionWidth },
      { x: width - cushionWidth, y: cushionWidth },
      { x: cushionWidth, y: height - cushionWidth },
      { x: width / 2, y: height - cushionWidth },
      { x: width - cushionWidth, y: height - cushionWidth },
    ];

    pockets.forEach((pocket) => {
      // Draw pocket shadow
      this.ctx.beginPath();
      this.ctx.arc(pocket.x + 2, pocket.y + 2, pocketRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fill();

      // Draw pocket
      this.ctx.beginPath();
      this.ctx.arc(pocket.x, pocket.y, pocketRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = pocketColor;
      this.ctx.fill();

      // Draw pocket rim
      this.ctx.beginPath();
      this.ctx.arc(pocket.x, pocket.y, pocketRadius + 2, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    });
  }

  private drawGuideLines(): void {
    const { width, height, cushionWidth } = this.tableDimensions;

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.setLineDash([5, 5]);

    // Draw head string line
    this.ctx.beginPath();
    this.ctx.moveTo(width * 0.25, cushionWidth);
    this.ctx.lineTo(width * 0.25, height - cushionWidth);
    this.ctx.stroke();

    // Draw center line
    this.ctx.beginPath();
    this.ctx.moveTo(width / 2, cushionWidth);
    this.ctx.lineTo(width / 2, height - cushionWidth);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
  }

  private drawTableMarkings(): void {
    const { width, height, cushionWidth } = this.tableDimensions;

    // Draw foot spot
    this.drawSpot(width * 0.75, height / 2);

    // Draw head spot
    this.drawSpot(width * 0.25, height / 2);

    // Draw center spot
    this.drawSpot(width / 2, height / 2);
  }

  private drawSpot(x: number, y: number): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, 3, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.fill();
  }

  public drawBalls(balls: Ball[]): void {
    // Sort balls so numbered balls are drawn on top of cue ball
    const sortedBalls = [...balls].sort((a, b) => (a.isCue ? -1 : 1));

    sortedBalls.forEach((ball) => {
      if (!ball.isPocketed) {
        this.drawBall(ball);
      }
    });
  }

  private drawBall(ball: Ball): void {
    // Draw ball shadow
    this.ctx.beginPath();
    this.ctx.arc(
      ball.position.x + 2,
      ball.position.y + 2,
      ball.radius,
      0,
      Math.PI * 2
    );
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fill();

    // Draw ball base
    this.ctx.beginPath();
    this.ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = ball.color;
    this.ctx.fill();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Draw stripes if applicable
    if (ball.isStriped && !ball.isCue) {
      this.drawStripe(ball);
    }

    // Draw ball number
    if (!ball.isCue && ball.number !== undefined) {
      this.drawBallNumber(ball);
    }

    // Add highlight reflection
    this.drawBallHighlight(ball);
  }

  private drawStripe(ball: Ball): void {
    this.ctx.beginPath();
    this.ctx.arc(
      ball.position.x,
      ball.position.y,
      ball.radius * 0.7,
      -Math.PI / 3,
      Math.PI / 3
    );
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = ball.radius * 0.8;
    this.ctx.stroke();
    this.ctx.lineWidth = 1;
  }

  private drawBallNumber(ball: Ball): void {
    this.ctx.fillStyle = ball.isStriped ? ball.color : '#FFFFFF';
    this.ctx.font = `bold ${ball.radius}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(ball.number.toString(), ball.position.x, ball.position.y);
  }

  private drawBallHighlight(ball: Ball): void {
    const gradient = this.ctx.createRadialGradient(
      ball.position.x - ball.radius * 0.3,
      ball.position.y - ball.radius * 0.3,
      ball.radius * 0.1,
      ball.position.x,
      ball.position.y,
      ball.radius
    );

    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    this.ctx.beginPath();
    this.ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }


  public drawCueStick(cueBall: Ball, angle: number, power: number): void {
    const cueLength = 150;
    const grabDistance = 150;

    // Calculate cue positions
    const tipX = cueBall.position.x + Math.cos(angle) * (cueBall.radius + power * 50);
    const tipY = cueBall.position.y + Math.sin(angle) * (cueBall.radius + power * 50);

    const grabX = cueBall.position.x - Math.cos(angle) * grabDistance;
    const grabY = cueBall.position.y - Math.sin(angle) * grabDistance;

    // Draw cue stick
    this.ctx.beginPath();
    this.ctx.moveTo(tipX, tipY);
    this.ctx.lineTo(grabX, grabY);
    this.ctx.strokeStyle = '#8B4513';
    this.ctx.lineWidth = 6;
    this.ctx.stroke();

    // Draw grab area
    this.ctx.beginPath();
    this.ctx.arc(grabX, grabY, 10, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.fill();
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
}

  private drawCueTip(x: number, y: number): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.CUE_STICK.TIP_RADIUS, 0, Math.PI * 2);
    this.ctx.fillStyle = '#1B4F72';
    this.ctx.fill();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  public drawPowerMeter(power: number): void {
    const x = this.POWER_METER.MARGIN;
    const y =
      this.tableDimensions.height -
      this.POWER_METER.HEIGHT -
      this.POWER_METER.MARGIN;

    // Draw background
    const bgGradient = this.ctx.createLinearGradient(
      x,
      0,
      x + this.POWER_METER.WIDTH,
      0
    );
    bgGradient.addColorStop(0, 'rgba(46, 204, 113, 0.3)'); // Green
    bgGradient.addColorStop(0.6, 'rgba(241, 196, 15, 0.3)'); // Yellow
    bgGradient.addColorStop(1, 'rgba(231, 76, 60, 0.3)'); // Red

    this.ctx.fillStyle = bgGradient;
    this.ctx.fillRect(x, y, this.POWER_METER.WIDTH, this.POWER_METER.HEIGHT);

    // Draw power level
    const powerGradient = this.ctx.createLinearGradient(
      x,
      0,
      x + this.POWER_METER.WIDTH,
      0
    );
    powerGradient.addColorStop(0, '#2ecc71'); // Green
    powerGradient.addColorStop(0.6, '#f1c40f'); // Yellow
    powerGradient.addColorStop(1, '#e74c3c'); // Red

    this.ctx.fillStyle = powerGradient;
    this.ctx.fillRect(
      x,
      y,
      this.POWER_METER.WIDTH * power,
      this.POWER_METER.HEIGHT
    );

    // Draw border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.strokeRect(x, y, this.POWER_METER.WIDTH, this.POWER_METER.HEIGHT);

    // Draw power percentage
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(
      `${Math.round(power * 100)}%`,
      x + this.POWER_METER.WIDTH + 10,
      y + 9
    );
  }

  public drawShotGuide(cueBall: Ball, angle: number): void {
    // Draw aiming line
    this.ctx.beginPath();
    this.ctx.moveTo(cueBall.position.x, cueBall.position.y);
    const endX = cueBall.position.x + Math.cos(angle) * this.GUIDE_LINE.LENGTH;
    const endY = cueBall.position.y + Math.sin(angle) * this.GUIDE_LINE.LENGTH;
    this.ctx.lineTo(endX, endY);

    this.ctx.setLineDash(this.GUIDE_LINE.DASH);
    this.ctx.strokeStyle = this.GUIDE_LINE.COLOR;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Draw aiming circle
    this.drawAimingCircle(cueBall);
  }

  private drawAimingCircle(cueBall: Ball): void {
    this.ctx.beginPath();
    this.ctx.arc(
      cueBall.position.x,
      cueBall.position.y,
      cueBall.radius + 5,
      0,
      Math.PI * 2
    );
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.stroke();
  }

  public drawGameInfo(gameState: GameState): void {
    const padding = 20;
    const textColor = '#FFFFFF';

    this.ctx.save();
    this.ctx.fillStyle = textColor;
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    // Draw current player
    this.drawPlayerInfo(gameState, padding);

    // Draw game state messages
    this.drawGameStateMessages(gameState, padding);

    // Draw winner if game is over
    if (gameState.gameOver) {
      this.drawWinnerMessage(gameState);
    }

    this.ctx.restore();
  }

  private drawPlayerInfo(gameState: GameState, padding: number): void {
    // Current player
    this.ctx.fillText(
      `Player ${gameState.currentPlayer}'s Turn`,
      padding,
      padding
    );

    // Player types (if assigned)
    if (gameState.player1Type) {
      this.ctx.fillText(
        `P1: ${gameState.player1Type.toUpperCase()}`,
        padding,
        padding + 25
      );
      this.ctx.fillText(
        `P2: ${gameState.player2Type?.toUpperCase()}`,
        padding,
        padding + 50
      );
    }
  }

  private drawGameStateMessages(gameState: GameState, padding: number): void {
    if (gameState.isBreakShot) {
      this.ctx.fillText('BREAK SHOT', padding, padding + 75);
    }
  }

  private drawWinnerMessage(gameState: GameState): void {
    if (!gameState.winner) return;

    const centerX = this.tableDimensions.width / 2;
    const centerY = this.tableDimensions.height / 2;

    // Draw semi-transparent background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(centerX - 150, centerY - 40, 300, 80);

    // Draw winner text
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`Player ${gameState.winner} Wins!`, centerX, centerY);
  }

  public drawDebugInfo(gameState: GameState): void {
    if (!gameState.debug) return;

    const padding = 10;
    const lineHeight = 20;
    let y = padding;

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    // Draw ball velocities
    gameState.balls.forEach((ball) => {
      if (!ball.isPocketed) {
        this.ctx.fillText(
          `Ball ${ball.id}: v(${ball.velocity.x.toFixed(2)}, ${ball.velocity.y.toFixed(2)})`,
          padding,
          y
        );
        y += lineHeight;
      }
    });

    // Draw current power
    this.ctx.fillText(
      `Power: ${(gameState.cuePower * 100).toFixed(1)}%`,
      padding,
      y
    );
  }
}
