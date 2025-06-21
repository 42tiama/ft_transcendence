import AbstractView from './AbstractView.js';
import TiamaPong from '../../../game/entities/TiamaPong.js';
import TiamaTournament from '../../../game/entities/Tournament.js'
import { appendFile } from 'fs';

export default class Tournament extends AbstractView {
  constructor() {
    super();
    this.setTitle('Tournament');
  }

  async getHtml(): Promise<string> {
    try {
      const response = await fetch('build/static/html/tournament.html');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error loading template:', error);
      return '<h1 class="h-96 bg-amber-600">Error Loading Tournament</h1>';
    }
  }

  async beforeMount(gameContext: TiamaPong | null) : Promise<boolean> {
    if (gameContext.preTournamentSelection.length > 2) {
      gameContext.createTournament();
      return true;
    }

    else {
        alert('You have to choose at least 3 players to play a tournament.');
        return false;
    }
  }

  async onMount(gameContext: TiamaPong | null, appElement: Element | null) {
    gameContext.tournamentHistory[0].runTournament(appElement);
  }

  // private createVersusMatch(participants: User[]) {
      // let size: number = this.versusMatchHistory.push(new TiamaMatch(this, 'versus', participants[0], participants[1], null);
      // this.versusMatchHistory[size - 1].matchId = (size - 1).toString();
  // }
}
