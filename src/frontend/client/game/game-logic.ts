import { Player, Ball } from "./models.js";
import {
    BOARD_WIDTH,
    BOARD_HEIGHT,
    PLAYER_WIDTH,
    PLAYER_HEIGHT,
    BALL_SIZE,
    PLAYER_SPEED,
    BALL_VELOCITY,
} from "./constants.js";
import { outOfBounds, detectCollision, drawDottedLine } from "./utils.js";

export let player1: Player;
export let player2: Player;
export let ball: Ball;
export let player1Score = 0;
export let player2Score = 0;

// inicializa as partes entidades moveis com as coordenadas de inicio (bola no meio, players no meio)
export function initializeGame() {
    player1 = {
        x: 10,
        y: BOARD_HEIGHT / 2 - PLAYER_HEIGHT / 2,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        velocityY: 0,
    };

    player2 = {
        x: BOARD_WIDTH - PLAYER_WIDTH - 10,
        y: BOARD_HEIGHT / 2 - PLAYER_HEIGHT / 2,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        velocityY: 0,
    };

    ball = {
        x: BOARD_WIDTH / 2 - BALL_SIZE / 2,
        y: BOARD_HEIGHT / 2 - BALL_SIZE / 2,
        width: BALL_SIZE,
        height: BALL_SIZE,
        velocityX: Math.random() < 0.5 ? BALL_VELOCITY : -BALL_VELOCITY,
        velocityY: 0,
    };
}

// qdo o player faz gol, o jogo reseta com os players e a bola no meio sendo lancada na direcao de quem tomou o gol
export function resetGame(direction: number) {
    ball = {
        x: BOARD_WIDTH / 2 - BALL_SIZE / 2,
        y: BOARD_HEIGHT / 2 - BALL_SIZE / 2,
        width: BALL_SIZE,
        height: BALL_SIZE,
        velocityX: direction,
        velocityY: 0,
    };
}

// controle dos players
export function movePlayer(e: KeyboardEvent) {

    if (e.code === "KeyW" || e.code === "KeyS") {
        e.preventDefault();
        if (e.type === "keydown") {
            player1.velocityY = e.code === "KeyW" ? -PLAYER_SPEED : PLAYER_SPEED;
        } else if (e.type === "keyup") {
            player1.velocityY = 0;
        }
    }
    
    if (e.code === "ArrowUp" || e.code === "ArrowDown") {
        e.preventDefault();
        if (e.type === "keydown") {
            player2.velocityY = e.code === "ArrowUp" ? -PLAYER_SPEED : PLAYER_SPEED;
        } else if (e.type === "keyup") {
            player2.velocityY = 0;
        }
    }
}

// mlx loop hook ;D
export function updateGame(context: CanvasRenderingContext2D) {
    // limpa o frame atual
    context.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
    
    // desenha o player e também limita que ele ande pra fora do board
    [player1, player2].forEach(player => {
        const nextY = player.y + player.velocityY;
        if (!outOfBounds(nextY)) player.y = nextY;
    });

    // desenha os players
    context.fillStyle = "skyblue";
    context.fillRect(player1.x, player1.y, player1.width, player1.height);
    context.fillRect(player2.x, player2.y, player2.width, player2.height);

    // atualiza a posicao da bola
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // desenha a bola
    context.fillStyle = "white";
    context.fillRect(ball.x, ball.y, ball.width, ball.height);

    // inverte a direcao no eixo y qdo a bola bate nas paredes de cima/baixo
    if (ball.y <= 0 || ball.y + ball.height >= BOARD_HEIGHT) {
        ball.velocityY *= -1;
    }

    // detecta colisao da bola com os players (precisa debbugar e refatorar, comportamento estranho)
    if (detectCollision(ball, player1) && ball.velocityX < 0) {
        console.log(`ball pos y: ${ball.y}`);
        console.log(`player pos y: ${player1.y + (player1.height / 2)}`);
        ball.velocityX *= -1;
        ball.velocityY = ball.y < player1.y + (player1.height / 2) ? -BALL_VELOCITY : BALL_VELOCITY;
    } else if (detectCollision(ball, player2) && ball.velocityX > 0) {
        console.log(`ball pos y: ${ball.y}`);
        console.log(`player pos y: ${player2.y + (player2.height / 2)}`);
        ball.velocityX *= -1;
        ball.velocityY = ball.y < player2.y + (player2.height / 2) ? -BALL_VELOCITY : BALL_VELOCITY;
    }

    // marca o gol e reseta a partida
    if (ball.x < 0) {
        player2Score++;
        resetGame(BALL_VELOCITY);
    } else if (ball.x + ball.width > BOARD_WIDTH) {
        player1Score++;
        resetGame(-BALL_VELOCITY);
    }

    // desenha o placar
    context.font = "45px sans-serif";
    context.fillText(player1Score.toString(), BOARD_WIDTH / 5, 45);
    context.fillText(player2Score.toString(), (BOARD_WIDTH * 4) / 5 - 45, 45);

    // desenha linha do meio
    drawDottedLine(context, BOARD_WIDTH, BOARD_HEIGHT);
}