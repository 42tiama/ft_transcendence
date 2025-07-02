

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface MatchData {
    matchId?: string;
    matchType: string;
    tournamentId: number | null;
    player1: number;
    player2: number | null;
    player1Score: number;
    player2Score: number;
    winner: number | null;
}

export interface MatchResult {
    matchId: string;
    player1Score: number;
    player2Score: number;
    winner: number;
}

export interface PlayerData {
    id: number;
    displayName: string;
    points: number;
    wins: number;
    losses: number;
}

export interface TournamentData {
    tournamentId?: number;
    totalMatches: number;
    totalPlayers: number;
    winner?: number;
}