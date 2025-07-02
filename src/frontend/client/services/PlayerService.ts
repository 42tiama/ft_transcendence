import { User } from 'game/types';
import { PlayerData, ApiResponse } from './types';


export default class PlayerService {
	private API_GATEWAY = 'https://localhost:8044/player/';
	
	public async getPlayerById(id: number): Promise<User> {
		const idPlayerString = id.toString();
		let response = {} as Response;

		const request = {
			route: `${this.API_GATEWAY}${idPlayerString}/info`, 
			options: {
				method: 'GET'
			}
		};

		try {
			response = await fetch(request.route, request.options);
			const result: ApiResponse<User> = await response.json();

			if (response.ok && result.data) {
				return result.data;
			}
			console.log(`failed to get player: ${response.status} ${response.statusText}`);
		} catch (err) {
			console.log(`Could not reach game-service: ${err}`);
		}
		return {} as User;
	}

	public async addWinStat(userId: number, points: number): Promise<void> {
		let response = {} as Response;

		const request = {
			route: `${this.API_GATEWAY}${userId}/info/wins`, 
			options: {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ points })
			}
		};

		try {
			response = await fetch(request.route, request.options);
			if (response.ok) {
				console.log(`Player with ID ${userId} stats updated.`);
			} else {
				console.log(`failed to update player stats: ${response.status} ${response.statusText}`);
			}
		} catch (err) {
			console.log(`Could not reach game-service: ${err}`);
		}
	}

	public async addLossStat(userId: number, points: number): Promise<void> {
		let response = {} as Response;

		const request = {
			route: `${this.API_GATEWAY}${userId}/info/losses`, 
			options: {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ points})
			}
		};

		try {
			response = await fetch(request.route, request.options);
			if (response.ok) {
				console.log(`Player with ID ${userId} stats updated.`);
			} else {
				console.log(`failed to update player stats: ${response.status} ${response.statusText}`);
			}
		} catch (err) {
			console.log(`Could not reach game-service: ${err}`);
		}
	}	

	public async getAllPlayers(): Promise<User[]> {
		let response = {} as Response;

		const request = {
				route: `${this.API_GATEWAY}players`, 
				options: {
					method: 'GET'
			}
		};

		try {
			response = await fetch(request.route, request.options);
			const result:ApiResponse<User[]> = await response.json();
			
			if (response.ok && result.data) {
				return result.data;
			}
			console.log(`failed to get Players: ${response.status} ${response.statusText}`);
		} catch (err) {
			console.log(`Could not reach game-service: ${err}`);
		}
		return [];
	}
}

// server.log.info(msg)
// server.log.warn(...)
// server.log.debug(...)
// server.log.error(...)