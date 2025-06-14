import User  from './User.js';
import { Match, Tournament } from 'game/types.js';
import TiamaTournament from './Tournament.js';
import TiamaMatch from './Match.js';
import PlayerSelection from '../../static/js/views/PlayerSelection.js';
import { Player } from './Player.js';

export default class TiamaPong {
    public tournamentHistory: TiamaTournament[] = [];
    public versusMatchHistory: Match[] = [];
    public users: User[] = [];
    public preTournamentSelection: User[] = PlayerSelection.selectedPlayers;
    
    constructor() {
        this.users = [
            new User(this, 'Alle', 'Alle@gmail'), 
            new User(this, 'Iury', 'Iury@gmail'), 
            new User(this, 'Thais', 'Thais@gmail'), 
            new User(this, 'Andre', 'Andre@gmail'), 
            new User(this, 'Marcio', 'Marcio@gmail')]
    }

    public createTournament() {
        let size: number = this.tournamentHistory.push(new TiamaTournament(this)); 
        // createTournament(this.tournamentHistory[size - 1]) api method
        this.tournamentHistory[size - 1].tournamentId = (size - 1).toString();
        // this.tournamentHistory[size - 1].debugPrintRoundArray();
        // gameContext.runTournament(gameContext.tournamentHistory[size - 1]);
        console.log(`Tournaments: ${this.tournamentHistory[size - 1].tournamentId}`);
        // return this.tournamentHistory[size - 1];
    }
}