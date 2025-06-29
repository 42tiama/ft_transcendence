import { ApiResponse, MatchData, MatchResult } from './types';


export default class MatchService {
    private API_GATEWAY = 'https://localhost:8044/match/';

    public async createMatch(matchData: MatchData): Promise<number> {
        const matchPayload: MatchData = matchData;
        let response = {} as Response;

		const request = {
				route: `${this.API_GATEWAY}register`, 
				options: {
				method: 'POST',
				headers: {
                    'Content-Type': 'application/json'
                },
				body: JSON.stringify(matchPayload)
		    }
        };

        try {
            response = await fetch(request.route, request.options);
            const result: ApiResponse<number> = await response.json();

            if (response.ok && result.data) {
                console.log(`Match successfully registered, id: ${result.data}`);
                return result.data;
            }
            console.log(`Failed to create match: ${response.status} ${response.statusText}`);
        } catch (err) {
            console.log(`Could not reach game-service: ${err}`);
        }
        return 0;
    }

    public async getMatchById(id: number): Promise<MatchData> {
        const idMatchString = id.toString();
        let response = {} as Response;

        const request = {
            route: `${this.API_GATEWAY}${idMatchString}/info`, 
            options: {
                method: 'GET'
            }
        };

        try {
            response = await fetch(request.route, request.options);
            const result: ApiResponse<MatchData> = await response.json();

            if (response.ok && result.data) {
                return result.data;
            }
			console.log(`failed to get match: ${response.status} ${response.statusText}`);
        } catch (err) {
            console.log(`Could not reach game-service: ${err}`);
        }
        return {} as MatchData;
    }

    public async registerMatchResult(resultData: MatchResult): Promise<boolean> {
        const matchPayload: MatchResult = resultData;
        const idMatchString = matchPayload.matchId.toString();

        let response = {} as Response;

        const request = {
            route: `${this.API_GATEWAY}${idMatchString}/info`, 
            options: {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(matchPayload)
            }
        };

        try {
            response = await fetch(request.route, request.options);
            const result: ApiResponse<boolean> = await response.json();

            if (response.ok && result.data) {
                console.log(`Match result successfully registered for match ID ${matchPayload.matchId}`);
                return true;
            }
            console.log(`Failed to register match result: ${response.status} ${response.statusText}`);
        } catch (err) {
            console.log(`Could not reach game-service: ${err}`);
        }
        return false;
    }
}


// server.log.info(msg)
// server.log.warn(...)
// server.log.debug(...)
// server.log.error(...)