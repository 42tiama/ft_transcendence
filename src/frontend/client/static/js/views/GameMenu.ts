import AbstractView from './AbstractView.js';
import Game from '../../../game/entities/Game.js'
import User from '../../../game/entities/User.js'
import TiamaPong from '../../../game/entities/TiamaPong.js';

export default class GameMenu extends AbstractView {
  private selectedMode: { versusAi: boolean, versusPlayer: boolean, tournament: boolean };
  private keyHandler?: (event: KeyboardEvent) => void;

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

  moveCursor = (e: KeyboardEvent, gameContext: TiamaPong) => {
    const versus = document.getElementById("versus");
    const tournament = document.getElementById("tournament");
    const versusAiLink = document.getElementById("versus-ai-link");
    const versusPlayerLink = document.getElementById("versus-player-link");
    const tournamentLink = document.getElementById("tournamentLink");
    if (e.code === "ArrowDown" || e.code === "ArrowUp") {
        e.preventDefault();
        if (e.type === "keydown") {
          this.selectedMode.versusAi = !this.selectedMode.versusAi;
          this.selectedMode.versusPlayer = !this.selectedMode.versusPlayer;
          this.selectedMode.tournament = !this.selectedMode.tournament;
        }
        if (this.selectedMode.versusAi)
          versus!.innerHTML = '&#x25b6;';
        else
          versus!.innerHTML = '';

        if (this.selectedMode.versusPlayer)
          tournament!.innerHTML = '&#x25b6;';
        else
          tournament!.innerHTML = '';

        if (this.selectedMode.tournament)
          tournament!.innerHTML = '&#x25b6;';
        else
          tournament!.innerHTML = '';
    } else if (e.code === "Enter") {
      if (this.selectedMode.versusAi) {
        this.onUnMount()
        versusAiLink!.click();
      }
      else if (this.selectedMode.versusPlayer) {
        this.onUnMount()
        versusPlayerLink!.click();
      }
      else if (this.selectedMode.tournament) {
        this.onUnMount()
        tournamentLink!.click();
      }
    }
  } 

  async onMount(gameContext: TiamaPong, appElement: Element) {
    if (this.keyHandler) {
      document.removeEventListener("keydown", this.keyHandler);
    }

    this.keyHandler = (event: KeyboardEvent) => {
      this.moveCursor(event, gameContext);
    };

    document.addEventListener("keydown", this.keyHandler);
  }

  async beforeMount(gameContext: TiamaPong | null): Promise<boolean> {
    return true;
  }

  async onUnMount() {
    if (this.keyHandler) {
      document.removeEventListener("keydown", this.keyHandler);
      this.keyHandler = undefined;
    }
  }
}
