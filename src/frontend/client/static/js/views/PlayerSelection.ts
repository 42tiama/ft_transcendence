import AbstractView from './AbstractView.js';
import User from '../../../game/entities/User.js';
import TiamaPong from '../../../game/entities/TiamaPong.js';

export default class PlayerSelection extends AbstractView {
  public gameContext: TiamaPong;
  private static availablePlayers: User[] = [];
  public static selectedPlayers: User[] = [];

  constructor() {
    super();
    this.setTitle("Player selection");
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

  playerSelection(e: MouseEvent) {
    if (e.target instanceof HTMLElement) {
      const h3 = e.target.closest(".player")?.querySelector("h3");

      if (h3) {
        PlayerSelection.selectedPlayers.push(
          this.gameContext.users.find(
            (user) => user.displayName === h3.textContent?.trim()
          )
        );
        const index = PlayerSelection.availablePlayers.findIndex(player => player.displayName === h3.textContent?.trim())
        PlayerSelection.availablePlayers.splice(index, 1);
        this.renderPlayerCard();
        console.log("player inside playerSelection function: ", h3.textContent?.trim());
      }
    }
  }

  renderPlayerCard() {
    const availablePlayersContainer = document.getElementById('available-players');
    const selectedPlayersContainer = document.getElementById('selected-players');

    availablePlayersContainer.innerHTML = '';
    selectedPlayersContainer.innerHTML = '';

    // Render each player
    PlayerSelection.availablePlayers.forEach(player => {
      // Create the main player card div
      const playerCard = document.createElement('div');
      playerCard.className = 'player bg-yellow-500 text-black p-4 rounded-xl flex flex-col items-center cursor-pointer hover:scale-105 transition-all duration-200';
      
      // Create the avatar div
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'w-14 h-14 bg-white rounded-full mb-2';
      
      // Create the name h3 element
      const nameH3 = document.createElement('h3');
      nameH3.className = 'font-bold';
      nameH3.textContent = player.displayName; // or player.name depending on your User interface
      
      // Append avatar and name to the player card
      playerCard.appendChild(avatarDiv);
      playerCard.appendChild(nameH3);
      
      // Append the player card to the container
      availablePlayersContainer.appendChild(playerCard);
    });

    PlayerSelection.selectedPlayers.forEach(player => {
      // Create the main player card div
      const playerCard = document.createElement('div');
      playerCard.className = 'player bg-yellow-500 text-black p-4 rounded-xl flex flex-col items-center cursor-pointer hover:scale-105 transition-all duration-200';
      
      // Create the avatar div
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'w-14 h-14 bg-white rounded-full mb-2';
      
      // Create the name h3 element
      const nameH3 = document.createElement('h3');
      nameH3.className = 'font-bold';
      nameH3.textContent = player.displayName; // or player.name depending on your User interface
      
      // Append avatar and name to the player card
      playerCard.appendChild(avatarDiv);
      playerCard.appendChild(nameH3);
      
      // Append the player card to the container
      selectedPlayersContainer.appendChild(playerCard);
    });
  }

  async beforeMount(gameContext: TiamaPong | null): Promise<boolean> {
    return;
  }

  async onMount(gameContext: TiamaPong | null, appElement: Element | null) {
    document.body.addEventListener("click", (e: MouseEvent) => this.playerSelection(e));
    this.gameContext = gameContext;
    PlayerSelection.availablePlayers = gameContext.users;
    this.renderPlayerCard();
  }
}
