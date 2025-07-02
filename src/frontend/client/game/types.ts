import PlayerService from "../services/PlayerService";
import TournamentService from "../services/TournamentService";
import MatchService from "../services/MatchService";

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
    points: number;
    wins : number;
    losses: number;
}

export interface Match extends User, Tournament {
    matchId: string;
    player1: User;
    player2: User;
}

export interface Tournament {
    tournamentId: string;
    currentRound: Match[];
    totalPlayers: number;
    totalMatches: number;
    nextPowerOf2: number;
    totalByes: number;
    firstRoundBracketSize: number;
    totalRounds: number;
    tournamentFinished: boolean;
    tournamentWinner: User;
}

export interface TournamentInfo {
    totalPlayers: number;
    totalMatches: number;
    winner: User | null;
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GameServices {
    player: PlayerService;
    tournament: TournamentService;
    match: MatchService;
}