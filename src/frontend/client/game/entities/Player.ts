import { Player as PlayerInterface, GameConfig } from '../types.js';
import User from './User.js';

export class Player implements PlayerInterface {
    x: number;
    y: number;
    width: number;
    height: number;
    velocityY: number;
    user: User | null;

    constructor(x: number, y: number, config: GameConfig) {
        this.x = x;
        this.y = y;
        this.width = config.playerWidth;
        this.height = config.playerHeight;
        this.velocityY = 0;
    }

    update(config: GameConfig): void {
        const nextY = this.y + this.velocityY;
        if (!this.isOutOfBounds(nextY, config)) {
            this.y = nextY;
        }
    }

    private isOutOfBounds(yPosition: number, config: GameConfig): boolean {
        return yPosition < 0 || yPosition + this.height > config.boardHeight;
    }

    draw(context: CanvasRenderingContext2D, color: string = "skyblue"): void {
        context.fillStyle = color;
        context.fillRect(this.x, this.y, this.width, this.height);
    }

    setVelocity(velocity: number): void {
        this.velocityY = velocity;
    }
}