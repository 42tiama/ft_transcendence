import { User, Tournament } from '../types'
import TiamaPong from './TiamaPong';
import TiamaTournament from './Tournament'

export default class Match {
    tournamentId: string = null;
    matchType: string;
    matchId: string;
    player1: User;
    player2: User;
    winner: User | null = null;

    constructor(gameContext: TiamaPong, type: string, player1: User, player2: User, tournament: TiamaTournament | null) {
        this.tournamentId = type === 'tournament' ? tournament.tournamentId : this.tournamentId;
        this.matchType = type;
        this.matchId = type === 'versus' ? null : this.getMatchId(gameContext, tournament, type);
        this.player1 = player1; 
        this.player2 = player2;
    }

    getMatchId(gameContext: TiamaPong , tournament: TiamaTournament, type: string) : string {
        if (type === 'tournament') {
            if (tournament.currentRound.length == 0 )
                return (`${tournament.tournamentId}T0`)
            else
                return (`${tournament.tournamentId}T${tournament.currentRound.length + 1}`);
        } else {
            if (gameContext.versusMatchHistory.length == 0 )
                return ('V0')
            else
                return (`V${gameContext.versusMatchHistory.length + 1}`);
        }
    }
}