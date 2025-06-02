import { initializeGame, updateGame, movePlayer } from "./game-logic.js";

let board: HTMLCanvasElement;
let context: CanvasRenderingContext2D;

export default function run() : void {
    board = document.getElementById("board") as HTMLCanvasElement;
    board.width = 640;
    board.height = 400;
    context = board.getContext("2d")!;

    initializeGame();
    gameLoop();
    
    document.addEventListener("keydown", movePlayer);
    document.addEventListener("keyup", movePlayer);
}

function gameLoop() {
    updateGame(context);
    requestAnimationFrame(gameLoop);
}