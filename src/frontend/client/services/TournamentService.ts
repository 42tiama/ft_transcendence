import { ApiResponse, TournamentData } from './types';


export default class TournamentService {
	private API_GATEWAY = 'https://localhost:8044/tournament/';

	public async createTournament(tournamentData: TournamentData): Promise<number> {
		const tournamentPayload: TournamentData = tournamentData;
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