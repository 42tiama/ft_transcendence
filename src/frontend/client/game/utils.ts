import { GameObject } from "./models.js";
import { BOARD_HEIGHT, PLAYER_HEIGHT } from "./constants.js";

//funcao auxiliar para verificar posicao do player (usada no loop principal)
export function outOfBounds(yPosition: number): boolean {
    return yPosition < 0 || yPosition + PLAYER_HEIGHT > BOARD_HEIGHT;
}

// funcao auxiliar para detectar colisao com os players (usada no loop principal)
export function detectCollision(ballPos: GameObject, playerPos: GameObject): boolean {
    return (
        ballPos.x < playerPos.x + playerPos.width &&
        ballPos.x + ballPos.width > playerPos.x &&
        ballPos.y < playerPos.y + playerPos.height &&
        ballPos.y + ballPos.height > playerPos.y
    );
}

// desenha a linha do meio
export function drawDottedLine(
    context: CanvasRenderingContext2D,
    boardWidth: number,
    boardHeight: number
) {
    for (let i = 10; i < boardHeight; i += 25) {
        context.fillRect(boardWidth / 2 - 10, i, 5, 5);
    }
}