import User  from './User.js';
import { GameServices, Match, Tournament } from '../types.js';
import TiamaTournament from './Tournament.js';
import TiamaMatch from './Match.js';
import PlayerSelection from '../../static/js/views/tournamentPlayerSelection.js';
import { Player } from './Player.js';
import { get } from 'node:http';
import UserService from '../../services/UserService.js'

export default class TiamaPong {
    public tournamentHistory: TiamaTournament[] = [];
    public versusMatchHistory: Match[] = [];
    public users: User[] = [];
    public preTournamentSelection: User[] = [];
    public preVersusSelection: User | null = null;
    public sessionUser: User;
    public gameServices: Partial<GameServices> = { user: undefined };

    constructor() {
        this.initGameServices();
        this.loadUsers();
        this.sessionUser = new User(this, 42, 'DevUser', 'devuser@dev.com');
    }

    private initGameServices() {
        this.gameServices.user = new UserService();
    }

    private async loadUsers() {
        this.users = await this.gameServices.user!.getUsers();
    }

    public createTournament() {
        let size: number = this.tournamentHistory.push(new TiamaTournament(this));
        // createTournament(this.tournamentHistory[size - 1]) api method
        this.tournamentHistory[size - 1].tournamentId = (size - 1).toString();
        // this.tournamentHistory[size - 1].debugPrintRoundArray();
        // gameContext.runTournament(gameContext.tournamentHistory[size - 1]);
        // console.log(`Tournaments: ${this.tournamentHistory[size - 1].tournamentId}`);
        // return this.tournamentHistory[size - 1];
    }
}
