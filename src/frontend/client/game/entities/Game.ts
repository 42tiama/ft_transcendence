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

export default class Game {
    private gameContext: TiamaPong;
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
    
    constructor(game: TiamaPong, canvasId: string) {
        this.gameContext = game;
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
    
    public createTournament(participants: User[]) {
        let size: number = this.gameContext.tournamentHistory.push(new TiamaTournament(this.gameContext));
        this.gameContext.tournamentHistory[size - 1].tournamentId = (size - 1).toString();
        this.gameContext.tournamentHistory[size - 1].debugPrintRoundArray();
        this.runTournament(this.gameContext.tournamentHistory[size - 1]);
    }
    
    private runTournament(tournament: TiamaTournament) {
        // while(tournament.totalRounds != 0) {
        //     if (tournament.currentRound.length == 1) {
        //         this.matchTitle = 'FINAL';
        //     } else if (tournament.currentRound.length == 2) {
        //         this.matchTitle = 'SEMI-FINALS';
        //     }
        //     for (let i : number = 0; i < tournament.currentRound.length; i++) {
        //         await this.startMatch(tournament.currentRound[i]);
        //     }
        //     tournament.currentRound = tournament.createNextRound(tournament.currentRound) // pega os vencedores do round corrente antes de reduzir o numero de rounds
        //     tournament.totalRounds--;
        // }
        // tournament.tournamentFinished = true;
    }

    private createVersusMatch(participants: User[]) {
        // let size: number = this.versusMatchHistory.push(new TiamaMatch(this, 'versus', participants[0], participants[1], null);
        // this.versusMatchHistory[size - 1].matchId = (size - 1).toString();
    }

    public async startMatch(match : Match) {
        this.player1.user = match.player1;
        this.player2.user = match.player2;
        await this.startGame();
    }

    public async startGame() {
        this.isGameRunning = true;
        this.gameLoop();
    }

    public endGame(): void {
        this.isGameRunning = false;
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    private gameLoop(): void {
        this.animationId = requestAnimationFrame(() => this.gameLoop());

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
        
        if (this.player1Score - this.player2Score > 3 || this.player2Score - this.player1Score > 3) {
            this.endGame();
            
            return; // Exit the game loop
        }

        // Draw everything
        this.player1.draw(this.context);
        this.player2.draw(this.context);
        this.ball.draw(this.context);
        this.renderer.drawScore(this.player1Score, this.player2Score);
        this.renderer.drawCenterLine();
    }
}