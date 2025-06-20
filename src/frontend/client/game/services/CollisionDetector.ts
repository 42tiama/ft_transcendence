import { Ball } from '../entities/Ball';
import { Player } from '../entities/Player';

export class CollisionDetector {
    static detect(ball: Ball, player: Player): boolean {
        return ball.x < player.x + player.width &&
               ball.x + ball.width > player.x &&
               ball.y < player.y + player.height &&
               ball.y + ball.height > player.y;
    }

    static handlePlayerCollision(ball: Ball, player1: Player, player2: Player): void {
        if (this.detect(ball, player1)) {
            // Calcula o ponto de colisão relativo ao centro do paddle
            const relativeIntersectY = (player1.y + player1.height / 2) - (ball.y + ball.height / 2);
            const normalizedRelativeIntersectionY = relativeIntersectY / (player1.height / 2);
            const bounceAngle = normalizedRelativeIntersectionY * (Math.PI / 4); // Máximo de 45 graus

            ball.setDirection(Math.cos(bounceAngle), -Math.sin(bounceAngle));
        } else if (this.detect(ball, player2)) {
            const relativeIntersectY = (player2.y + player2.height / 2) - (ball.y + ball.height / 2);
            const normalizedRelativeIntersectionY = relativeIntersectY / (player2.height / 2);
            const bounceAngle = normalizedRelativeIntersectionY * (Math.PI / 4);

            ball.setDirection(-Math.cos(bounceAngle), -Math.sin(bounceAngle));
        }
    }

    // static handleWallCollision(ball: Ball, fieldHeight: number): void {
    //     if (ball.y <= -10 || ball.y + ball.height >= fieldHeight + 10) {
    //         ball.bounceVertical();
    //     }
    // }
}