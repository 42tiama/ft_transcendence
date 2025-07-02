import { Player } from './Player.js';
import { Ball } from './Ball.js';
import User  from './User.js';
import { CollisionDetector } from '../services/CollisionDetector.js';
import { InputHandler } from '../services/InputHandler.js';
import { Renderer } from '../services/Renderer.js';
import { gameConfig } from '../gameConfig.js';
import TiamaMatch from './Match.js';
import MatchService from '../../services/MatchService.js';
import { MatchData } from '../../services/types.js';
import PlayerService from '../../services/PlayerService.js';

export default class Game {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private player1: Player;
    private player2: Player;
    private ball: Ball;
    private inputHandler: InputHandler;
    private renderer: Renderer;
    private animationId: number | null = null;
    private isGameRunning: boolean = true;
    private updatePlayer2: (config: typeof gameConfig) => void;
    public  match: TiamaMatch;

    constructor(currentMatch: TiamaMatch, canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error(`Canvas with id "${canvasId}" not found`);
        }

        this.match = currentMatch;
        this.canvas.width = gameConfig.boardWidth;
        this.canvas.height = gameConfig.boardHeight;
        this.ball = new Ball(gameConfig);
        this.player1 = new Player(gameConfig.playerWidth, gameConfig.boardHeight / 2, gameConfig, this.ball);
        this.player2 = new Player(
        gameConfig.boardWidth - gameConfig.playerWidth - 10,
        gameConfig.boardHeight / 2,
        gameConfig, this.ball);
        this.inputHandler = new InputHandler(this.player1, this.player2);

        if (this.match.matchType === 'versus-ai') {
            this.updatePlayer2 = (config) => this.player2.aiMode(config);
        } else {
            this.updatePlayer2 = (config) => this.player2.update(config);
        }

        // this.inputHandler = new InputHandler(this.player1);

        const context = this.canvas.getContext("2d");
        if (!context) {
            throw new Error("Could not get 2D context from canvas");
        }
        this.context = context;

        this.renderer = new Renderer(this.context, gameConfig);
    }

    // start(match : TiamaMatch, resolve: (()=> void) | null): void {
    //     this.gameLoop(match, resolve);
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

    public cancelGame(): void {
        this.isGameRunning = false;
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    private async registerMatch(match: TiamaMatch): Promise<void> {
        if (this.match.matchType === 'versus-ai' || this.match.matchType === 'versus-player') {
            const matchPayload : MatchData = {
                matchType : this.match.matchType,
                tournamentId : null,
                player1 : this.match.player1.id,
                player2: this.match.matchType === 'versus-ai' ? null : this.match.player2!.id,
                player1Score : this.match.player1Score,
                player2Score : this.match.player2Score,
                winner : this.match.player1Score > this.match.player2Score ? this.match.player1.id : this.match.matchType === 'versus-ai' ? null : this.match.player2!.id
            };

            const match = new MatchService();
            const registred = await match.createMatch(matchPayload);

            if (registred !== null) {
                console.log(`Match registered successfully: ${JSON.stringify(matchPayload)}`);
                const gameService = new PlayerService();
                const points = matchPayload.player1Score > matchPayload.player2Score ? matchPayload.player1Score : matchPayload.player2Score;
                const loserId = matchPayload.player1Score < matchPayload.player2Score ? matchPayload.player1: (matchPayload.player2 ? matchPayload.player2 : null);

                if (matchPayload.winner) {
                    const win = await gameService.addWinStat(matchPayload.winner, points)
                        .catch(err => console.error(`Failed to update winner stats: ${err}`));   
                }

                if (loserId) {
                    console.log(`AI match, no loser to update stats for. ${loserId}`);
                    const loser = await gameService.addLossStat(loserId, points)
                        .catch(err => console.error(`Failed to update loser stats: ${err}`));
                }
            }
        }
    }

    public endGame(): void {
        this.isGameRunning = false;

        console.log(`match type: ${this.match.matchType}`);
        this.registerMatch(this.match);

        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    private gameLoop(match : TiamaMatch, resolve: (()=> void) | null) {
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
        this.checkScore(match, resolve);

        // Draw everything
        this.drawGameElements(match);
    }

    private checkScore(match : TiamaMatch, resolve: (()=> void) | null): void {
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
            resolve!();
            return;
        }
    }

    private drawGameElements(match : TiamaMatch): void {
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
