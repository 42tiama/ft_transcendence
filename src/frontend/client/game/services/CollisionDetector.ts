import { Player } from '../entities/Player.js';
import { Ball } from '../entities/Ball.js';

export class CollisionDetector {
    static detect(ball: Ball, player: Player): boolean {
        return ball.x < player.x + player.width &&
               ball.x + ball.width > player.x &&
               ball.y < player.y + player.height &&
               ball.y + ball.height > player.y;
    }

    static handlePlayerCollision(ball: Ball, player1: Player, player2: Player): void {
        if (this.detect(ball, player1)) {
            if (ball.x <= player1.x + player1.width) {
                ball.bounceHorizontal();
            }
        } else if (this.detect(ball, player2)) {
            if (ball.x + ball.width >= player2.x) {
                ball.bounceHorizontal();
            }
        }
    }
}