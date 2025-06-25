import { gameConfig } from '../gameConfig.js';
import { GameConfig } from '../types.js';
import { Player } from '../entities/Player.js';

export class InputHandler {
    private player1: Player;
    private player2: Player;

    constructor(player1: Player, player2?: Player) {
        this.player1 = player1;
        this.player2 = player2;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        document.addEventListener("keydown", (e) => this.handleKeyDown(e, gameConfig));
        document.addEventListener("keyup", (e) => this.handleKeyUp(e));
    }

    private handleKeyDown(event: KeyboardEvent, config: GameConfig): void {
        // Player 1 controls (W/S)
        if (event.code === "KeyW") {
            this.player1.setVelocity(-config.playerSpeed);
        } else if (event.code === "KeyS") {
            this.player1.setVelocity(config.playerSpeed);
        }

        // Player 2 controls (Arrow keys)
        if (this.player2) {
            if (event.code === "ArrowUp") {
                this.player2.setVelocity(-config.playerSpeed);
            } else if (event.code === "ArrowDown") {
                this.player2.setVelocity(config.playerSpeed);
            }
        }
    }

    private handleKeyUp(event: KeyboardEvent): void {
        // Player 1 controls
        if (event.code === "KeyW" || event.code === "KeyS") {
            this.player1.setVelocity(0);
        }

        // Player 2 controls
        if (this.player2) {
            if (event.code === "ArrowUp" || event.code === "ArrowDown") {
                this.player2.setVelocity(0);
            }
        }
    }
}
