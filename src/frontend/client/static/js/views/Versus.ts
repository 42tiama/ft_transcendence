import AbstractView from './AbstractView.js';
import TiamaPong from '../../../game/entities/TiamaPong.js';
import Game from '../../../game/entities/Game.js';
import Match from '../../../game/entities/Match.js';

// sets the API base URL to the API gateway for all authentication requests.
const API_BASE = 'https://localhost:8044';

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

  async renderPageInfo(appElement: Element, currentMatch: Match): Promise<void> {
    // Fetch profile data for both players
    const player1Profile = await this.getPlayerProfile(currentMatch.player1.id);
    const player2Profile = await this.getPlayerProfile(currentMatch.player2!.id);

    const displayNameP1 = appElement.querySelector('#p1-display-name');
    const displayNameP2 = appElement.querySelector('#p2-display-name');
    const p1Avatar = appElement.querySelector('#p1-avatar');
    const p2Avatar = appElement.querySelector('#p2-avatar');
    const p1Wins = appElement.querySelector('#p1-wins');
    const p1Losses = appElement.querySelector('#p1-losses');
    const p2Wins = appElement.querySelector('#p2-wins');
    const p2Losses = appElement.querySelector('#p2-losses');

    if (player1Profile && player2Profile) {
      displayNameP1!.innerHTML = player1Profile?.displayName || currentMatch.player1.displayName;
      displayNameP2!.innerHTML = player2Profile?.displayName || currentMatch.player2!.displayName;

      // Update avatars
      if (p1Avatar) {
        if (player1Profile?.avatarUrl) {
          p1Avatar.innerHTML = `<img src="${API_BASE}${player1Profile.avatarUrl}" class="w-full h-full object-contain rounded-full bg-white" alt="${player1Profile.displayName}'s avatar">`;
        } else {
          p1Avatar.innerHTML = (player1Profile?.displayName || currentMatch.player1.displayName).charAt(0);
        }
      }
      if (p2Avatar) {
        if (player2Profile?.avatarUrl) {
          p2Avatar.innerHTML = `<img src="${API_BASE}${player2Profile.avatarUrl}" class="w-full h-full object-contain rounded-full bg-white" alt="${player2Profile.displayName}'s avatar">`;
        } else {
          p2Avatar.innerHTML = (player2Profile?.displayName || currentMatch.player2!.displayName).charAt(0);
        }
      }

      // Update card colors
      const p1Card = appElement.querySelector('#p1-card') as HTMLElement;
      const p2Card = appElement.querySelector('#p2-card') as HTMLElement;
      if (p1Card && player1Profile?.cardColor) {
        p1Card.style.backgroundColor = player1Profile.cardColor;
      }
      if (p2Card && player2Profile?.cardColor) {
        p2Card.style.backgroundColor = player2Profile.cardColor;
      }
    }

    p1Wins!.innerHTML = `Wins: ${currentMatch.player1.wins.toString()}`;
    p1Losses!.innerHTML = `Losses: ${currentMatch.player1.losses.toString()}`;
    p2Wins!.innerHTML = `Wins: ${currentMatch.player2!.wins.toString()}`;
    p2Losses!.innerHTML = `Losses: ${currentMatch.player2!.losses.toString() || '0'}`;
  };

  // Fetch player profile data from profile service
  private async getPlayerProfile(playerId: number): Promise<{displayName: string, avatarUrl: string, cardColor: string} | null> {
    try {
      const response = await fetch(`${API_BASE}/profile-by-id/${playerId}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching player profile:', error);
      return null;
    }
  }

  private async renderFreezeTimeModalInfo(appElement: Element, currentMatch: Match): Promise<void> {
    // Fetch profile data for both players
    const player1Profile = await this.getPlayerProfile(currentMatch.player1.id);
    const player2Profile = await this.getPlayerProfile(currentMatch.player2!.id);

    if (player1Profile && player2Profile) {
      const displayNameP1 = appElement.querySelector('#player1-freeze-name');
      const displayNameP2 = appElement.querySelector('#player2-freeze-name');
      displayNameP1!.innerHTML = player1Profile?.displayName || currentMatch.player1.displayName;
      displayNameP2!.innerHTML = player2Profile?.displayName || currentMatch.player2!.displayName;

      // Update avatars
      const avatar1 = appElement.querySelector('#player1-freeze-avatar') as HTMLElement;
      const avatar2 = appElement.querySelector('#player2-freeze-avatar') as HTMLElement;

      if (avatar1) {
        if (player1Profile?.avatarUrl) {
          avatar1.innerHTML = `<img src="${API_BASE}${player1Profile.avatarUrl}" class="w-full h-full object-contain rounded-full bg-white" alt="${displayNameP1}'s avatar">`;
        } else {
          avatar1.innerHTML = player1Profile.displayName.charAt(0);
        }
      }

      if (avatar2) {
        if (player2Profile?.avatarUrl) {
          avatar2.innerHTML = `<img src="${API_BASE}${player2Profile.avatarUrl}" class="w-full h-full object-contain rounded-full bg-white" alt="${displayNameP2}'s avatar">`;
        } else {
          avatar2.innerHTML = player2Profile.displayName.charAt(0);
        }
      }

      // Update card colors
      const card1 = appElement.querySelector('#player1-freeze-card') as HTMLElement;
      const card2 = appElement.querySelector('#player2-freeze-card') as HTMLElement;
      if (card1 && player1Profile?.cardColor) {
        card1.style.backgroundColor = player1Profile.cardColor;
      }
      if (card2 && player2Profile?.cardColor) {
        card2.style.backgroundColor = player2Profile.cardColor;
      }
    }

    const startButton = appElement.querySelector('#start-button')! as HTMLButtonElement;
    const modal = appElement.querySelector('#freeze-time-modal')! as HTMLElement;
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


  private async renderPvpInfo(appElement: Element, currentMatch: Match) {
    await this.renderPageInfo(appElement, currentMatch);
    await this.renderFreezeTimeModalInfo(appElement, currentMatch);
  }

  private async renderMatchWinner(appElement: Element, match: Match): Promise<boolean> {
    const matchWinnerModal = appElement.querySelector('#match-winner-modal')! as HTMLElement;
    const winner = appElement.querySelector('#winner-display-name')! as HTMLElement;
    const winnerAvatar = appElement.querySelector('#winner-avatar')! as HTMLElement;
    const reMatchButton = appElement.querySelector('#rematch-button')! as HTMLButtonElement;

    matchWinnerModal.classList.replace('hidden', 'flex');

    // Fetch winner profile data
    const winnerProfile = await this.getPlayerProfile(match.winner!.id);

    // Update winner display name
    winner.innerHTML = winnerProfile?.displayName || match.winner!.displayName;

    // Update winner avatar
    if (winnerAvatar) {
      if (winnerProfile?.avatarUrl) {
        winnerAvatar.innerHTML = `<img src="${API_BASE}${winnerProfile.avatarUrl}" class="w-full h-full object-contain rounded-full bg-white" alt="${winnerProfile.displayName}'s avatar">`;
      } else {
        winnerAvatar.innerHTML = (winnerProfile?.displayName || match.winner!.displayName).charAt(0);
      }
    }

    // Update winner card color
    const winnerCard = appElement.querySelector('#winner-card') as HTMLElement;
    if (winnerCard && winnerProfile?.cardColor) {
      winnerCard.style.backgroundColor = winnerProfile.cardColor;
    }

    return new Promise<boolean>((resolve) => {
      reMatchButton.addEventListener('click', (event: MouseEvent) => {
        matchWinnerModal.classList.replace('flex', 'hidden');
        resolve(true);
      }, { once: true })
    })
  }

  async runPvp(appElement: Element, gameContext: TiamaPong): Promise<void> {
    let isRunning = true;
    let currentMatch = new Match('versus-player', null, gameContext.sessionUser!, gameContext.preVersusSelection);

    while (isRunning) {
      await this.renderPvpInfo(appElement, currentMatch);
      this.game = new Game(currentMatch, 'board');
      await this.game.startMatch(currentMatch);
      let retry = await this.renderMatchWinner(appElement, currentMatch);
      if (!retry)
        isRunning = false;
      currentMatch = new Match('versus-player', null, gameContext.sessionUser!, gameContext.preVersusSelection);
    }
  }

  async onMount(gameContext: TiamaPong) {
    const appElement = document.querySelector('#app')!;
    await this.runPvp(appElement, gameContext);
  }

  async onUnMount() {
    this.game?.cancelGame();
  }

}
