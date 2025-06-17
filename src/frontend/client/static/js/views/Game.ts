import AbstractView from './AbstractView.js';
import run from '../../../game/main.js'

export default class Game extends AbstractView {
  constructor() {
    super();
    this.setTitle('Game');
  }

  async getHtml(): Promise<string> {
    try {
      const response = await fetch('build/frontend/static/html/game.html');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error loading template:', error);
      return '<h1 class="h-96 bg-amber-600">Error Loading game</h1>';
    }
  }

  async renderGame() {
    run();
  }
}
