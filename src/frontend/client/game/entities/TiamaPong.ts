import User  from './User.js';
import { GameServices, Match, Tournament } from '../types.js';
import TiamaTournament from './Tournament.js';
import TiamaMatch from './Match.js';
import PlayerSelection from '../../static/js/views/tournamentPlayerSelection.js';
import { Player } from './Player.js';
import PlayerService from '../../services/PlayerService.js'
import { parseJwt } from '../../static/js/views/Login.js';
import { PlayerData } from 'services/types.js';

export default class TiamaPong {
    public tournamentHistory: TiamaTournament[] = [];
    public versusMatchHistory: Match[] = [];
    public users: User[] = [];
    public preTournamentSelection: User[] = [];
    public preVersusSelection: User | null = null;
    public sessionUser?: User;
    public gameServices: Partial<GameServices> = { player: undefined };

    constructor() {
        this.initGameServices();
        this.loadUsers();
    }

    private initGameServices() {
        this.gameServices.player = new PlayerService;
    }

    public async loadUsers() {
        this.users = await this.gameServices.player!.getAllPlayers();
    }

    public createTournament() {
        let size: number = this.tournamentHistory.push(new TiamaTournament(this));
        // createTournament(this.tournamentHistory[size - 1]) api method
        this.tournamentHistory[size - 1].tournamentId = (size - 1);
        // this.tournamentHistory[size - 1].debugPrintRoundArray();
        // gameContext.runTournament(gameContext.tournamentHistory[size - 1]);
        // console.log(`Tournaments: ${this.tournamentHistory[size - 1].tournamentId}`);
        // return this.tournamentHistory[size - 1];
    }
}
