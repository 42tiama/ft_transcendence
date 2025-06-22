import { Player } from './Player.js';
import { Ball } from './Ball.js';
import User  from './User.js';
import { CollisionDetector } from '../services/CollisionDetector.js';
import { InputHandler } from '../services/InputHandler.js';
import { Renderer } from '../services/Renderer.js';
import { gameConfig } from '../gameConfig.js';
import { Match, Tournament } from 'game/types.js';
import TiamaTournament from './Tournament.js';
import TiamaMatch from './Match.js';
import TiamaPong from './TiamaPong.js';
import { resolve } from 'path';

export default class Game {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private player1: Player;
    private player2: Player;
    private ball: Ball;
    private inputHandler: InputHandler;
    private renderer: Renderer;
    private player1Score: number = 0;
    private player2Score: number = 0;
    private animationId: number | null = null;
    private isGameRunning: boolean = true;
    private matchTitle: string | null = null;
        private updatePlayer2: (config: typeof gameConfig) => void;

    constructor(currentMatch: TiamaMatch, canvasId: string) {
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
        // Initialize ball
        this.ball = new Ball(gameConfig);

        // Initialize players
        this.player1 = new Player(gameConfig.playerWidth, gameConfig.boardHeight / 2, gameConfig, this.ball);
        this.player2 = new Player(
            gameConfig.boardWidth - gameConfig.playerWidth - 10,
            gameConfig.boardHeight / 2,
            gameConfig, this.ball);

        const currentRoute = window.location.pathname;
    
        if (currentRoute === "/game") {
            this.inputHandler = new InputHandler(this.player1, this.player2);
            this.updatePlayer2 = (config) => this.player2.update(config);
        } else {
            this.inputHandler = new InputHandler(this.player1);
            this.updatePlayer2 = (config) => this.player2.aiMode(config);
        }

        // Initialize renderer
        this.renderer = new Renderer(this.context, gameConfig);
    }
    
    // start(match : TiamaMatch): void {
    //     this.gameLoop(match);
    // }

    private createVersusMatch(participants: User[]) {
        // let size: number = this.versusMatchHistory.push(new TiamaMatch(this, 'versus', participants[0], participants[1], null);
        // this.versusMatchHistory[size - 1].matchId = (size - 1).toString();
    }

    public async startMatch(match : TiamaMatch): Promise<void> {
        this.player1.user = match.player1;
        this.player2.user = match.player2;
        this.isGameRunning = true;
        return new Promise<void>((resolve) => {
            this.gameLoop(match, resolve);
        })
    }

    public endGame(): void {
        this.isGameRunning = false;
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    private gameLoop(match : TiamaMatch, resolve: (()=> void)) {
        this.animationId = requestAnimationFrame(() => this.gameLoop(match, resolve));

        // Clear canvas
        this.renderer.clear();

        // Update players
        this.player1.update(gameConfig);
        this.updatePlayer2(gameConfig);

        // Update ball
        this.ball.update();

        // Handle ball collisions with walls
        if (this.ball.isOutOfBoundsVertical(gameConfig)) {
            CollisionDetector.handleWallCollision(this.ball, gameConfig);
        }

        // Handle ball collisions with players
        CollisionDetector.handlePlayerCollision(this.ball, this.player1, this.player2);

        // Check for scoring
        this.checkScore();

        // Draw everything
        this.drawGameElements();
    }
    
    private checkScore(): void {
        if (this.ball.isOutOfBoundsLeft()) {
            match.player2Score++;
            this.ball.reset(1, gameConfig);
        } else if (this.ball.isOutOfBoundsRight(gameConfig)) {
            match.player1Score++;
            this.ball.reset(-1, gameConfig);
        }
        
        if (match.player1Score - match.player2Score > 1 
            || match.player2Score - match.player1Score > 1)
        {
            match.winner =  match.player1Score > match.player2Score ? match.player1 : match.player2;
            this.endGame();
            resolve();
            return;
        }

    private drawGameElements(): void {
        this.player1.draw(this.context);
        this.player2.draw(this.context);
        this.ball.draw(this.context);
        this.renderer.drawScore(match.player1Score, match.player2Score);
        this.renderer.drawCenterLine();
    }

    setSelectedDifficulty(difficulty: number): void {
        if (this.player2) {
            this.player2.setDifficulty(difficulty);
        }
    }
}