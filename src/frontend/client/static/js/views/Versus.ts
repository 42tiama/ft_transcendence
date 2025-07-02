import AbstractView from './AbstractView.js';
import TiamaPong from '../../../game/entities/TiamaPong.js';
import Game from '../../../game/entities/Game.js';
import Match from '../../../game/entities/Match.js';

export default class Versus extends AbstractView {
  private game: Game | null = null;

  constructor() {
    super(); 
    this.setTitle('Versus');
  }

  async getHtml(): Promise<string> {
    try {
      const response = await fetch('build/static/html/versus.html');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error loading template:', error);
      return '<h1 class="h-96 bg-amber-600">Error Loading versus</h1>';
    }
  }

  async beforeMount(gameContext: TiamaPong) : Promise<boolean> {
    if (gameContext.preVersusSelection) {
      // this.onMount(gameContext);
      return true;
    }

    else {
        alert('Select an opponent first.');
        return false;
    }
  }

  async renderCardInfo(currentMatch: Match): Promise<void> {
    const displayNameP1 = document.getElementById('p1-display-name');
    const displayNameP2 = document.getElementById('p2-display-name');
    const p1Avatar = document.getElementById('p1Avatar');
    const p2Avatar = document.getElementById('p2Avatar');
    const p1Wins = document.getElementById('p1-wins');
    const p1Losses = document.getElementById('p1-losses');
    const p2Wins = document.getElementById('p2-wins');
    const p2Losses = document.getElementById('p2-losses');

    displayNameP1!.innerHTML = currentMatch.player1.displayName;
    displayNameP2!.innerHTML = currentMatch.player2!.displayName;
    p1Avatar!.innerHTML = currentMatch.player1.displayName.charAt(0);
    p2Avatar!.innerHTML = currentMatch.player2!.displayName.charAt(0);
    p1Wins!.innerHTML = `Wins: ${currentMatch.player1.wins.toString()}`;
    p1Losses!.innerHTML = `Losses: ${currentMatch.player1.losses.toString()}`;
    p2Wins!.innerHTML = `Wins: ${currentMatch.player2!.wins.toString()}`;
    p2Losses!.innerHTML = `Losses: ${currentMatch.player2!.losses.toString() || '0'}`;
  };

  private async renderFreezeTimeModalInfo(currentMatch: Match): Promise<void> {
    const displayNameP1 = document.querySelector('#player1')!;
    const displayNameP2 = document.querySelector('#player2')!;
    displayNameP1.textContent = currentMatch.player1.displayName;
    displayNameP2.textContent = currentMatch.player2!.displayName;

    const startButton = document.querySelector('#start-button')! as HTMLButtonElement;
    const modal = document.querySelector('#freeze-time-modal')! as HTMLElement;
    let countDown: number = 1;

    if (modal.classList.contains('hidden')) {
      modal.classList.replace('hidden', 'flex');
    }

    if (startButton.disabled == true) {
      startButton.disabled = false;
      startButton.style.backgroundColor = "#00bc7d";
      startButton.innerHTML = 'Press Start to Play';
    }
    
    if (startButton) {
      return new Promise<void>((resolve) => {
        const clickHandler = (event: MouseEvent) => {
          startButton.disabled = true;
          startButton.style.backgroundColor = "#002c16";

          const countdownInterval = setInterval(() => {
            startButton.innerHTML = `Starting in... ${countDown}`;
            if (countDown < 0) {
              clearInterval(countdownInterval);
              modal.classList.replace('flex', 'hidden');
              startButton.removeEventListener('click', clickHandler);
              resolve();
              return;
            }
            countDown--;
          }, 1000);
        };
        startButton.addEventListener('click', clickHandler, { once: true });
      });
    };
  }
  
  private async renderPvpInfo(currentMatch: Match) {
    this.renderCardInfo(currentMatch);
    await this.renderFreezeTimeModalInfo(currentMatch);
  }

  private async renderMatchWinner(match: Match): Promise<boolean> {
    const matchWinnerModal = document.querySelector('#match-winner-modal')! as HTMLElement;
    const winner = document.querySelector('#winner-display-name')! as HTMLElement;
    const reMatchButton = document.querySelector('#next-match-button')! as HTMLButtonElement;

    matchWinnerModal.classList.replace('hidden', 'flex');
    winner.innerHTML = match.winner!.displayName;

    return new Promise<boolean>((resolve) => {
      reMatchButton.addEventListener('click', (event: MouseEvent) => {
        matchWinnerModal.classList.replace('flex', 'hidden');
        resolve(true);
      }, { once: true })
    })
  }

  async runPvp(gameContext: TiamaPong): Promise<void> {
    let isRunning = true;
    let currentMatch = new Match('versus-player', null, gameContext.sessionUser!, gameContext.preVersusSelection);
    
    while (isRunning) {
      await this.renderPvpInfo(currentMatch);
      this.game = new Game(currentMatch, 'board');
      await this.game.startMatch(currentMatch);
      let retry = await this.renderMatchWinner(currentMatch);
      if (!retry)
        isRunning = false;
      currentMatch = new Match('versus-player', null, gameContext.sessionUser!, gameContext.preVersusSelection);
    }
  }

  async onMount(gameContext: TiamaPong) {
    await this.runPvp(gameContext);
  }

  async onUnMount() {
    this.game?.cancelGame();
  }
  
}
