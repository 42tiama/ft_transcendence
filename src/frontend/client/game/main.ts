import { Game } from './entities/Game.js';

export default function run() : void {
    try {
        const game = new Game("board");
        game.start();
    } catch (error) {
        console.error("Failed to initialize game:", error);
    }
};