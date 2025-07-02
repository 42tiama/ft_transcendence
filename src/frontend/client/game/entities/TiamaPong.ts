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
        this.userSessionData();
    }

    private async userSessionData() {
        const existingJwt = localStorage.getItem('jwt');
        if (!existingJwt) {
            return ;
        }
        const payload = parseJwt(existingJwt);
        const gameServices = new PlayerService();

        const data: PlayerData = await gameServices.getPlayerById(payload.id).then((data: PlayerData) => {
            if (data.id === 0) {
            console.error('No player data found for the given ID.');
            console.log('Payload:', payload);
            return {} as PlayerData;
            }
            return data;
        }).catch((error) => {
            console.error('Error fetching player data:', error);
            return {} as PlayerData;
        });
        if (!data || !data.id) {
            console.error('Invalid player data received:', data);
            return;
        }
        console.log('Player data fetched successfully:', data);
        this.sessionUser = new User(this, data.id, data.displayName, payload.email); 
    }

    private initGameServices() {
        this.gameServices.player = new PlayerService;
    }

    private async loadUsers() {
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
