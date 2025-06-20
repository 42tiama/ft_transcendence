import AbstractView from './AbstractView.js';
import {Game} from '../../../game/entities/Game.js';

export default class GameAi extends AbstractView {
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

  async onMount() {
    const btn = document.getElementById('start');
    if (btn) {
      btn.addEventListener('click', () => this.renderGame());
    }
  }

  async renderGame() {
    try {
      const btn = document.getElementById('start');
      if (btn) btn.style.display = 'none'; // Esconde o botão
      
      const game = new Game("board");
      game.start();
    } catch (error) {
      console.error("Failed to initialize game:", error);
    }
  }
}