import { Player as PlayerInterface, GameConfig, Ball as BallInterface, Position, Velocity } from '../types.js';

export class Player implements PlayerInterface {
    x: number;
    y: number;
    width: number;
    height: number;
    velocityY: number;
    private difficulty: number;
    private ball?: BallInterface;
    private lastDecisionTime: number = 0;
    private lastBallPosition: Position = { x: 0, y: 0 };
    private lastBallVelocity: Velocity = {velocityX: 0, velocityY: 0};

    constructor(x: number, y: number, config: GameConfig, ballInfo?: BallInterface) {
        this.x = x;
        this.y = y;
        this.width = config.playerWidth;
        this.height = config.playerHeight;
        this.velocityY = 0;
        this.ball = ballInfo;
        this.lastBallPosition = { x: ballInfo?.x || 0, y: ballInfo?.y || 0 };
        this.lastBallVelocity = { velocityX: ballInfo.velocityX, velocityY: ballInfo.velocityY };
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

    private predictBallYAt(config: GameConfig,): number {
        let simX = this.lastBallPosition.x;
        let simY = this.lastBallPosition.y;
        let simVX = this.lastBallVelocity.velocityX;
        let simVY = this.lastBallVelocity.velocityY;

        while (((simVX > 0 && simX < this.x) || (simVX < 0 && simX > this.x))) {
            simX += simVX;
            simY += simVY;

            if (simY <= 5) {
                simY = 0;
                simVY = -simVY;
            } else if (simY >= config.boardHeight + 5) {
                simY = config.boardHeight;
                simVY = -simVY;
            }
        }
        return simY;
    }

    private aiMove(config: GameConfig): void {
        let predictedY = this.predictBallYAt(config);
        let centerY = this.y + this.height / 2;

        if (predictedY < centerY - 5) {
            this.setVelocity(-config.playerSpeed);
        } else if (predictedY > centerY + 5) {
            this.setVelocity(config.playerSpeed);
        } else {
            this.setVelocity(0);
        }
    }

    private aiReactZone(config: GameConfig): void {
        let limitX: number;

        if (this.x > config.boardWidth / 2) {
            limitX = config.boardWidth * this.difficulty;
            if (this.ball.x < limitX) {
                this.setVelocity(0);
            } else {
                this.aiMove(config);
            }
        } else {
            limitX = config.boardWidth * (1 - this.difficulty);
            if (this.ball.x > limitX) {
                this.setVelocity(0);
            } else {
                this.aiMove(config);
            }
        }
    }

    private updateAIVision(): boolean {
        const now = Date.now();
        if (now - this.lastDecisionTime >= 1000) {
            this.lastDecisionTime = now;
            this.lastBallPosition = { x: this.ball.x, y: this.ball.y };
            this.lastBallVelocity = { velocityX: this.ball.velocityX, velocityY: this.ball.velocityY };
            return true;
        }
        return false;
    }

    aiMode(config: GameConfig): void {
        this.updateAIVision();
        this.aiReactZone(config);
        this.update(config);

    }

    setDifficulty(difficultyAi: number) {
        this.difficulty = difficultyAi;
    }
}