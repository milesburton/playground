// src/game/gameSetup.ts
import { Renderer } from './render';
import { Physics } from './physics';
import {
  TableDimensions,
  TABLE_CONFIG,
  GameState,
  Vector2D,
  MIN_SPEED,
  Ball,
} from './types';
import { createInitialState, updateGameState } from './gameState';

export class GameSetup {
  // Core components
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: Renderer;
  private physics: Physics;
  private dimensions: TableDimensions;
  private gameState: GameState;

  // Animation and game loop
  private animationFrameId?: number;
  private lastFrameTime: number = 0;
  private readonly FPS = 60;
  private readonly frameInterval = 1000 / this.FPS;

  // Shot mechanics
  private isSettingPower: boolean = false;
  private powerAccumulator: number = 0;
  private readonly POWER_INCREASE_RATE = 0.02;
  private readonly MAX_POWER = 1.0;
  private readonly MIN_POWER = 0.1;
  private dragStart: Vector2D | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    dimensions: TableDimensions = TABLE_CONFIG
  ) {
    this.canvas = canvas;
    this.ctx = context;
    this.dimensions = dimensions;
    this.renderer = new Renderer(context, dimensions);
    this.physics = new Physics(dimensions);
    this.gameState = createInitialState();

    this.init();
  }

  private init(): void {
    // Set up canvas
    this.setupCanvas();

    // Set up event listeners
    this.setupEventListeners();

    // Start game loop
    this.startGameLoop();
  }

  private setupCanvas(): void {
    // Set canvas dimensions
    this.canvas.width = this.dimensions.width;
    this.canvas.height = this.dimensions.height;

    // Set canvas style for crisp rendering
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
    window.addEventListener('keydown', this.handleKeyPress);

    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private getMousePosition(event: MouseEvent): Vector2D {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  private handleMouseDown = (event: MouseEvent): void => {
    if (this.isBallsMoving() || this.gameState.gameOver) return;

    const mousePos = this.getMousePosition(event);
    this.dragStart = mousePos;

    if (event.button === 0) {
      // Left click
      const cueBall = this.getCueBall();
      if (cueBall && this.isNearCueBall(mousePos, cueBall)) {
        this.gameState.isShooting = true;
        this.isSettingPower = true;
        this.powerAccumulator = 0;
      }
    }
  };

  private handleMouseMove = (event: MouseEvent): void => {
    if (this.isBallsMoving() || this.gameState.gameOver) return;

    const mousePos = this.getMousePosition(event);

    if (this.gameState.isShooting) {
      const cueBall = this.getCueBall();
      if (cueBall) {
        // Calculate angle from mouse to cue ball (reversed)
        const dx = cueBall.position.x - mousePos.x; // Reversed these coordinates
        const dy = cueBall.position.y - mousePos.y;
        this.gameState.cueAngle = Math.atan2(dy, dx);
      }
    }

    // Update power based on drag distance if setting power
    if (this.isSettingPower && this.dragStart) {
      const distance = this.calculateDistance(this.dragStart, mousePos);
      this.powerAccumulator = Math.min(distance / 200, this.MAX_POWER);
      this.gameState.cuePower = this.powerAccumulator;
    }
  };

  private handleMouseUp = (event: MouseEvent): void => {
    if (this.isBallsMoving() || this.gameState.gameOver) return;

    if (this.gameState.isShooting && this.isSettingPower) {
      const cueBall = this.getCueBall();
      if (cueBall) {
        this.executeShot(cueBall);
      }
    }

    this.resetShotState();
  };

  private handleMouseLeave = (): void => {
    if (this.isSettingPower) {
      this.resetShotState();
    }
  };

  private handleKeyPress = (event: KeyboardEvent): void => {
    // Add any keyboard controls here
    if (event.key === 'r' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.resetGame();
    }
  };

  private resetShotState(): void {
    this.gameState.isShooting = false;
    this.isSettingPower = false;
    this.powerAccumulator = 0;
    this.gameState.cuePower = 0;
    this.dragStart = null;
  }

  private executeShot(cueBall: Ball): void {
    if (this.powerAccumulator >= this.MIN_POWER) {
      this.physics.applyShot(
        cueBall,
        this.gameState.cueAngle, // Removed the + Math.PI
        this.powerAccumulator
      );
    }
  }

  private getCueBall(): Ball | undefined {
    return this.gameState.balls.find((ball) => ball.isCue);
  }

  private isNearCueBall(mousePos: Vector2D, cueBall: Ball): boolean {
    const distance = this.calculateDistance(mousePos, cueBall.position);
    return distance <= cueBall.radius * 3; // Allow some margin for easier interaction
  }

  private calculateDistance(point1: Vector2D, point2: Vector2D): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private isBallsMoving(): boolean {
    return this.gameState.balls.some(
      (ball) =>
        !ball.isPocketed &&
        (Math.abs(ball.velocity.x) > MIN_SPEED ||
          Math.abs(ball.velocity.y) > MIN_SPEED)
    );
  }

  private update(deltaTime: number): void {
    // Update power while shooting
    if (this.isSettingPower) {
      this.powerAccumulator = Math.min(
        this.powerAccumulator + this.POWER_INCREASE_RATE * deltaTime,
        this.MAX_POWER
      );
      this.gameState.cuePower = this.powerAccumulator;
    }

    // Update physics
    if (this.isBallsMoving()) {
      this.physics.updateBalls(this.gameState.balls);

      // Check for pocketed balls and update game state
      if (!this.isBallsMoving()) {
        const result = updateGameState(this.gameState, this.dimensions);
        this.handleShotResult(result);
      }
    }
  }

  private render(): void {
    this.renderer.render(this.gameState);
  }

  private gameLoop = (timestamp: number): void => {
    // Calculate delta time
    const deltaTime = timestamp - this.lastFrameTime;

    // Only update if enough time has passed
    if (deltaTime >= this.frameInterval) {
      this.lastFrameTime = timestamp - (deltaTime % this.frameInterval);

      // Update game state
      this.update(deltaTime);

      // Render frame
      this.render();
    }

    // Request next frame
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private startGameLoop(): void {
    if (!this.animationFrameId) {
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
  }

  private handleShotResult(result: any): void {
    // Handle any post-shot logic, animations, or state changes
    if (result.scratch) {
      // Handle scratch
      this.resetCueBall();
    }
  }

  private resetCueBall(): void {
    const cueBall = this.getCueBall();
    if (cueBall) {
      cueBall.position = {
        x: this.dimensions.width * 0.25,
        y: this.dimensions.height / 2,
      };
      cueBall.velocity = { x: 0, y: 0 };
      cueBall.isPocketed = false;
    }
  }

  public resetGame(): void {
    this.gameState = createInitialState();
    this.resetShotState();
  }

  public destroy(): void {
    // Clean up event listeners
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    window.removeEventListener('keydown', this.handleKeyPress);

    // Cancel animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
