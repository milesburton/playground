// physics.ts
import { Ball, Vector2D, TableDimensions } from './types';
import { MIN_SPEED } from './constants';

export class Physics {
    private dimensions: TableDimensions;

    constructor(dimensions: TableDimensions) {
        this.dimensions = dimensions;
    }

    /**
     * Update the positions and velocities of all balls based on deltaTime.
     * @param balls - Array of balls to update
     * @param deltaTime - Time in seconds since the last update
     * @returns Whether any ball is still moving
     */
    public updateBalls(balls: Ball[], deltaTime: number): boolean {
        let anyMoving = false;

        balls.forEach(ball => {
            if (ball.isPocketed) return;

            // Update position based on velocity and deltaTime
            ball.position.x += ball.velocity.x * deltaTime;
            ball.position.y += ball.velocity.y * deltaTime;

            // Apply friction or other deceleration factors
            this.applyFriction(ball, deltaTime);

            // Handle collisions with the table boundaries
            this.handleTableCollisions(ball);

            // Check if the ball is moving above the minimum speed threshold
            if (Math.abs(ball.velocity.x) > MIN_SPEED || Math.abs(ball.velocity.y) > MIN_SPEED) {
                anyMoving = true;
            } else {
                // Stop the ball if it's below the minimum speed threshold
                ball.velocity.x = 0;
                ball.velocity.y = 0;
            }
        });

        return anyMoving;
    }

    /**
     * Apply friction to slow down the ball's velocity over time.
     * @param ball - The ball to apply friction to
     * @param deltaTime - Time in seconds since the last update
     */
    private applyFriction(ball: Ball, deltaTime: number): void {
        const frictionCoefficient = 0.99; // Friction factor per second
        const friction = Math.pow(frictionCoefficient, deltaTime); // Frame-rate independent friction

        ball.velocity.x *= friction;
        ball.velocity.y *= friction;
    }

    /**
     * Handle collisions of a ball with the table boundaries.
     * Reverses the ball's velocity when it collides with a wall.
     * @param ball - The ball to check for boundary collisions
     */
    private handleTableCollisions(ball: Ball): void {
        const { width, height } = this.dimensions;

        // Left and right boundary collision
        if (ball.position.x <= ball.radius || ball.position.x >= width - ball.radius) {
            ball.velocity.x *= -1; // Reverse x velocity
            ball.position.x = Math.max(ball.radius, Math.min(ball.position.x, width - ball.radius));
        }

        // Top and bottom boundary collision
        if (ball.position.y <= ball.radius || ball.position.y >= height - ball.radius) {
            ball.velocity.y *= -1; // Reverse y velocity
            ball.position.y = Math.max(ball.radius, Math.min(ball.position.y, height - ball.radius));
        }
    }

    /**
     * Calculates the distance between two points in 2D space.
     * @param point1 - The first point
     * @param point2 - The second point
     * @returns The distance between the two points
     */
    public static calculateDistance(point1: Vector2D, point2: Vector2D): number {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Checks if two balls are colliding based on their positions and radii.
     * @param ball1 - The first ball
     * @param ball2 - The second ball
     * @returns True if the balls are colliding, otherwise false
     */
    public static areBallsColliding(ball1: Ball, ball2: Ball): boolean {
        const distance = Physics.calculateDistance(ball1.position, ball2.position);
        return distance < ball1.radius + ball2.radius;
    }

    /**
     * Resolves a collision between two balls by updating their velocities based on an elastic collision model.
     * @param ball1 - The first ball
     * @param ball2 - The second ball
     */
    public static resolveBallCollision(ball1: Ball, ball2: Ball): void {
        // Calculate the normal vector between the balls
        const normal = {
            x: ball2.position.x - ball1.position.x,
            y: ball2.position.y - ball1.position.y
        };
        const distance = Physics.calculateDistance(ball1.position, ball2.position);

        if (distance === 0) return; // Prevent division by zero

        // Normalize the normal vector
        normal.x /= distance;
        normal.y /= distance;

        // Relative velocity along the normal
        const relativeVelocity = {
            x: ball2.velocity.x - ball1.velocity.x,
            y: ball2.velocity.y - ball1.velocity.y
        };
        const velocityAlongNormal = relativeVelocity.x * normal.x + relativeVelocity.y * normal.y;

        // If the balls are moving apart, no need to resolve
        if (velocityAlongNormal > 0) return;

        // Calculate the impulse scalar
        const restitution = 1.0; // Elastic collision
        const impulse = -(1 + restitution) * velocityAlongNormal;

        // Apply the impulse to both balls
        ball1.velocity.x -= impulse * normal.x;
        ball1.velocity.y -= impulse * normal.y;
        ball2.velocity.x += impulse * normal.x;
        ball2.velocity.y += impulse * normal.y;
    }
}
