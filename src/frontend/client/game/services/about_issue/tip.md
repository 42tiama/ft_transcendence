Here's the complete authentic Pong bouncing algorithm! The key insight is that where the ball hits the paddle determines the bounce angle.
The Core Algorithm:

Calculate hit position on the paddle (top, center, or bottom)
Convert to bounce angle (-60° to +60° typically)
Apply trigonometry to calculate new velocity components
Maintain consistent speed while changing direction

Key Differences from Your Current Code:
Your current method:

bounceHorizontal(): void {
    this.velocityX *= -1;  // Always same angle
}

Authentic Pong method:

bounceOffPaddle(paddle): void {
    // Hit position determines angle
    const hitPosition = (ballY - paddleCenterY) / (paddleHeight / 2);
    const bounceAngle = hitPosition * maxAngle;
    
    // New velocity based on angle
    this.velocityX = speed * Math.cos(bounceAngle) * direction;
    this.velocityY = speed * Math.sin(bounceAngle);
}

Visual Explanation:

Paddle Hit Zones:
┌─────┐
│ ↗   │ ← Top: Ball bounces UP-RIGHT
│ →   │ ← Center: Ball bounces STRAIGHT
│ ↘   │ ← Bottom: Ball bounces DOWN-RIGHT
└─────┘

Usage in Your Game:
Replace your collision handling:

// OLD
if (detectCollision(ball, player1)) {
    ball.bounceHorizontal();
}

// NEW
if (detectCollision(ball, player1)) {
    ball.bounceOffPaddle(player1);
}

Two Versions Provided:

bounceOffPaddle() - Full authentic physics with angles
bounceOffPaddleSimple() - Easier to understand version

The simple version is great for learning, while the full version gives you the exact classic Pong feel!
Optional Enhancements:

Speed increase after each hit (classic Pong feature)
Minimum horizontal speed to prevent ball getting stuck
Random Y direction on reset for variety

This will transform your game from predictable bouncing to the strategic, engaging gameplay that made Pong legendary! 🏓