import MatchService from 'services/MatchService';
import TiamaPong from './TiamaPong';
import TiamaTournament from './Tournament'
import User from './User';

export default class Match {
    matchType: string;
    tournamentId: string | null = null;
    player1: User;
    player2: User | null = null;
    player1Score: number = 0;
    player2Score: number = 0;
    winner: User | null = null;

    // constructor(type: string, tournament: TiamaTournament | null, player1: User, player2: User) {
    constructor(type: string, tournament: TiamaTournament | null, player1: User, player2: User | null) {
        this.matchType = type;
        this.tournamentId = type === 'versus-player' || type === 'versus-ai' ? null : tournament!.tournamentId;
        this.player1 = player1;
        this.player2 = player2;
    }

    // getMatchId(gameContext: TiamaPong , tournament: TiamaTournament, type: string) : string {
    //     if (type === 'tournament') {
    //         if (tournament.currentRound.length == 0 )
    //             return (`${tournament.tournamentId}T0`)
    //         else
    //             return (`${tournament.tournamentId}T${tournament.currentRound.length + 1}`);
    //     } else {
    //         if (gameContext.versusMatchHistory.length == 0 )
    //             return ('V0')
    //         else
    //             return (`V${gameContext.versusMatchHistory.length + 1}`);
    //     }
    // }
}