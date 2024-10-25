import { Ball, Vector2D, TableDimensions, FRICTION, MIN_SPEED, CUSHION_RESTITUTION, BALL_RESTITUTION } from './types';

export class Physics {
  private dimensions: TableDimensions;

  constructor(dimensions: TableDimensions) {
    this.dimensions = dimensions;
  }

  public applyShot(cueBall: Ball, angle: number, power: number): void {
    const maxSpeed = 15; // Maximum initial velocity
    const velocity = power * maxSpeed;

    cueBall.velocity = {
      x: Math.cos(angle) * velocity,
      y: Math.sin(angle) * velocity
    };
  }

  public updateBalls(balls: Ball[]): boolean {
    let anyBallMoving = false;

    // Update positions and apply friction
    balls.forEach(ball => {
      if (ball.isPocketed) return;

      // Update position
      ball.position.x += ball.velocity.x;
      ball.position.y += ball.velocity.y;

      // Apply friction
      ball.velocity.x *= FRICTION;
      ball.velocity.y *= FRICTION;

      // Stop balls with very low speed
      if (Math.abs(ball.velocity.x) < MIN_SPEED && Math.abs(ball.velocity.y) < MIN_SPEED) {
        ball.velocity.x = 0;
        ball.velocity.y = 0;
      }

      // Check if any ball is still moving
      if (Math.abs(ball.velocity.x) > MIN_SPEED || Math.abs(ball.velocity.y) > MIN_SPEED) {
        anyBallMoving = true;
      }
    });

    // Check for collisions
    this.handleCollisions(balls);

    return anyBallMoving;
  }

  private handleCollisions(balls: Ball[]): void {
    // Ball-to-ball collisions
    for (let i = 0; i < balls.length; i++) {
      const ball1 = balls[i];
      if (ball1.isPocketed) continue;

      // Check cushion collisions for current ball
      this.handleCushionCollision(ball1);

      // Check collisions with other balls
      for (let j = i + 1; j < balls.length; j++) {
        const ball2 = balls[j];
        if (ball2.isPocketed) continue;

        this.handleBallCollision(ball1, ball2);
      }
    }
  }

  private handleCushionCollision(ball: Ball): void {
    const { cushionWidth, width, height } = this.dimensions;

    // Left cushion
    if (ball.position.x - ball.radius < cushionWidth) {
      ball.position.x = cushionWidth + ball.radius;
      ball.velocity.x = -ball.velocity.x * CUSHION_RESTITUTION;
    }
    // Right cushion
    else if (ball.position.x + ball.radius > width - cushionWidth) {
      ball.position.x = width - cushionWidth - ball.radius;
      ball.velocity.x = -ball.velocity.x * CUSHION_RESTITUTION;
    }

    // Top cushion
    if (ball.position.y - ball.radius < cushionWidth) {
      ball.position.y = cushionWidth + ball.radius;
      ball.velocity.y = -ball.velocity.y * CUSHION_RESTITUTION;
    }
    // Bottom cushion
    else if (ball.position.y + ball.radius > height - cushionWidth) {
      ball.position.y = height - cushionWidth - ball.radius;
      ball.velocity.y = -ball.velocity.y * CUSHION_RESTITUTION;
    }
  }

  private handleBallCollision(ball1: Ball, ball2: Ball): void {
    const dx = ball2.position.x - ball1.position.x;
    const dy = ball2.position.y - ball1.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if balls are colliding
    if (distance < ball1.radius + ball2.radius) {
      // Calculate collision normal
      const nx = dx / distance;
      const ny = dy / distance;

      // Calculate relative velocity
      const vx = ball1.velocity.x - ball2.velocity.x;
      const vy = ball1.velocity.y - ball2.velocity.y;
      const velocityAlongNormal = vx * nx + vy * ny;

      // Don't process collision if balls are moving apart
      if (velocityAlongNormal > 0) return;

      // Calculate collision impulse
      const restitution = BALL_RESTITUTION;
      const j = -(1 + restitution) * velocityAlongNormal;
      const impulseX = j * nx;
      const impulseY = j * ny;

      // Apply impulse to both balls
      ball1.velocity.x -= impulseX;
      ball1.velocity.y -= impulseY;
      ball2.velocity.x += impulseX;
      ball2.velocity.y += impulseY;

      // Separate balls to prevent sticking
      const overlap = (ball1.radius + ball2.radius - distance) / 2;
      ball1.position.x -= overlap * nx;
      ball1.position.y -= overlap * ny;
      ball2.position.x += overlap * nx;
      ball2.position.y += overlap * ny;
    }
  }
}