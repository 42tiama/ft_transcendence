import AbstractView from './AbstractView.js';
import {Game} from '../../../game/entities/Game.js';

export default class GameAi extends AbstractView {

  private selectedDifficulty: number = 0.5;
  private game: Game;

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

  private onClickStartButton() {
    const btn = document.getElementById('start');

    if (btn) {
      btn.addEventListener('click', () => {

        if (btn) {
          this.showElement('start', false);
          this.onClickDifficultyButton();
        }
      });
    }
  }

  private onClickDifficultyButton() {

    const difficulties = [
      { id: 'easy', value: 0.7 },
      { id: 'medium', value: 0.5 },
      { id: 'hard', value: 0.3 }
    ];

    const groupButtons = document.getElementById('difficulty-group');

    if (groupButtons) {
      this.showElement('ai-player');
      this.showElement('human-player');
      this.showElement('difficulty-group');

      difficulties.forEach(diff => {
        const diffButton = document.getElementById(diff.id);

        if (diffButton) {
          diffButton.addEventListener('click', () => {
            this.showElement('difficulty-group', false);
            this.showElement('board');

            this.selectedDifficulty = diff.value;

            this.game = new Game('board');
            this.game.setSelectedDifficulty(this.selectedDifficulty);
            this.renderGame();
          });
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

  async onMount() {
    this.showElement('ai-player', false);
    this.showElement('human-player', false);
    this.showElement('difficulty-group', false);
    this.showElement('board', false);
    this.onClickStartButton();
  }

  async renderGame() {
    try {
      this.game.start();
    } catch (error) {
      console.error("Failed to initialize game:", error);
    }
  }
}