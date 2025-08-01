import AbstractView from './AbstractView.js';
import Game from '../../../game/entities/Game.js';
import TiamaPong from "../../../game/entities/TiamaPong";
import Match from '../../../game/entities/Match.js';
import User from '../../../game/entities/User.js';
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
      this.user = new User(gameContext, gameContext.sessionUser!.id, gameContext.sessionUser!.displayName, "");
      document.querySelector("#human-player h1")!.innerHTML = gameContext.sessionUser!.displayName;
      this.game = new Game(new Match('versus-ai', null, this.user, null), 'board');
      this.game.setSelectedDifficulty(this.selectedDifficulty);
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
