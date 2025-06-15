import { Ball as BallInterface, GameConfig } from '../types.js';

export class Ball implements BallInterface {
    x: number;
    y: number;
    width: number;
    height: number;
    velocityX: number;
    velocityY: number;

    constructor(config: GameConfig) {
        this.x = config.boardWidth / 2;
        this.y = config.boardHeight / 2;
        this.width = config.ballWidth;
        this.height = config.ballHeight;
        this.velocityX = Math.random() < 0.5 ? config.ballVelocity : -config.ballVelocity;
        this.velocityY = config.ballVelocity;
    }

    update(): void {
        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    draw(context: CanvasRenderingContext2D): void {
        context.fillStyle = "white";
        context.fillRect(this.x, this.y, this.width, this.height);
    }

    bounceVertical(speedFactor: number = 1.05): void {
        this.velocityY = -this.velocityY * speedFactor; // Inverte e acelera
        this.velocityX *= speedFactor; // Opcional: acelera também no eixo X
    }

    // Não utilizado, mas pode ser implementado se necessário e com as devidadas alterações para lógica de reset
    bounceHorizontal(speedFactor: number = 1.05): void {
        this.velocityX *= 1 * speedFactor;
        this.velocityY *= speedFactor;
    } 

    reset(direction: number, config: GameConfig): void {
        this.x = config.boardWidth / 2;
        this.y = config.boardHeight / 2;
        this.velocityX = Math.random() < 0.5 ? config.ballVelocity : -config.ballVelocity;
        this.velocityY = 0;
    }

    isOutOfBoundsVertical(config: GameConfig): boolean {
        return this.y <= 0 || this.y + this.height >= config.boardHeight;
    }

    isOutOfBoundsLeft(): boolean {
        return this.x < 0;
    }

    isOutOfBoundsRight(config: GameConfig): boolean {
        return this.x + this.width > config.boardWidth;
    }

    setDirection(directionX: number, directionY: number): void {
        // Calcula o módulo atual da velocidade
        const currentSpeed = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2) || 1;
        // Normaliza o vetor direção
        const norm = Math.sqrt(directionX ** 2 + directionY ** 2) || 1;
        // Aplica a nova direção mantendo a velocidade atual
        this.velocityX = (directionX / norm) * currentSpeed;
        this.velocityY = (directionY / norm) * currentSpeed;
    }
}