import AbstractView from './AbstractView.js';
// import { run } from '../../../game_3d/main.js';

export default class Game3d extends AbstractView {
  constructor() {
    super();
    this.setTitle('Game3d');
  }

  async getHtml(): Promise<string> {
    try {
      const response = await fetch('build/static/html/game3d.html');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error loading template:', error);
      return '<h1 class="h-96 bg-amber-600">Error Loading game 3D</h1>';
    }
  }

  async renderGame() {
    // run();
  }
}
