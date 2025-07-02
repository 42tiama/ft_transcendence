import AbstractView from './AbstractView.js';
import Game from '../../../game/entities/Game.js';
import TiamaPong from "../../../game/entities/TiamaPong";
import Match from '../../../game/entities/Match.js';
import User from '../../../game/entities/User.js';
import { parseJwt } from '../views/Login.js'
import PlayerService from '../../../services/PlayerService.js';
import { PlayerData } from '../../../services/types.js';

export default class GameAi extends AbstractView {

  private selectedDifficulty: number = 0.5;
  private game: Game | null = null;
  private user?: PlayerData;

  constructor() {
    super();
    this.setTitle('Game-AI');
  }

  async getHtml(): Promise<string> {
    try {
      const response = await fetch('build/static/html/game-ai.html');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error loading template:', error);
      return '<h1 class="h-96 bg-amber-600">Error Loading game VS AI</h1>';
    }
  }

  private onClickStartButton(gameContext: TiamaPong) {
    const btn = document.getElementById('start');

    if (btn) {
      btn.addEventListener('click', () => {

        if (btn) {
          this.showElement('start', false);
          this.onClickDifficultyButton(gameContext);
        }
      }, { once: true});
    }
  }

  private async showAfterMatchModal(): Promise<void> {
    const modal = document.getElementById('after-match-modal');
    modal?.classList.replace('hidden', 'flex');
  }

  private async playerSessionData(gameContext: TiamaPong) {
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
    this.user = new User(gameContext, data.id, data.displayName, payload.email); 
  }

  private onClickDifficultyButton(gameContext: TiamaPong) {

    const difficulties = [
      { id: 'easy', value: 0.6 },
      { id: 'medium', value: 0.4 },
      { id: 'hard', value: 0.1 }
    ];

    const groupButtons = document.getElementById('difficulty-group');

    if (groupButtons) {
      this.showElement('ai-player');
      this.showElement('human-player');
      this.showElement('difficulty-group');
      this.showElement('difficulty-container');

      difficulties.forEach(diff => {
        const diffButton = document.getElementById(diff.id);

        if (diffButton) {
          diffButton.addEventListener('click', async () => {
            this.showElement('difficulty-group', false);
            this.showElement('difficulty-container', false);
            this.showElement('board');

            this.selectedDifficulty = diff.value;

            await this.playerSessionData(gameContext);
            if (!this.user) {
              console.error('User data is not available.');
              return;
            }

            this.game = new Game(new Match('versus-ai', null, this.user, null), 'board');
            this.game.setSelectedDifficulty(this.selectedDifficulty);
            this.renderGame(gameContext);
          }, { once: true });
        }
      });
    }
	}

  private showElement(name: string, on_off: boolean = true): void {
    const displayStyle = on_off ? 'flex' : 'none';
    const element = document.getElementById(name);

    if (element) {
      element.style.display = displayStyle;
    }
  }

	

  async onMount(gameContext: TiamaPong) {
    this.showElement('ai-player', false);
    this.showElement('human-player', false);
    this.showElement('difficulty-group', false);
    this.showElement('difficulty-container');
    this.showElement('board', false);
    this.onClickStartButton(gameContext);
  }

  async renderGame(gameContext: TiamaPong) {
    try {
      await this.game!.startMatch(this.game!.match);
      await this.showAfterMatchModal();
    } catch (error) {
      console.error("Failed to initialize game:", error);
    }
  }

  async beforeMount(gameContext: TiamaPong): Promise<boolean> {
    return true;
  }

  async onUnMount() {
    this.game?.cancelGame();
  }
}
