import { Player } from './Player.js';
import { Ball } from './Ball.js';
import { CollisionDetector } from '../services/CollisionDetector.js';
import { InputHandler } from '../services/InputHandler.js';
import { Renderer } from '../services/Renderer.js';
import { gameConfig } from '../gameConfig.js';
import { Tournament } from 'game/types.js';

export class Game {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private tournamentHistory: Tournament;
    private player1: Player;
    private player2: Player;
    private ball: Ball;
    private inputHandler: InputHandler;
    private renderer: Renderer;
    private player1Score: number = 0;
    private player2Score: number = 0;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error(`Canvas with id "${canvasId}" not found`);
        }

        this.canvas.width = gameConfig.boardWidth;
        this.canvas.height = gameConfig.boardHeight;
        
        const context = this.canvas.getContext("2d");
        if (!context) {
            throw new Error("Could not get 2D context from canvas");
        }
        this.context = context;

        this.initializeGame();
    }

    private initializeGame(): void {
        // Initialize players
        this.player1 = new Player(10, gameConfig.boardHeight / 2, gameConfig);
        this.player2 = new Player(
            gameConfig.boardWidth - gameConfig.playerWidth - 10,
            gameConfig.boardHeight / 2,
            gameConfig
        );

        // Initialize ball
        this.ball = new Ball(gameConfig);

        // Initialize input handler
        this.inputHandler = new InputHandler(this.player1, this.player2);

        // Initialize renderer
        this.renderer = new Renderer(this.context, gameConfig);
    }

    start(): void {
        this.gameLoop();
    }

    private gameLoop(): void {
        requestAnimationFrame(() => this.gameLoop());

        // Clear canvas
        this.renderer.clear();

        // Update players
        this.player1.update(gameConfig);
        this.player2.update(gameConfig);

        // Update ball
        this.ball.update();

        // Handle ball collisions with walls
        if (this.ball.isOutOfBoundsVertical(gameConfig)) {
            this.ball.bounceVertical();
        }

        // Handle ball collisions with players
        CollisionDetector.handlePlayerCollision(this.ball, this.player1, this.player2);

        // Check for scoring
        if (this.ball.isOutOfBoundsLeft()) {
            this.player2Score++;
            this.ball.reset(1, gameConfig);
        } else if (this.ball.isOutOfBoundsRight(gameConfig)) {
            this.player1Score++;
            this.ball.reset(-1, gameConfig);
        }

        // Draw everything
        this.player1.draw(this.context);
        this.player2.draw(this.context);
        this.ball.draw(this.context);
        this.renderer.drawScore(this.player1Score, this.player2Score);
        this.renderer.drawCenterLine();
    }
}