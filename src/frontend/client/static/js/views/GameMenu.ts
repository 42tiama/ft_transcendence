import AbstractView from './AbstractView.js';
import Game from '../../../game/entities/Game.js'
import User from '../../../game/entities/User.js'
import TiamaPong from '../../../game/entities/TiamaPong.js';

export default class GameMenu extends AbstractView {
  private selectedMode: { versusAi: boolean, versusPlayer: boolean, tournament: boolean };
  private mouseHoverHandler?: (event: MouseEvent) => void;

  constructor() {
    super();
    this.setTitle('Menu');
    this.selectedMode = {
      versusAi: true,
      versusPlayer: false,
      tournament: false
    };
  }

  async getHtml(): Promise<string> {
    try {
      const response = await fetch('build/static/html/game-menu.html');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error loading template:', error);
      return '<h1 class="h-96 bg-amber-600">Error Loading the game menu</h1>';
    }
  }

  moveCursor = (e: MouseEvent, gameContext: TiamaPong) => {
    const versus = document.getElementById("versus-player");
    const versusAi = document.getElementById("versus-ai");
    const tournament = document.getElementById("tournament");
    const versusLink = document.getElementById("versus-player-Link");
    const versusAiLink = document.getElementById("versusLink-ai-link");
    const tournamentLink = document.getElementById("tournamentLink");
    if (e.target == versusLink) {
      versus!.innerHTML = '&#x25b6;';
      versusAi!.innerHTML = '';
      tournament!.innerHTML = '';
    } else if (e.target == versusAiLink) {
      versus!.innerHTML = '';
      versusAi!.innerHTML = '&#x25b6;';
      tournament!.innerHTML = '';
    } else if (e.target == tournamentLink) {
      versus!.innerHTML = '';
      versusAi!.innerHTML = '';
      tournament!.innerHTML = '&#x25b6;';
    } 
  } 

  async onMount(gameContext: TiamaPong, appElement: Element) {
    if (this.mouseHoverHandler) {
      document.getElementById('menu-link-container')!.removeEventListener("mouseover", this.mouseHoverHandler);
    }

    this.mouseHoverHandler = (event: MouseEvent) => {
      this.moveCursor(event, gameContext);
    };

    document.getElementById('menu-link-container')!.addEventListener("mouseover", this.mouseHoverHandler);
  }

  async beforeMount(gameContext: TiamaPong | null): Promise<boolean> {
    return true;
  }

  async onUnMount() {
    if (this.mouseHoverHandler) {
      document.getElementById('menu-link-container')!.removeEventListener("mouseover", this.mouseHoverHandler);
      this.mouseHoverHandler = undefined;
    }
  }
}
