// src/game/render.ts
import { GameState, TableDimensions, Ball } from './types';

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private dimensions: TableDimensions;

    constructor(ctx: CanvasRenderingContext2D, dimensions: TableDimensions) {
        this.ctx = ctx;
        this.dimensions = dimensions;
    }

    // Render the complete game state
    public render(gameState: GameState): void {
        this.clearCanvas();
        this.renderTable();
        this.renderPockets();
        this.renderBalls(gameState.balls);
        this.renderCue(gameState);
    }

    // Clear the canvas
    private clearCanvas(): void {
        this.ctx.clearRect(0, 0, this.dimensions.width, this.dimensions.height);
    }

    // Render the pool table, including background and cushions
    private renderTable(): void {
        this.ctx.fillStyle = '#2a9d8f'; // Green felt color
        this.ctx.fillRect(0, 0, this.dimensions.width, this.dimensions.height);

        // Draw cushions
        const cushionWidth = this.dimensions.cushionWidth;
        this.ctx.fillStyle = '#264653'; // Darker color for cushions
        this.ctx.fillRect(0, 0, this.dimensions.width, cushionWidth); // Top cushion
        this.ctx.fillRect(0, this.dimensions.height - cushionWidth, this.dimensions.width, cushionWidth); // Bottom cushion
        this.ctx.fillRect(0, 0, cushionWidth, this.dimensions.height); // Left cushion
        this.ctx.fillRect(this.dimensions.width - cushionWidth, 0, cushionWidth, this.dimensions.height); // Right cushion
    }

    // Render the pockets
    private renderPockets(): void {
        const pocketRadius = this.dimensions.pocketRadius;
        const pocketPositions = [
            { x: 0, y: 0 }, // Top-left
            { x: this.dimensions.width / 2, y: 0 }, // Top-center
            { x: this.dimensions.width, y: 0 }, // Top-right
            { x: 0, y: this.dimensions.height }, // Bottom-left
            { x: this.dimensions.width / 2, y: this.dimensions.height }, // Bottom-center
            { x: this.dimensions.width, y: this.dimensions.height } // Bottom-right
        ];

        this.ctx.fillStyle = '#000000'; // Black color for pockets
        pocketPositions.forEach(position => {
            this.ctx.beginPath();
            this.ctx.arc(position.x, position.y, pocketRadius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    // Render each ball in the game
    private renderBalls(balls: Ball[]): void {
        balls.forEach(ball => {
            if (!ball.isPocketed) {
                this.renderBall(ball);
            }
        });
    }

    // Render a single ball with color, outline, and position
    private renderBall(ball: Ball): void {
        const { x, y } = ball.position;
        const radius = ball.radius;

        // Draw the main circle for the ball
        this.ctx.fillStyle = ball.color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw an outline if specified
        if (ball.outlineColor) {
            this.ctx.strokeStyle = ball.outlineColor;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        // Draw the ball number if applicable (not the cue ball)
        if (!ball.isCue) {
            this.ctx.fillStyle = '#ffffff'; // White color for the number text
            this.ctx.font = `${radius}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(ball.number.toString(), x, y);
        }
    }

    // Render the cue (aim indicator)
    private renderCue(gameState: GameState): void {
        if (gameState.isShooting) {
            const cueBall = gameState.balls.find(ball => ball.isCue && !ball.isPocketed);
            if (!cueBall) return;

            const cueAngle = gameState.cueAngle;
            const cuePower = gameState.cuePower;
            const maxCueLength = 150;
            const cueLength = cuePower * maxCueLength;

            // Calculate cue end point based on angle and power
            const endX = cueBall.position.x + Math.cos(cueAngle) * cueLength;
            const endY = cueBall.position.y + Math.sin(cueAngle) * cueLength;

            // Draw the cue line
            this.ctx.strokeStyle = '#b5651d'; // Brown color for the cue stick
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(cueBall.position.x, cueBall.position.y);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
    }
}
