import AbstractView from './AbstractView.js';
import TiamaPong from '../../../game/entities/TiamaPong.js';

export default class Game extends AbstractView {
  constructor() {
    super();
    this.setTitle('Game');
  }

  async getHtml(): Promise<string> {
    try {
      const response = await fetch('build/static/html/game.html');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error loading template:', error);
      return '<h1 class="h-96 bg-amber-600">Error Loading game</h1>';
    }
  }

  async onMount(gameContext: TiamaPong | null, appElement: Element | null) {
  }

  async beforeMount(gameContext: TiamaPong | null): Promise<boolean> {
    return true;
  }
  
}
