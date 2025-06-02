export interface GameObject {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Player extends GameObject {
    velocityY: number;
}

export interface Ball extends GameObject {
    velocityX: number;
    velocityY: number;
}