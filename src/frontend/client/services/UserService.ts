import { Server } from 'http';
import { User, ApiResponse } from '../game/types';
import Match from '../game/entities/Match'

export default class UserService {
  private API_GATEWAY = 'https://localhost:8044';

  public async getUsers(): Promise<User[]> {
    let result: ApiResponse<User[]>;
    try {
        const response = await fetch(`${this.API_GATEWAY}/users`);
        result = await response.json();
        
        if (result.success && result.data) {
            return result.data;
        }
    } catch (error) {
    //    Server.log.error(result.error || 'Failed to fetch users');
    }
  }

  public async updateUserScore(userData: Partial<User>): Promise<void> {
    let result: ApiResponse<User>;
    
    try {
        const response = await fetch(`${this.API_GATEWAY}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });

        result = await response.json();
        if (result.success) {
            // Server.log.info("User score updated with success!")
        } else {
    //    Server.log.error(result.error || 'Failed to update users score');
        }
    } catch (error) {
    //    Server.log.error(result.error || 'Error within updateUserScore callstack');
    }
  }

  public async updateTournamentHistory(matchs: Match[], winner: User): Promise<void> {
    
  }

}

// server.log.info(msg)
// server.log.warn(...)
// server.log.debug(...)
// server.log.error(...)