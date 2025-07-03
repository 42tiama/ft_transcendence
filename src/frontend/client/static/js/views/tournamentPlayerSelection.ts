import AbstractView from './AbstractView.js';
import User from '../../../game/entities/User.js';
import TiamaPong from '../../../game/entities/TiamaPong.js';

// sets the API base URL to the API gateway for all authentication requests.
const API_BASE = 'https://localhost:8044';

export default class PlayerSelection extends AbstractView {
  public gameContext: TiamaPong | null = null;
  private availablePlayers: User[] = [];
  private boundPlayerSelection: (e: MouseEvent) => void;
  private boundBeforeUnload: () => void;
  // public  selectedPlayers: User[] = [];

  constructor() {
    super();
    this.setTitle("Player selection");
    this.boundPlayerSelection = (e: MouseEvent) => this.playerSelection(e);
    this.boundBeforeUnload = () => this.onUnMount();
  }

  async getHtml(): Promise<string> {
    try {
      const response = await fetch(
        "build/static/html/tournament-player-selection.html"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error("Error loading template:", error);
      return '<h1 class="h-96 bg-amber-600">Error Loading the game menu</h1>';
    }
  }

  async playerSelection(e: MouseEvent) {
    if (e.target instanceof HTMLElement) {
      const playerCard = e.target.closest(".player") as HTMLElement;

      //toggle players between available/selected
      if (playerCard) {
        const cardDisplayName = playerCard.dataset.displayName!;
        const userInAvailable = this.availablePlayers.find((user) => user.displayName === cardDisplayName);

        if (userInAvailable) {
          // Move from available to selected
          this.gameContext!.preTournamentSelection.push(userInAvailable);
          const index = this.availablePlayers.findIndex(player => player.displayName === cardDisplayName);
          this.availablePlayers.splice(index, 1);

          // Move the card DOM element - automatically removes the element from its current parent
          const selectedPlayersContainer = document.getElementById('selected-players')!;
          selectedPlayersContainer.appendChild(playerCard);

          console.log("player moved to selected: ", cardDisplayName);
        } else {
          // Move from selected to available
          const userInSelected = this.gameContext?.preTournamentSelection.find((user) => user.displayName === cardDisplayName);
          if (userInSelected) {
            this.availablePlayers.push(userInSelected);
            const index = this.gameContext?.preTournamentSelection.findIndex(player => player.displayName === cardDisplayName);
            if (index != null && index >= 0) {
              this.gameContext!.preTournamentSelection.splice(index, 1);

              // Move the card DOM element - automatically removes the element from its current parent
              const availablePlayersContainer = document.getElementById('available-players')!;
              availablePlayersContainer.appendChild(playerCard);

              console.log("player moved to available: ", cardDisplayName);
            }
          }
        }
      }
    }
  }

  async renderPlayerCards(gameContext: TiamaPong | null) {
    const availablePlayersContainer = document.getElementById('available-players')!;
    const selectedPlayersContainer = document.getElementById('selected-players')!;

    availablePlayersContainer.innerHTML = '';
    selectedPlayersContainer.innerHTML = '';

    // Render available players
    for (const player of this.availablePlayers) {
      if (player && player.id != gameContext!.sessionUser!.id ) {
        await this.getPlayerCard(player.id, availablePlayersContainer);
      }
    }

    // Render selected players
    for (const player of gameContext!.preTournamentSelection) {
      if (player && player.id != gameContext!.sessionUser!.id ) {
        await this.getPlayerCard(player.id, selectedPlayersContainer);
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
    playerCard.className = 'w-32 h-38 player border-8 border-white/10 text-black p-4 rounded-xl flex flex-col items-center cursor-pointer hover:scale-105 transition-all duration-200';
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

    // Create the name h3 element
    const nameH3 = document.createElement('h3');
    nameH3.className = 'font-bold text-center text-sm leading-tight break-words text-white';
    nameH3.textContent = displayName;

    // Append avatar and name to the player card
    playerCard.appendChild(avatarDiv);
    playerCard.appendChild(nameH3);

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
  async beforeMount(gameContext: TiamaPong): Promise<boolean> {
    return true;
  }

  async onMount(gameContext: TiamaPong) {
    document.body.addEventListener("click", this.boundPlayerSelection);
    window.addEventListener("beforeunload", this.boundBeforeUnload);
    const userId = localStorage.getItem('userId');
    this.gameContext = gameContext;
    this.availablePlayers = [...await gameContext.gameServices.player!.getAllPlayers()];
    gameContext.sessionUser = await gameContext.gameServices.player!.getPlayerById(parseInt(userId!));
    if (!gameContext.preTournamentSelection.find(id => id.id === gameContext.sessionUser!.id)) {
      gameContext.preTournamentSelection.push(gameContext.sessionUser!);
    }
    this.renderPlayerCards(gameContext);
  }

  async onUnMount() {
    document.body.removeEventListener("click", this.boundPlayerSelection);
    window.removeEventListener("beforeunload", this.boundBeforeUnload);
    this.gameContext!.preTournamentSelection = [];
    this.gameContext = null;
    this.availablePlayers = [];
  }

}
