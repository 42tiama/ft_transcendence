export interface Position {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface Velocity {
    velocityX: number;
    velocityY: number;
}

export interface Player extends Position, Size {
    velocityY: number;
}

export interface User {
    id: number;
    displayName: string;
    userName: string;
    email: string;
    record: {wins : number, losses: number};
    level: number;
    cardColor: number;
}

export interface Match extends User {
    matchId: string;
    player1: User;
    player2: User;
}

export interface Tournament extends Match {
    tournamentId: number;
    matches: Match[];
}

export interface Ball extends Position, Size, Velocity {}

export interface GameConfig {
    boardWidth: number;
    boardHeight: number;
    playerWidth: number;
    playerHeight: number;
    ballWidth: number;
    ballHeight: number;
    ballVelocity: number;
    playerSpeed: number
}