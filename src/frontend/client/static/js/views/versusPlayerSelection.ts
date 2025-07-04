import AbstractView from './AbstractView.js';
import TiamaPong from '../../../game/entities/TiamaPong.js';
import User from '../../../game/entities/User.js';

// sets the API base URL to the API gateway for all authentication requests.
const API_BASE = 'https://localhost:8044';

export default class VersusPlayerSelection extends AbstractView {

    private availablePlayers: User[] = [];
    private boundPlayerSelection: (e: MouseEvent) => void = () => {};

  constructor() {
    super();
    this.setTitle('Versus Player Selection');
  }

  async getHtml(): Promise<string> {
    try {
      const response = await fetch('build/static/html/versus-player-selection.html');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error loading template:', error);
      return '<h1 class="h-96 bg-amber-600">Error Loading Versus Player Selection</h1>';
    }
  }

  playerSelection(e: MouseEvent, gameContext: TiamaPong) {
    const currentlySelected = document.querySelector('.selected');

    if (currentlySelected){
      currentlySelected.classList.replace('border-fuchsia-600', 'border-white/10');
      currentlySelected.classList.remove('border-4', 'border-fuchsia-600', 'animate-pulse', 'selected')
    }

    if (e.target instanceof HTMLElement) {
      const h3 = e.target.closest(".player")?.querySelector("h3");

      if (h3) {
        gameContext!.preVersusSelection = this.availablePlayers.find((user) => user.displayName === h3.textContent!.trim())!;
        h3.parentElement!.classList.replace('border-white/10', 'border-fuchsia-600')
        h3.parentElement!.classList.add('border-4', 'animate-pulse', 'selected');
        console.log(`Selected player: ${gameContext.preVersusSelection.displayName}`);
      } else {
        gameContext!.preVersusSelection = null;
      }
    }
  }

  async renderPlayerCards(gameContext: TiamaPong) {
    const availablePlayersContainer = document.getElementById('available-players')!;

    availablePlayersContainer.innerHTML = '';

    // Render available players
    for (const player of this.availablePlayers) {
      if (player && player.id != gameContext.sessionUser?.id ) {
        await this.getPlayerCard(player.id, availablePlayersContainer);
      }
    }
  }

  async getPlayerCard(playerId:number, container: HTMLElement) {
    // Fetch player profile data
    const profileData = await this.getPlayerProfile(playerId);

    // Use profile data if available, otherwise fallback to player data
    const displayName = profileData?.displayName as string;
    const cardColor = profileData?.cardColor as string;
    const avatarUrl = profileData?.avatarUrl;

    // Create the main player card div
    const playerCard = document.createElement('div');
    playerCard.className = 'w-34 h-40 player border-8 border-white/10 text-black p-4 rounded-xl flex flex-col items-center cursor-pointer hover:scale-103 transition-all duration-200';
    playerCard.style.backgroundColor = cardColor;
    playerCard.dataset.playerId = playerId.toString(); // Store player ID for easy lookup
    playerCard.dataset.displayName = displayName; // Store display name for easy lookup

    // Create the avatar div
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'w-16 h-16 text-5xl text-center font-extrabold bg-white rounded-full mb-4 flex items-center justify-center overflow-hidden text-gray-700';

      // Use profile avatar if available, otherwise use display name initial
      if (avatarUrl) {
        const img = document.createElement('img');
        img.src = `${API_BASE}${avatarUrl}`;
        img.className = 'w-full h-full object-contain rounded-full bg-white';
        img.alt = `${displayName}'s avatar`;
        avatarDiv.appendChild(img);
      } else {
        avatarDiv.innerHTML = displayName.charAt(0);
      }

      // Create the display name element
      const displayNameElement = document.createElement('h3');
      displayNameElement.className = 'font-bold text-center text-sm leading-tight break-words text-white';
      displayNameElement.textContent = displayName;

      // Append avatar and display name to player card
      playerCard.appendChild(avatarDiv);
      playerCard.appendChild(displayNameElement);

      // Append the player card to the container
      container.appendChild(playerCard);

  }

  // Fetch player profile data from profile service
  async getPlayerProfile(playerId: number): Promise<{displayName: string, avatarUrl: string, cardColor: string} | null> {
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

  async onMount(gameContext: TiamaPong, appElement: Element | null) {
    const userId = localStorage.getItem('userId');
    this.availablePlayers = [...await gameContext.gameServices.player!.getAllPlayers()];
    gameContext.sessionUser = await gameContext.gameServices.player!.getPlayerById(parseInt(userId!));
    this.boundPlayerSelection = (e: MouseEvent) => this.playerSelection(e, gameContext);
    const availablePlayersContainer = document.getElementById('available-players');
    availablePlayersContainer!.addEventListener("click", (e: MouseEvent) => this.playerSelection(e, gameContext));
    await this.renderPlayerCards(gameContext);
  }

  async beforeMount(gameContext: TiamaPong | null): Promise<boolean> {
    return true;
  }

  async onUnMount() {
    document.getElementById('available-players')?.removeEventListener("click", this.boundPlayerSelection);
  }
}
