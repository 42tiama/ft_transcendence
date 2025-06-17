// Ball.ts - Enhanced with authentic Pong physics
import { Ball as BallInterface, GameConfig } from './types';

export class Ball implements BallInterface {
    x: number;
    y: number;
    width: number;
    height: number;
    velocityX: number;
    velocityY: number;
    private readonly baseSpeed: number = 3; // Base speed for calculations

    constructor(config: GameConfig) {
        this.x = config.boardWidth / 2;
        this.y = config.boardHeight / 2;
        this.width = config.ballWidth;
        this.height = config.ballHeight;
        this.velocityX = this.baseSpeed;
        this.velocityY = 2;
    }

    update(): void {
        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    draw(context: CanvasRenderingContext2D): void {
        context.fillStyle = "white";
        context.fillRect(this.x, this.y, this.width, this.height);
    }

    bounceVertical(): void {
        this.velocityY *= -1;
    }

    // This is the key method - authentic Pong paddle bounce
    bounceOffPaddle(paddle: { x: number; y: number; width: number; height: number }): void {
        // 1. Calculate where ball hit the paddle (0 = top, 1 = bottom)
        const ballCenterY = this.y + this.height / 2;
        const paddleCenterY = paddle.y + paddle.height / 2;
        const paddleTop = paddle.y;
        const paddleBottom = paddle.y + paddle.height;

        // Normalize hit position: -1 = top of paddle, 0 = center, +1 = bottom
        const hitPosition = (ballCenterY - paddleCenterY) / (paddle.height / 2);

        // 2. Clamp hit position to prevent extreme angles
        const clampedHitPosition = Math.max(-1, Math.min(1, hitPosition));

        // 3. Calculate new angle based on hit position
        // Maximum angle is about 60 degrees (π/3 radians)
        const maxAngle = Math.PI / 3; // 60 degrees
        const bounceAngle = clampedHitPosition * maxAngle;

        // 4. Calculate new velocity components
        // Maintain consistent speed but change direction
        const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        
        // Determine horizontal direction (opposite of current)
        const newDirectionX = this.velocityX > 0 ? -1 : 1;
        
        // Apply the bounce angle
        this.velocityX = newDirectionX * speed * Math.cos(bounceAngle);
        this.velocityY = speed * Math.sin(bounceAngle);

        // 5. Add slight speed increase (optional - classic Pong feature)
        const speedIncrease = 1.05; // 5% speed increase
        this.velocityX *= speedIncrease;
        this.velocityY *= speedIncrease;

        // 6. Ensure minimum horizontal speed (prevent getting stuck)
        const minHorizontalSpeed = 2;
        if (Math.abs(this.velocityX) < minHorizontalSpeed) {
            this.velocityX = newDirectionX * minHorizontalSpeed;
        }
    }

    // Alternative simpler version (easier to understand)
    bounceOffPaddleSimple(paddle: { x: number; y: number; width: number; height: number }): void {
        // Calculate where the ball hit (as percentage from top of paddle)
        const ballCenterY = this.y + this.height / 2;
        const paddleTop = paddle.y;
        const paddleHeight = paddle.height;
        
        // hitFactor ranges from -1 (top) to +1 (bottom)
        const relativeIntersectY = ballCenterY - (paddleTop + paddleHeight / 2);
        const normalizedIntersectY = relativeIntersectY / (paddleHeight / 2);
        
        // Clamp to prevent extreme angles
        const hitFactor = Math.max(-0.8, Math.min(0.8, normalizedIntersectY));
        
        // Reverse horizontal direction
        this.velocityX = -this.velocityX;
        
        // Set vertical velocity based on hit position
        this.velocityY = hitFactor * 5; // 5 is max vertical speed
        
        // Optional: Increase speed slightly
        this.velocityX *= 1.02;
    }

    reset(direction: number, config: GameConfig): void {
        this.x = config.boardWidth / 2;
        this.y = config.boardHeight / 2;
        this.velocityX = direction * this.baseSpeed;
        this.velocityY = Math.random() < 0.5 ? 2 : -2; // Random Y direction
    }

    isOutOfBoundsVertical(config: GameConfig): boolean {
        return this.y <= 0 || this.y + this.height >= config.boardHeight;
    }

    isOutOfBoundsLeft(): boolean {
        return this.x < 0;
    }

    isOutOfBoundsRight(config: GameConfig): boolean {
        return this.x + this.width > config.boardWidth;
    }
}

// CollisionDetector.ts - Updated to use new bounce physics
import { Player } from './Player';
import { Ball } from './Ball';

export class CollisionDetector {
    static detect(ball: Ball, player: Player): boolean {
        return ball.x < player.x + player.width &&
               ball.x + ball.width > player.x &&
               ball.y < player.y + player.height &&
               ball.y + ball.height > player.y;
    }

    static handlePlayerCollision(ball: Ball, player1: Player, player2: Player): void {
        if (this.detect(ball, player1)) {
            if (ball.x <= player1.x + player1.width) {
                // Use the new authentic bounce physics
                ball.bounceOffPaddle(player1);
            }
        } else if (this.detect(ball, player2)) {
            if (ball.x + ball.width >= player2.x) {
                // Use the new authentic bounce physics
                ball.bounceOffPaddle(player2);
            }
        }
    }
}

// Example usage showing the difference:

/* 
COMPARISON OF BOUNCE BEHAVIORS:

1. OLD METHOD (your current code):
   - Ball hits anywhere on paddle → always bounces at same angle
   - Velocity simply reversed: velocityX *= -1
   - Result: predictable, boring gameplay

2. NEW METHOD (authentic Pong):
   - Ball hits top of paddle → bounces upward
   - Ball hits center of paddle → bounces straight
   - Ball hits bottom of paddle → bounces downward
   - Hit position determines bounce angle
   - Result: strategic, engaging gameplay

VISUAL REPRESENTATION:

Paddle:  ║ ← Ball hits here (top)    → Ball bounces ↗
         ║ ← Ball hits here (center) → Ball bounces →
         ║ ← Ball hits here (bottom) → Ball bounces ↘

MATH BREAKDOWN:
1. Find where ball hit paddle (0-1 scale)
2. Convert to angle (-60° to +60°)
3. Apply trigonometry to get new velocity
4. Maintain speed but change direction
5. Optional: increase speed slightly

*/