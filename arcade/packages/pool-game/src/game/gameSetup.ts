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

interface CueState {
  isHoldingCue: boolean;
  dragStartPosition: Vector2D | null;
  dragCurrentPosition: Vector2D | null;
  cueOffset: number;
  maxDrawback: number;
  currentDrawback: number;
}

// Configurations and Constants
const CUE_GRAB_DISTANCE = 20;
const MAX_DRAWBACK = 150;
const POWER_SCALING = 0.007;
const SHOT_COOLDOWN = 500; // ms
const PHYSICS_STEP = 1000 / 120; // 120 Hz physics updates

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

    // Cue control
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

    // Initialization of Game
    private initialize(): void {
        this.setupCanvas();
        this.setupEventListeners();
        this.startGameLoop();
    }

    // Canvas and Event Listeners Setup
    private setupCanvas(): void {
        this.canvas.width = this.dimensions.width;
        this.canvas.height = this.dimensions.height;
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    private setupEventListeners(): void {
        this.canvas.addEventListener('mousedown', this.handleMouseDown as EventListener);
        this.canvas.addEventListener('mousemove', this.handleMouseMove as EventListener);
        this.canvas.addEventListener('mouseup', this.handleMouseUp as EventListener);
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave as EventListener);

        this.canvas.addEventListener('touchstart', this.handleTouchStart as EventListener);
        this.canvas.addEventListener('touchmove', this.handleTouchMove as EventListener);
        this.canvas.addEventListener('touchend', this.handleTouchEnd as EventListener);

        window.addEventListener('keydown', this.handleKeyPress as EventListener);
        window.addEventListener('resize', this.handleResize);

        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        this.canvas.addEventListener('selectstart', (e) => e.preventDefault());
    }

    // Main Game Loop
    private startGameLoop(): void {
        this.lastFrameTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }

    private gameLoop = (timestamp: number): void => {
        const deltaTime = (timestamp - this.lastFrameTime) / 1000; // Convert to seconds
        this.lastFrameTime = timestamp;

        this.accumulator += deltaTime;
        while (this.accumulator >= PHYSICS_STEP / 1000) {
            this.update(deltaTime);
            this.accumulator -= PHYSICS_STEP / 1000;
        }

        this.render();
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    };

    private update(deltaTime: number): void {
        if (this.isBallsMoving()) {
            this.physics.updateBalls(this.gameState.balls, deltaTime); // Pass deltaTime to updateBalls
            this.checkTableState();
        }
    }

    private render(): void {
        this.renderer.render(this.gameState);
    }

    // Input Event Handlers
    private handleMouseDown = (event: MouseEvent): void => {
        if (this.shouldSkipShot()) return;

        const mousePos = this.getMousePosition(event);
        const cueBall = this.getCueBall();
        if (!cueBall || cueBall.isPocketed) return;

        const distanceToCue = this.calculateDistance(mousePos, cueBall.position);
        if (distanceToCue < CUE_GRAB_DISTANCE) {
            this.cueState.isHoldingCue = true;
            this.cueState.dragStartPosition = mousePos;
            this.gameState.isShooting = true;
        }
    };

    private handleMouseMove = (event: MouseEvent): void => {
        if (this.shouldSkipShot()) return;

        const mousePos = this.getMousePosition(event);
        const cueBall = this.getCueBall();
        if (!cueBall || cueBall.isPocketed) return;

        this.cueState.isHoldingCue ? this.updateCueDrawback(mousePos) : this.updateCueAngle(mousePos, cueBall);
    };

    private handleMouseUp = (): void => {
        if (this.shouldSkipShot() || !this.cueState.isHoldingCue) return;

        const cueBall = this.getCueBall();
        if (cueBall && this.cueState.currentDrawback > CUE_GRAB_DISTANCE) {
            this.executeShot(cueBall);
            this.lastShotTime = Date.now();
        }
        this.resetCueState();
    };

    private handleMouseLeave = (): void => this.resetCueState();

    private handleTouchStart = (event: TouchEvent): void => {
        const touch = event.touches[0];
        this.handleMouseDown(new MouseEvent('mousedown', { clientX: touch.clientX, clientY: touch.clientY }));
    };

    private handleTouchMove = (event: TouchEvent): void => {
        const touch = event.touches[0];
        this.handleMouseMove(new MouseEvent('mousemove', { clientX: touch.clientX, clientY: touch.clientY }));
    };

    private handleTouchEnd = (): void => this.handleMouseUp();

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

    // Cue Interaction Methods
    private updateCueDrawback(mousePos: Vector2D): void {
        const dragVector = {
            x: mousePos.x - (this.cueState.dragStartPosition?.x || 0),
            y: mousePos.y - (this.cueState.dragStartPosition?.y || 0)
        };
        const cueVector = {
            x: Math.cos(this.gameState.cueAngle),
            y: Math.sin(this.gameState.cueAngle)
        };
        const projection = dragVector.x * cueVector.x + dragVector.y * cueVector.y;

        this.cueState.cueOffset = Math.max(0, projection);
        this.cueState.currentDrawback = Math.min(this.cueState.cueOffset, this.cueState.maxDrawback);
        this.gameState.cuePower = this.calculatePowerFromDrawback(this.cueState.currentDrawback);
    }

    private updateCueAngle(mousePos: Vector2D, cueBall: Ball): void {
        const dx = mousePos.x - cueBall.position.x;
        const dy = mousePos.y - cueBall.position.y;
        this.gameState.cueAngle = Math.atan2(dy, dx);
    }

    private calculateDistance(point1: Vector2D, point2: Vector2D): number {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Game State Updates
    private executeShot(cueBall: Ball): void {
        const power = this.calculatePowerFromDrawback(this.cueState.currentDrawback);
        this.physics.applyShot(cueBall, this.gameState.cueAngle, power);
        this.gameState.isShooting = false;
        this.checkTableState();
    }

    private checkTableState(): void {
        if (!this.isBallsMoving()) {
            const result = updateGameState(this.gameState, this.dimensions);
            this.handleShotResult(result);
        }
    }

    private handleShotResult(result: ShotResult): void {
        if (result.scratch) this.handleScratch();
        if (result.ballsPocketed.length) this.handlePocketedBalls(result.ballsPocketed);
        if (this.gameState.gameOver) this.handleGameOver();
    }

    // Handle Scratch
    private handleScratch(): void {
        const cueBall = this.getCueBall();
        if (cueBall) {
            this.resetCueBall();
            this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
        }
    }

    // Handle Pocketed Balls
    private handlePocketedBalls(pocketedBalls: Ball[]): void {
        if (this.gameState.isBreakShot && !pocketedBalls[0]?.isCue) {
            this.assignPlayerTypes(pocketedBalls[0].isStriped);
            this.gameState.isBreakShot = false;
        }

        if (pocketedBalls.some(ball => ball.number === 8)) {
            this.handleBlackBallPocketed();
        }
    }

    private assignPlayerTypes(firstPocketedIsStriped: boolean): void {
        if (this.gameState.currentPlayer === 1) {
            this.gameState.player1Type = firstPocketedIsStriped ? 'stripes' : 'solids';
            this.gameState.player2Type = firstPocketedIsStriped ? 'solids' : 'stripes';
        } else {
            this.gameState.player1Type = firstPocketedIsStriped ? 'solids' : 'stripes';
            this.gameState.player2Type = firstPocketedIsStriped ? 'stripes' : 'solids';
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

    private shouldSkipShot(): boolean {
        return this.isBallsMoving() || this.gameState.gameOver || Date.now() - this.lastShotTime < SHOT_COOLDOWN;
    }

    private getMousePosition(event: MouseEvent): Vector2D {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (event.clientY - rect.top) * (this.canvas.height / rect.height)
        };
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
        this.cueState = { isHoldingCue: false, dragStartPosition: null, dragCurrentPosition: null, cueOffset: 0, maxDrawback: MAX_DRAWBACK, currentDrawback: 0 };
        this.gameState.isShooting = false;
    }

    private isBallsMoving(): boolean {
        return this.gameState.balls.some(ball => !ball.isPocketed && (Math.abs(ball.velocity.x) > MIN_SPEED || Math.abs(ball.velocity.y) > MIN_SPEED));
    }

    private getCueBall(): Ball | undefined {
        return this.gameState.balls.find(ball => ball.isCue);
    }

    public resetGame(): void {
        this.gameState = createInitialState();
        this.resetCueState();
        this.lastShotTime = 0;
        this.accumulator = 0;
    }

    public destroy(): void {
        this.canvas.removeEventListener('mousedown', this.handleMouseDown as EventListener);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove as EventListener);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp as EventListener);
        this.canvas.removeEventListener('mouseleave', this.handleMouseLeave as EventListener);

        this.canvas.removeEventListener('touchstart', this.handleTouchStart as EventListener);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove as EventListener);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd as EventListener);

        window.removeEventListener('keydown', this.handleKeyPress as EventListener);
        window.removeEventListener('resize', this.handleResize);

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = undefined;
        }

        this.resetGame();
    }
}
