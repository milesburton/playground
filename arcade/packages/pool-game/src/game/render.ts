// src/game/render.ts
import { TableDimensions, Ball, GameState } from './types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private tableDimensions: TableDimensions;
  private readonly POWER_METER_WIDTH = 200;
  private readonly POWER_METER_HEIGHT = 20;
  private readonly POWER_METER_MARGIN = 20;
  private readonly CUE_STICK_LENGTH = 150;
  private readonly CUE_STICK_WIDTH = 3;

  constructor(ctx: CanvasRenderingContext2D, dimensions: TableDimensions) {
    this.ctx = ctx;
    this.tableDimensions = dimensions;
  }

  public clearCanvas(): void {
    const { width, height } = this.tableDimensions;
    this.ctx.clearRect(0, 0, width, height);
  }

  public render(gameState: GameState): void {
    this.clearCanvas();
    this.drawTable();
    this.drawBalls(gameState.balls);

    if (gameState.isShooting) {
      const cueBall = gameState.balls.find(ball => ball.isCue);
      if (cueBall && !cueBall.isPocketed) {
        this.drawCueStick(cueBall, gameState.cueAngle, gameState.cuePower);
        this.drawPowerMeter(gameState.cuePower);
        this.drawShotPreview(cueBall, gameState.cueAngle);
      }
    }

    this.drawGameInfo(gameState);
  }

  public drawTable(): void {
    this.drawFelt();
    this.drawCushions();
    this.drawPockets();
    this.drawGuideLines();
  }

  private drawFelt(): void {
    const { width, height, feltColor } = this.tableDimensions;
    this.ctx.fillStyle = feltColor;
    this.ctx.fillRect(0, 0, width, height);
  }

  private drawCushions(): void {
    const { width, height, cushionWidth, cushionColor } = this.tableDimensions;
    this.ctx.fillStyle = cushionColor;

    // Top cushion
    this.ctx.fillRect(0, 0, width, cushionWidth);
    // Bottom cushion
    this.ctx.fillRect(0, height - cushionWidth, width, cushionWidth);
    // Left cushion
    this.ctx.fillRect(0, 0, cushionWidth, height);
    // Right cushion
    this.ctx.fillRect(width - cushionWidth, 0, cushionWidth, height);
  }

  private drawPockets(): void {
    const { width, height, cushionWidth, pocketRadius, pocketColor } = this.tableDimensions;
    this.ctx.fillStyle = pocketColor;

    // Define pocket positions
    const pockets = [
      { x: cushionWidth, y: cushionWidth },                    // Top left
      { x: width / 2, y: cushionWidth },                       // Top middle
      { x: width - cushionWidth, y: cushionWidth },            // Top right
      { x: cushionWidth, y: height - cushionWidth },           // Bottom left
      { x: width / 2, y: height - cushionWidth },              // Bottom middle
      { x: width - cushionWidth, y: height - cushionWidth }    // Bottom right
    ];

    // Draw each pocket
    pockets.forEach(pocket => {
      this.ctx.beginPath();
      this.ctx.arc(pocket.x, pocket.y, pocketRadius, 0, Math.PI * 2);
      this.ctx.fill();

      // Add pocket shadows
      this.ctx.beginPath();
      this.ctx.arc(pocket.x, pocket.y, pocketRadius + 2, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.stroke();
    });
  }

  private drawGuideLines(): void {
    const { width, height, cushionWidth } = this.tableDimensions;
    const playableWidth = width - (cushionWidth * 2);
    const playableHeight = height - (cushionWidth * 2);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.setLineDash([5, 5]);

    // Draw head string line (where cue ball is placed)
    this.ctx.beginPath();
    this.ctx.moveTo(width * 0.25, cushionWidth);
    this.ctx.lineTo(width * 0.25, height - cushionWidth);
    this.ctx.stroke();

    // Draw center line
    this.ctx.beginPath();
    this.ctx.moveTo(width / 2, cushionWidth);
    this.ctx.lineTo(width / 2, height - cushionWidth);
    this.ctx.stroke();

    this.ctx.setLineDash([]); // Reset line dash
  }

  public drawBalls(balls: Ball[]): void {
    // Sort balls so numbered balls are drawn on top of cue ball
    const sortedBalls = [...balls].sort((a, b) => (a.isCue ? -1 : 1));

    sortedBalls.forEach(ball => {
      if (!ball.isPocketed) {
        this.drawBall(ball);
      }
    });
  }

  private drawBall(ball: Ball): void {
    const { ctx } = this;

    // Draw ball shadow
    ctx.beginPath();
    ctx.arc(ball.position.x + 2, ball.position.y + 2, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();

    // Draw ball base
    ctx.beginPath();
    ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw stripes if applicable
    if (ball.isStriped && !ball.isCue) {
      ctx.beginPath();
      ctx.arc(
        ball.position.x,
        ball.position.y,
        ball.radius * 0.7,
        -Math.PI / 3,
        Math.PI / 3
      );
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = ball.radius * 0.8;
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    // Draw ball number
    if (!ball.isCue && ball.number !== undefined) {
      ctx.fillStyle = ball.isStriped ? ball.color : '#FFFFFF';
      ctx.font = `${ball.radius}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        ball.number.toString(),
        ball.position.x,
        ball.position.y
      );
    }

    // Add highlight reflection
    this.drawBallHighlight(ball);
  }

  private drawBallHighlight(ball: Ball): void {
    const { ctx } = this;
    const gradient = ctx.createRadialGradient(
      ball.position.x - ball.radius * 0.3,
      ball.position.y - ball.radius * 0.3,
      ball.radius * 0.1,
      ball.position.x,
      ball.position.y,
      ball.radius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  public drawCueStick(cueBall: Ball, angle: number, power: number): void {
    const { ctx } = this;
    const powerOffset = power * 50; // Pull back cue stick based on power

    const startX = cueBall.position.x - Math.cos(angle) * (cueBall.radius + powerOffset);
    const startY = cueBall.position.y - Math.sin(angle) * (cueBall.radius + powerOffset);
    const endX = startX - Math.cos(angle) * this.CUE_STICK_LENGTH;
    const endY = startY - Math.sin(angle) * this.CUE_STICK_LENGTH;

    // Draw cue stick shadow
    ctx.beginPath();
    ctx.moveTo(startX + 2, startY + 2);
    ctx.lineTo(endX + 2, endY + 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = this.CUE_STICK_WIDTH + 2;
    ctx.stroke();

    // Draw cue stick
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = this.CUE_STICK_WIDTH;
    ctx.stroke();

    // Draw cue tip
    ctx.beginPath();
    ctx.arc(startX, startY, this.CUE_STICK_WIDTH / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#87CEEB';
    ctx.fill();
    ctx.stroke();
  }

  public drawPowerMeter(power: number): void {
    const { ctx } = this;
    const x = this.POWER_METER_MARGIN;
    const y = this.tableDimensions.height - this.POWER_METER_HEIGHT - this.POWER_METER_MARGIN;

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, this.POWER_METER_WIDTH, this.POWER_METER_HEIGHT);

    // Draw power level
    const gradient = ctx.createLinearGradient(x, y, x + this.POWER_METER_WIDTH, y);
    gradient.addColorStop(0, '#00ff00');
    gradient.addColorStop(0.5, '#ffff00');
    gradient.addColorStop(1, '#ff0000');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, this.POWER_METER_WIDTH * power, this.POWER_METER_HEIGHT);

    // Draw border
    ctx.strokeStyle = '#FFFFFF';
    ctx.strokeRect(x, y, this.POWER_METER_WIDTH, this.POWER_METER_HEIGHT);
  }

  public drawShotPreview(cueBall: Ball, angle: number): void {
    const { ctx } = this;
    const lineLength = 100;

    const endX = cueBall.position.x + Math.cos(angle) * lineLength;
    const endY = cueBall.position.y + Math.sin(angle) * lineLength;

    ctx.beginPath();
    ctx.moveTo(cueBall.position.x, cueBall.position.y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  public drawGameInfo(gameState: GameState): void {
    const { ctx } = this;
    const padding = 20;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Draw player info
    ctx.fillText(
      `Player ${gameState.currentPlayer}'s Turn`,
      padding,
      padding
    );

    // Draw player types if assigned
    if (gameState.player1Type) {
      ctx.fillText(
        `P1: ${gameState.player1Type.toUpperCase()}`,
        padding,
        padding + 25
      );
      ctx.fillText(
        `P2: ${gameState.player2Type?.toUpperCase()}`,
        padding,
        padding + 50
      );
    }

    // Draw game state messages
    if (gameState.isBreakShot) {
      ctx.fillText('BREAK SHOT', padding, padding + 75);
    }

    if (gameState.gameOver && gameState.winner) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(
        `Player ${gameState.winner} Wins!`,
        this.tableDimensions.width / 2 - 100,
        this.tableDimensions.height / 2 - 12
      );
    }
  }
}