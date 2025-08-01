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
        this.tournamentHistory.push(new TiamaTournament(this));
    }
}
