// src/game/physics.ts
import {
  Ball,
  Vector2D,
  TableDimensions,
  FRICTION,
  MIN_SPEED,
  CUSHION_RESTITUTION,
  BALL_RESTITUTION,
} from './types';

export class Physics {
  private dimensions: TableDimensions;
  private readonly MAX_VELOCITY = 20;
  private collisionEvents: Set<string> = new Set();

  constructor(dimensions: TableDimensions) {
    this.dimensions = dimensions;
  }

  public updateBalls(balls: Ball[]): boolean {
    let anyBallMoving = false;
    this.collisionEvents.clear();

    // Update all balls
    for (const ball of balls) {
      if (!ball.isPocketed) {
        this.updateBallPhysics(ball);
        if (this.isBallMoving(ball)) {
          anyBallMoving = true;
        }
      }
    }

    // Handle collisions after updating positions
    this.handleCollisions(balls);

    return anyBallMoving;
  }

  public applyShot(cueBall: Ball, angle: number, power: number): void {
    const velocity = power * this.MAX_VELOCITY;
    cueBall.velocity = {
      x: Math.cos(angle) * velocity,
      y: Math.sin(angle) * velocity,
    };
    cueBall.velocity = this.clampVelocity(cueBall.velocity);
  }

  private updateBallPhysics(ball: Ball): void {
    if (ball.isPocketed) return;

    // Update position
    ball.position = this.addVectors(ball.position, ball.velocity);

    // Apply friction
    ball.velocity = this.multiplyVector(ball.velocity, FRICTION);

    // Stop balls below minimum speed
    if (this.getVectorMagnitude(ball.velocity) < MIN_SPEED) {
      ball.velocity = { x: 0, y: 0 };
    }

    // Handle cushion collisions
    this.handleCushionCollision(ball);
  }

  private handleCollisions(balls: Ball[]): void {
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        if (!balls[i].isPocketed && !balls[j].isPocketed) {
          this.handleBallCollision(balls[i], balls[j]);
        }
      }
    }
  }

  private handleCushionCollision(ball: Ball): void {
    const { cushionWidth, width, height } = this.dimensions;

    // Calculate effective boundaries
    const minX = cushionWidth + ball.radius;
    const maxX = width - cushionWidth - ball.radius;
    const minY = cushionWidth + ball.radius;
    const maxY = height - cushionWidth - ball.radius;

    let newVelocity: Vector2D = { ...ball.velocity };
    let newPosition: Vector2D = { ...ball.position };

    // Handle x-axis collisions
    if (ball.position.x < minX) {
      newPosition.x = minX;
      newVelocity.x = -ball.velocity.x * CUSHION_RESTITUTION;
    } else if (ball.position.x > maxX) {
      newPosition.x = maxX;
      newVelocity.x = -ball.velocity.x * CUSHION_RESTITUTION;
    }

    // Handle y-axis collisions
    if (ball.position.y < minY) {
      newPosition.y = minY;
      newVelocity.y = -ball.velocity.y * CUSHION_RESTITUTION;
    } else if (ball.position.y > maxY) {
      newPosition.y = maxY;
      newVelocity.y = -ball.velocity.y * CUSHION_RESTITUTION;
    }

    // Update ball state
    ball.position = newPosition;
    ball.velocity = this.clampVelocity(newVelocity);
  }

  private handleBallCollision(ball1: Ball, ball2: Ball): void {
    // Create unique collision ID to prevent double handling
    const collisionId = this.getCollisionId(ball1, ball2);
    if (this.collisionEvents.has(collisionId)) return;

    const collisionVector = this.subtractVectors(
      ball2.position,
      ball1.position
    );
    const distance = this.getVectorMagnitude(collisionVector);

    if (distance < ball1.radius + ball2.radius) {
      const normalVector = this.normalizeVector(collisionVector);
      const relativeVelocity = this.subtractVectors(
        ball1.velocity,
        ball2.velocity
      );
      const velocityAlongNormal = this.dotProduct(
        relativeVelocity,
        normalVector
      );

      // Only resolve if balls are moving towards each other
      if (velocityAlongNormal > 0) return;

      // Calculate impulse
      const restitution = BALL_RESTITUTION;
      const impulseStrength = -(1 + restitution) * velocityAlongNormal;
      const impulse = this.multiplyVector(normalVector, impulseStrength);

      // Apply impulse
      ball1.velocity = this.subtractVectors(ball1.velocity, impulse);
      ball2.velocity = this.addVectors(ball2.velocity, impulse);

      // Prevent ball overlap
      const overlap = (ball1.radius + ball2.radius - distance) / 2;
      const separationVector = this.multiplyVector(normalVector, overlap);

      ball1.position = this.subtractVectors(ball1.position, separationVector);
      ball2.position = this.addVectors(ball2.position, separationVector);

      // Record collision
      this.collisionEvents.add(collisionId);

      // Clamp velocities
      ball1.velocity = this.clampVelocity(ball1.velocity);
      ball2.velocity = this.clampVelocity(ball2.velocity);
    }
  }

  // Vector Operations
  private normalizeVector(vector: Vector2D): Vector2D {
    const magnitude = this.getVectorMagnitude(vector);
    if (magnitude === 0) return { x: 0, y: 0 };
    return {
      x: vector.x / magnitude,
      y: vector.y / magnitude,
    };
  }

  private getVectorMagnitude(vector: Vector2D): number {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  }

  private addVectors(v1: Vector2D, v2: Vector2D): Vector2D {
    return {
      x: v1.x + v2.x,
      y: v1.y + v2.y,
    };
  }

  private subtractVectors(v1: Vector2D, v2: Vector2D): Vector2D {
    return {
      x: v1.x - v2.x,
      y: v1.y - v2.y,
    };
  }

  private multiplyVector(vector: Vector2D, scalar: number): Vector2D {
    return {
      x: vector.x * scalar,
      y: vector.y * scalar,
    };
  }

  private dotProduct(v1: Vector2D, v2: Vector2D): number {
    return v1.x * v2.x + v1.y * v2.y;
  }

  private clampVelocity(velocity: Vector2D): Vector2D {
    const magnitude = this.getVectorMagnitude(velocity);
    if (magnitude > this.MAX_VELOCITY) {
      const scale = this.MAX_VELOCITY / magnitude;
      return this.multiplyVector(velocity, scale);
    }
    return velocity;
  }

  // Utility Methods
  private getCollisionId(ball1: Ball, ball2: Ball): string {
    return `${Math.min(ball1.id, ball2.id)}-${Math.max(ball1.id, ball2.id)}`;
  }

  private isBallMoving(ball: Ball): boolean {
    return this.getVectorMagnitude(ball.velocity) > MIN_SPEED;
  }

  public reset(): void {
    this.collisionEvents.clear();
  }
}
