import AbstractView from './AbstractView.js';
import User from '../../../game/entities/User.js';
import TiamaPong from '../../../game/entities/TiamaPong.js';

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

  playerSelection(e: MouseEvent) {
    if (e.target instanceof HTMLElement) {
      const h3 = e.target.closest(".player")?.querySelector("h3");

      if (h3) {
        const foundUser = this.availablePlayers.find((user) => user.displayName === h3.textContent!.trim(), this.availablePlayers)!;
        if (foundUser != undefined) {
          this.gameContext!.preTournamentSelection.push(foundUser);
          const index = this.availablePlayers.findIndex(player => player.displayName === h3.textContent?.trim())
          this.availablePlayers.splice(index, 1);
          console.log("player inside pretournamentSelection array: ", h3.textContent?.trim());
        } else {
          const foundUser = this.gameContext?.preTournamentSelection.find((user) => user.displayName === h3.textContent!.trim())!;
          if (foundUser != undefined) {
            this.availablePlayers.push(foundUser);
            const index = this.gameContext?.preTournamentSelection.findIndex(player => player.displayName === h3.textContent?.trim())
            if (index != null && index >= 0) {
              this.gameContext!.preTournamentSelection.splice(index, 1);
              console.log("player inside availablePlayers array: ", h3.textContent?.trim());
            }
          }
        }
        this.renderPlayerCard(this.gameContext);
      }
    }
  }

  renderPlayerCard(gameContext: TiamaPong | null) {
    const availablePlayersContainer = document.getElementById('available-players')!;
    const selectedPlayersContainer = document.getElementById('selected-players')!;

    availablePlayersContainer.innerHTML = '';
    selectedPlayersContainer.innerHTML = '';

    // Render each player
    this.availablePlayers.forEach(player => {
      if (player && player.id != gameContext!.sessionUser!.id ) {
        // Create the main player card div
        const playerCard = document.createElement('div');
        playerCard.className = 'min-w-34 min-h-38 player bg-yellow-500 border-8 border-white/10 text-black p-4 rounded-xl flex flex-col items-center cursor-pointer hover:scale-105 transition-all duration-200';
        
        // Create the avatar div
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'w-14 h-14 text-5xl bg-white text-center font-extrabold bg-red rounded-full mb-2';
        avatarDiv.innerHTML = player.displayName.charAt(0);
        
        // Create the name h3 element
        const nameH3 = document.createElement('h3');
        nameH3.className = 'font-bold';
        nameH3.textContent = player.displayName;
        
        // Append avatar and name to the player card
        playerCard.appendChild(avatarDiv);
        playerCard.appendChild(nameH3);
        
        // Append the player card to the container
        availablePlayersContainer.appendChild(playerCard);
      }
    });

    this.gameContext!.preTournamentSelection.forEach(player => {
      // Create the main player card div
      const playerCard = document.createElement('div');
      playerCard.className = 'min-w-34 min-h-38 player bg-yellow-500 border-8 border-white/10 text-black p-4 rounded-xl flex flex-col items-center cursor-pointer hover:scale-105 transition-all duration-200';
      
      // Create the avatar div
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'w-14 h-14 text-5xl text-center font-extrabold bg-white rounded-full mb-2';
      avatarDiv.innerHTML = player.displayName.charAt(0);
      
      // Create the name h3 element
      const nameH3 = document.createElement('h3');
      nameH3.className = 'font-bold';
      nameH3.textContent = player.displayName;
      
      // Append avatar and name to the player card
      playerCard.appendChild(avatarDiv);
      playerCard.appendChild(nameH3);
      
      // Append the player card to the container
      selectedPlayersContainer.appendChild(playerCard);
    });
  }

  async beforeMount(gameContext: TiamaPong): Promise<boolean> {
    return true;
  }

  async onMount(gameContext: TiamaPong) {
    document.body.addEventListener("click", this.boundPlayerSelection);
    window.addEventListener("beforeunload", this.boundBeforeUnload);
    this.gameContext = gameContext;
    this.availablePlayers = [...gameContext.users]; // Iury, Andre, aqui eu chamaria o metodo get pra fazer o fetch dos usuarios do banco, 
    // em vez de fazer isso no TiamaPong e passar por contexto, vai para os bugs na selecao dos players qdo sair da pagina, refresh etc....
    this.renderPlayerCard(gameContext);
  }

  async onUnMount() {
    document.body.removeEventListener("click", this.boundPlayerSelection);
    window.removeEventListener("beforeunload", this.boundBeforeUnload);
    this.gameContext!.preTournamentSelection = [];
    this.gameContext = null;
    this.availablePlayers = [];
  }

}
