// src/game/gameSetup.ts
import { Renderer } from './render';
import { Physics } from './physics';
import {
    TableDimensions,
    TABLE_CONFIG,
    GameState,
    Vector2D,
    Ball,
    MIN_SPEED,
    ShotResult,
    GameSettings,
    DEFAULT_GAME_SETTINGS
} from './types';
import { createInitialState, updateGameState } from './gameState';

// Core Constants
const PHYSICS_STEP = 1000 / 120; // 120 Hz physics updates
const MAX_DRAWBACK = 150;
const MIN_DRAWBACK = 5;
const POWER_SCALING = 0.007;
const SHOT_COOLDOWN = 500; // ms
const CUE_GRAB_DISTANCE = 20;

interface CueState {
    isHoldingCue: boolean;
    dragStartPosition: Vector2D | null;
    dragCurrentPosition: Vector2D | null;
    cueOffset: number;
    maxDrawback: number;
    currentDrawback: number;
}

export class GameSetup {
    // Core components
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly renderer: Renderer;
    private readonly physics: Physics;
    private readonly dimensions: TableDimensions;
    private gameState: GameState;
    private settings: GameSettings;

    // Animation and game loop
    private animationFrameId?: number;
    private lastFrameTime: number = 0;
    private accumulator: number = 0;

    // Cue control state
    private cueState: CueState = {
        isHoldingCue: false,
        dragStartPosition: null,
        dragCurrentPosition: null,
        cueOffset: 0,
        maxDrawback: MAX_DRAWBACK,
        currentDrawback: 0
    };

    private lastShotTime: number = 0;

    constructor(
        canvas: HTMLCanvasElement,
        context: CanvasRenderingContext2D,
        dimensions: TableDimensions = TABLE_CONFIG,
        settings: GameSettings = DEFAULT_GAME_SETTINGS
    ) {
        this.canvas = canvas;
        this.ctx = context;
        this.dimensions = dimensions;
        this.settings = settings;
        this.renderer = new Renderer(context, dimensions);
        this.physics = new Physics(dimensions);
        this.gameState = createInitialState();

        this.initialize();
    }

    // Initialization Methods
    private initialize(): void {
        this.setupCanvas();
        this.setupEventListeners();
        this.startGameLoop();
    }

    private setupCanvas(): void {
        this.canvas.width = this.dimensions.width;
        this.canvas.height = this.dimensions.height;
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    private setupEventListeners(): void {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown as EventListener);
        this.canvas.addEventListener('mousemove', this.handleMouseMove as EventListener);
        this.canvas.addEventListener('mouseup', this.handleMouseUp as EventListener);
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave as EventListener);

        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouchStart as EventListener);
        this.canvas.addEventListener('touchmove', this.handleTouchMove as EventListener);
        this.canvas.addEventListener('touchend', this.handleTouchEnd as EventListener);

        // Window events
        window.addEventListener('keydown', this.handleKeyPress as EventListener);
        window.addEventListener('resize', this.handleResize);

        // Prevent unwanted behaviors
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        this.canvas.addEventListener('selectstart', (e) => e.preventDefault());
    }

    // Game Loop Methods
    private startGameLoop(): void {
        this.lastFrameTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }

    private gameLoop = (timestamp: number): void => {
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        // Accumulate time for physics updates
        this.accumulator += deltaTime;

        // Update physics with fixed time step
        while (this.accumulator >= PHYSICS_STEP) {
            this.update(PHYSICS_STEP);
            this.accumulator -= PHYSICS_STEP;
        }

        // Render at display refresh rate
        this.render();

        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    };

    private update(deltaTime: number): void {
        if (this.isBallsMoving()) {
            this.physics.updateBalls(this.gameState.balls);
            this.checkTableState();
        }
    }

    private render(): void {
        this.renderer.render(this.gameState);
    }

    // Event Handlers
    private handleMouseDown = (event: MouseEvent): void => {
        if (this.shouldSkipShot()) return;

        const mousePos = this.getMousePosition(event);
        const cueBall = this.getCueBall();
        if (!cueBall || cueBall.isPocketed) return;

        if (event.button === 0) { // Left click
            const distanceToCue = this.calculateDistance(mousePos, cueBall.position);
            if (distanceToCue < CUE_GRAB_DISTANCE) {
                this.cueState.isHoldingCue = true;
                this.cueState.dragStartPosition = mousePos;
                this.gameState.isShooting = true;
            }
        }
    };

    private handleMouseMove = (event: MouseEvent): void => {
        if (this.shouldSkipShot()) return;

        const mousePos = this.getMousePosition(event);
        const cueBall = this.getCueBall();
        if (!cueBall || cueBall.isPocketed) return;

        if (this.cueState.isHoldingCue && this.cueState.dragStartPosition) {
            this.cueState.dragCurrentPosition = mousePos;

            // Calculate drag vector from start position to current mouse position
            const dragVector = {
                x: this.cueState.dragStartPosition.x - mousePos.x,
                y: this.cueState.dragStartPosition.y - mousePos.y
            };

            // Calculate angle from cue ball to mouse for direction
            const dx = mousePos.x - cueBall.position.x;
            const dy = mousePos.y - cueBall.position.y;
            this.gameState.cueAngle = Math.atan2(dy, dx);

            // Calculate power based on drag distance
            const projection = Math.sqrt(dragVector.x * dragVector.x + dragVector.y * dragVector.y);
            this.cueState.currentDrawback = Math.min(projection, this.cueState.maxDrawback);
            this.gameState.cuePower = this.calculatePowerFromDrawback(this.cueState.currentDrawback);
        } else {
            // Update aim angle when not holding cue
            const dx = mousePos.x - cueBall.position.x;
            const dy = mousePos.y - cueBall.position.y;
            this.gameState.cueAngle = Math.atan2(dy, dx);
        }
    };

    private handleMouseUp = (): void => {
        if (this.shouldSkipShot()) return;

        if (this.cueState.isHoldingCue) {
            const cueBall = this.getCueBall();
            if (cueBall && this.cueState.currentDrawback > MIN_DRAWBACK) {
                this.executeShot(cueBall);
                this.lastShotTime = Date.now();
            }
            this.resetCueState();
        }
    };

    private handleMouseLeave = (): void => {
        if (this.cueState.isHoldingCue) {
            this.resetCueState();
        }
    };

    private handleTouchStart = (event: TouchEvent): void => {
        event.preventDefault();
        const touch = event.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleMouseDown(mouseEvent);
    };

    private handleTouchMove = (event: TouchEvent): void => {
        event.preventDefault();
        const touch = event.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleMouseMove(mouseEvent);
    };

    private handleTouchEnd = (event: TouchEvent): void => {
        event.preventDefault();
        this.handleMouseUp();
    };

    private handleKeyPress = (event: KeyboardEvent): void => {
        if (event.key === 'r' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            this.resetGame();
        } else if (event.key === 'Escape') {
            this.resetCueState();
        }
    };

    private handleResize = (): void => {
        const parentWidth = this.canvas.parentElement?.clientWidth || this.dimensions.width;
        const scale = parentWidth / this.dimensions.width;
        this.canvas.style.width = `${this.dimensions.width * scale}px`;
        this.canvas.style.height = `${this.dimensions.height * scale}px`;
        this.canvas.width = this.dimensions.width;
        this.canvas.height = this.dimensions.height;
    };

    // Shot Execution
    private executeShot(cueBall: Ball): void {
        const power = this.calculatePowerFromDrawback(this.cueState.currentDrawback);
        if (power > 0) {
            // Add PI to reverse the angle since we want to shoot away from the mouse
            const shotAngle = this.gameState.cueAngle + Math.PI;
            this.physics.applyShot(cueBall, shotAngle, power);

            this.gameState.isShooting = false;
            this.checkTableState();
        }
    }

    // Game State Management
    private checkTableState(): void {
        if (!this.isBallsMoving()) {
            const result = updateGameState(this.gameState, this.dimensions);
            this.handleShotResult(result);
        }
    }

    private handleShotResult(result: ShotResult): void {
        if (result.scratch) {
            this.handleScratch();
        }

        if (result.ballsPocketed.length > 0) {
            this.handlePocketedBalls(result.ballsPocketed);
        }

        if (this.gameState.gameOver) {
            this.handleGameOver();
        }
    }

    private handleScratch(): void {
        const cueBall = this.getCueBall();
        if (cueBall) {
            this.resetCueBall();
            this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
        }
    }

    private handlePocketedBalls(pocketedBalls: Ball[]): void {
        if (this.gameState.isBreakShot && !pocketedBalls[0]?.isCue) {
            this.assignPlayerTypes(pocketedBalls[0].isStriped);
            this.gameState.isBreakShot = false;
        }

        if (pocketedBalls.some(ball => ball.number === 8)) {
            this.handleBlackBallPocketed();
        }
    }

    private handleBlackBallPocketed(): void {
        const currentPlayerType = this.gameState.currentPlayer === 1
            ? this.gameState.player1Type
            : this.gameState.player2Type;

        const hasRemainingBalls = this.gameState.balls.some(ball =>
            !ball.isPocketed &&
            !ball.isCue &&
            ball.number !== 8 &&
            (ball.isStriped === (currentPlayerType === 'stripes'))
        );

        this.gameState.gameOver = true;
        this.gameState.winner = !hasRemainingBalls
            ? this.gameState.currentPlayer
            : (this.gameState.currentPlayer === 1 ? 2 : 1);
    }

    private handleGameOver(): void {
        this.gameState.isShooting = false;
        this.resetCueState();
    }

    // Player Type Assignment
    private assignPlayerTypes(firstPocketedIsStriped: boolean): void {
        if (this.gameState.currentPlayer === 1) {
            this.gameState.player1Type = firstPocketedIsStriped ? 'stripes' : 'solids';
            this.gameState.player2Type = firstPocketedIsStriped ? 'solids' : 'stripes';
        } else {
            this.gameState.player1Type = firstPocketedIsStriped ? 'solids' : 'stripes';
            this.gameState.player2Type = firstPocketedIsStriped ? 'stripes' : 'solids';
        }
    }

    // Utility Methods
    private getMousePosition(event: MouseEvent): Vector2D {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (event.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    private calculateDistance(point1: Vector2D, point2: Vector2D): number {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private calculatePowerFromDrawback(drawback: number): number {
        return Math.min(drawback * POWER_SCALING, 1);
    }

    private resetCueBall(): void {
        const cueBall = this.getCueBall();
        if (cueBall) {
            cueBall.position = {
                x: this.dimensions.width * 0.25,
                y: this.dimensions.height / 2
            };
            cueBall.velocity = { x: 0, y: 0 };
            cueBall.isPocketed = false;
        }
    }

    private resetCueState(): void {
        this.cueState = {
            isHoldingCue: false,
            dragStartPosition: null,
            dragCurrentPosition: null,
            cueOffset: 0,
            maxDrawback: MAX_DRAWBACK,
            currentDrawback: 0
        };
        this.gameState.isShooting = false;
        this.gameState.cuePower = 0;
    }

    private shouldSkipShot(): boolean {
        return (
            this.isBallsMoving() ||
            this.gameState.gameOver ||
            Date.now() - this.lastShotTime < SHOT_COOLDOWN
        );
    }

    private isBallsMoving(): boolean {
        return this.gameState.balls.some(ball =>
            !ball.isPocketed &&
            (Math.abs(ball.velocity.x) > MIN_SPEED || Math.abs(ball.velocity.y) > MIN_SPEED)
        );
    }

    private getCueBall(): Ball | undefined {
        return this.gameState.balls.find(ball => ball.isCue);
    }

// Public Methods
public getGameState(): GameState {
  return { ...this.gameState };
}

public resetGame(): void {
  this.gameState = createInitialState();
  this.resetCueState();
  this.lastShotTime = 0;
  this.accumulator = 0;
}

public updateSettings(settings: Partial<GameSettings>): void {
  this.settings = {
      ...this.settings,
      ...settings
  };
}

public pause(): void {
  if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
  }
}

public resume(): void {
  if (!this.animationFrameId) {
      this.lastFrameTime = performance.now();
      this.startGameLoop();
  }
}

public destroy(): void {
  // Remove event listeners
  this.canvas.removeEventListener('mousedown', this.handleMouseDown as EventListener);
  this.canvas.removeEventListener('mousemove', this.handleMouseMove as EventListener);
  this.canvas.removeEventListener('mouseup', this.handleMouseUp as EventListener);
  this.canvas.removeEventListener('mouseleave', this.handleMouseLeave as EventListener);

  this.canvas.removeEventListener('touchstart', this.handleTouchStart as EventListener);
  this.canvas.removeEventListener('touchmove', this.handleTouchMove as EventListener);
  this.canvas.removeEventListener('touchend', this.handleTouchEnd as EventListener);

  window.removeEventListener('keydown', this.handleKeyPress as EventListener);
  window.removeEventListener('resize', this.handleResize);

  // Cancel animation frame
  if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
  }

  // Reset state
  this.resetGame();
  this.physics.reset();
}
}