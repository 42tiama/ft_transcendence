import { Ball as BallInterface, GameConfig } from '../types.js';

export class Ball implements BallInterface {
    x: number;
    y: number;
    width: number;
    height: number;
    velocityX: number;
    velocityY: number;

    constructor(config: GameConfig) {
        this.x = config.boardWidth / 2;
        this.y = config.boardHeight / 2;
        this.width = config.ballWidth;
        this.height = config.ballHeight;
        this.velocityX = Math.random() < 0.5 ? config.ballVelocity : -config.ballVelocity;
        this.velocityY = config.ballVelocity;
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

    bounceHorizontal(): void {
        this.velocityX *= -1;
    }

    reset(direction: number, config: GameConfig): void {
        this.x = config.boardWidth / 2;
        this.y = config.boardHeight / 2;
        this.velocityX = Math.random() < 0.5 ? config.ballVelocity : -config.ballVelocity;
        this.velocityY = 0;
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