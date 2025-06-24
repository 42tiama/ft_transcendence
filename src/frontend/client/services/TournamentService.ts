import { Server } from 'http';
import { User, ApiResponse } from '../game/types';
import Match from '../game/entities/Match'
import { TournamentInfo } from '../game/types';

export default class UserService {
  private API_GATEWAY = 'https://localhost:8044';

  public async getTournaments(): Promise<TournamentInfo[]> {
    let result: ApiResponse<TournamentInfo[]>;
    try {
        const response = await fetch(`${this.API_GATEWAY}/tournament-history`);
        result = await response.json();
        
        if (result.success && result.data) {
            return result.data;
        }
    } catch (error) {
    //    Server.log.error(result.error || 'Failed to fetch users');
        return [];
    }
    return []
  }

    public async updateTournamentHistory(tournamentInfo: TournamentInfo): Promise<ApiResponse<TournamentInfo>> {
        try {
            const response = await fetch(`${this.API_GATEWAY}/tournament-history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tournamentInfo)
            });

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${errorText}`
                };
            }

            const result = await response.json();

            if (result.success) {
                // server.log.info(`Tournament successfully inserted`); //descomentar depois logstash
            } else {
                // server.log.error('Failed to insert tournament log:', result.error); //descomentar depois logstash
            }

            return result;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error in updateMatchHistory:', errorMessage);

            return {
                success: false,
                error: `Network or parsing error: ${errorMessage}`
            };
        }
    }
}

// server.log.info(msg)
// server.log.warn(...)
// server.log.debug(...)
// server.log.error(...)