import { ApiResponse, TournamentData } from './types';


export default class TournamentService {
	private API_GATEWAY = 'https://localhost:8044/tournament/';

	public async createTournament(tournamentData: TournamentData): Promise<number> {
		const tournamentPayload: TournamentData = {
			totalPlayers: tournamentData.totalPlayers,
			totalMatches: tournamentData.totalMatches
		}
		let response = {} as Response;

		const request = {
			route: `${this.API_GATEWAY}register`, 
			options: {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(tournamentPayload)
			}
		};

		try {
			response = await fetch(request.route, request.options);
			const result:ApiResponse<number> = await response.json();

			if (response.ok && result.data) {
				console.log(`Tournament successfully registered, id: ${result.data}`);
				return result.data;
			}
			console.log(`failed to create tournament: ${response.status} ${response.statusText}`);
		} catch (err) {
            console.log(`Could not reach game-service: ${err}`);
    	}
		return 0;
	}

	public async registerTournamentResults(tournamentData: TournamentData): Promise<boolean> {
		const tournamentIdString = tournamentData.tournamentId!.toString();
		const tournamentPayload: TournamentData = {
			winner: tournamentData.winner,
			finished: tournamentData.finished
		};
		let response = {} as Response;

		console.log(`Registering tournament results for tournament id: ${tournamentIdString}`);

		const request = {
			route: `${this.API_GATEWAY}${tournamentIdString}/result`, 
			options: {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(tournamentPayload)
			}
		};

		try {
			response = await fetch(request.route, request.options);
			const result: ApiResponse<boolean> = await response.json();

			if (response.ok && result.data) {
				console.log(`Tournament results successfully registered for tournament id: ${tournamentIdString}`);
				return result.data;
			}
			console.log(`failed to register tournament results: ${response.status} ${response.statusText}`);
		} catch (err) {
			console.log(`Could not reach game-service: ${err}`);
		}
		return false;
	}

	public async getTournamentById(id: number): Promise<TournamentData> {
		const idTournament = id.toString();
		let response = {} as Response;

		const request = {
			route: `${this.API_GATEWAY}${idTournament}/info`, 
			options: {
				method: 'GET'
			}
		};

		try {
			response = await fetch(request.route, request.options);
			const result: ApiResponse<TournamentData> = await response.json();
			
			if (response.ok && result.data) {
				return result.data;
			}
			console.log(`failed to get tournament: ${response.status} ${response.statusText}`);
		} catch (err) {
			console.log(`Could not reach game-service: ${err}`);
		}
		return {} as TournamentData;
	}
}

// server.log.info(msg)
// server.log.warn(...)
// server.log.debug(...)
// server.log.error(...)