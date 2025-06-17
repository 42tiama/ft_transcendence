import { GameConfig } from '../types.js';

export class Renderer {
    private context: CanvasRenderingContext2D;
    private config: GameConfig;

    constructor(context: CanvasRenderingContext2D, config: GameConfig) {
        this.context = context;
        this.config = config;
    }

    clear(): void {
        this.context.clearRect(0, 0, this.config.boardWidth, this.config.boardHeight);
    }

    drawScore(player1Score: number, player2Score: number): void {
        this.context.fillStyle = "white";
        this.context.font = "45px sans-serif";
        this.context.fillText(
            player1Score.toString(), 
            this.config.boardWidth / 5, 
            45
        );
        this.context.fillText(
            player2Score.toString(), 
            this.config.boardWidth * 4 / 5 - 45, 
            45
        );
    }

    drawCenterLine(): void {
        this.context.fillStyle = "white";
        for (let i = 10; i < this.config.boardHeight; i += 25) {
            this.context.fillRect(
                this.config.boardWidth / 2 - 10, 
                i, 
                5, 
                5
            );
        }
    }
}