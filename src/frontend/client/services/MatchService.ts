import { Server } from 'http';
import { User, ApiResponse } from '../game/types';
import Match from '../game/entities/Match'
import { TournamentInfo } from '../game/types';

export default class UserService {
    private API_GATEWAY = 'https://localhost:8044';

    public async getMatches(): Promise<Match[]> {
        let result: ApiResponse<Match[]>;
        try {
            const response = await fetch(`${this.API_GATEWAY}/match-history`);
            result = await response.json();

            if (result.success && result.data) {
                return result.data;
            }
        } catch (error) {
            //    Server.log.error(result.error || 'Failed to fetch users');
            return [];
        }
        return [];
    }

    public async updateMatchHistory(matches: Match[]): Promise<ApiResponse<{ insertedCount: number }>> {
        try {
            // Validate input
            if (!matches || matches.length === 0) {
                return { success: false, error: 'No matches provided' };
            }

            const response = await fetch(`${this.API_GATEWAY}/match-history`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(matches)
            });

            // Check if the HTTP request was successful
            if (!response.ok) {
                const errorText = await response.text();
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${errorText}`
                };
            }

            const result: ApiResponse<{ insertedCount: number }> = await response.json();

            if (result.success) {
                console.log(`Successfully inserted ${result.data?.insertedCount} matches`);
            } else {
                console.error('Failed to update match history:', result.error);
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