import { Player as PlayerInterface, GameConfig, Ball as BallInterface } from '../types.js';

export class Player implements PlayerInterface {
    x: number;
    y: number;
    width: number;
    height: number;
    velocityY: number;
    private difficulty: number;
    private ball?: BallInterface;

    constructor(x: number, y: number, config: GameConfig, ballInfo?: BallInterface) {
        this.x = x;
        this.y = y;
        this.width = config.playerWidth;
        this.height = config.playerHeight;
        this.velocityY = 0;
        this.ball = ballInfo;
    }

    update(config: GameConfig): void {
        const nextY = this.y + this.velocityY;
        if (!this.isOutOfBounds(nextY, config)) {
            this.y = nextY;
        }
    }

    private isOutOfBounds(yPosition: number, config: GameConfig): boolean {
        return yPosition < 5 || yPosition + this.height > config.boardHeight - 5;
    }

    draw(context: CanvasRenderingContext2D, color: string = "skyblue"): void {
        context.fillStyle = color;
        context.fillRect(this.x, this.y, this.width, this.height);
    }

    setVelocity(velocity: number): void {
        this.velocityY = velocity;
    }

    aiMode(config: GameConfig): void {
        let limitX: number;

        if (this.x > config.boardWidth / 2) {
            limitX = config.boardWidth * this.difficulty;
            if (this.ball.x < limitX) {
                this.setVelocity(0);
                return;
            }
        } else {
            limitX = config.boardWidth * (1 - this.difficulty);
            if (this.ball.x > limitX) {
                this.setVelocity(0);
                return;
            }
        }

        const centerY = this.y + this.height / 2;
        if (this.ball.y < centerY - 2) {
            this.setVelocity(-config.playerSpeed);
        } else if (this.ball.y > centerY + 2) {
            this.setVelocity(config.playerSpeed);
        } else {
            this.setVelocity(0);
        }
        this.update(config);

    }

    setDifficulty(difficultyAi: number) {
        this.difficulty = difficultyAi;
    }
}