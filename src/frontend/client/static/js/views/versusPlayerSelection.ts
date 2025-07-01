import AbstractView from './AbstractView.js';
import TiamaPong from '../../../game/entities/TiamaPong.js';
import User from '../../../game/entities/User.js';

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
      currentlySelected.classList.remove('border-8', 'border-fuchsia-600', 'animate-pulse', 'selected')
    }

    if (e.target instanceof HTMLElement) {
      const h3 = e.target.closest(".player")?.querySelector("h3");

      if (h3) {
        gameContext!.preVersusSelection = this.availablePlayers.find(
            (user) => user.displayName === h3.textContent!.trim()
        )!;
        h3.parentElement!.classList.replace('border-white/10', 'border-fuchsia-600')
        h3.parentElement!.classList.add('border-8', 'animate-pulse', 'selected');
        console.log(`Selected player: ${gameContext.preVersusSelection.displayName}`);
      } else {
        gameContext!.preVersusSelection = null;
      }
    }
  }

  renderPlayerCard(gameContext: TiamaPong) {
    const availablePlayersContainer = document.getElementById('available-players')!;

    availablePlayersContainer.innerHTML = '';

    this.availablePlayers.forEach(player => {
      if (player && player.id != gameContext.sessionUser?.id) {
        const playerCard = document.createElement('div');
        playerCard.className = 'player bg-yellow-500 border-8 border-white/10 text-black p-4 rounded-xl flex flex-col items-center cursor-pointer hover:scale-105 transition-all duration-200';
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'w-14 h-14 text-5xl text-center font-extrabold bg-white rounded-full mb-2';
        avatarDiv.innerHTML = player.displayName.charAt(0);
        
        const nameH3 = document.createElement('h3');
        nameH3.className = 'font-bold';
        nameH3.textContent = player.displayName;
        
        playerCard.appendChild(avatarDiv);
        playerCard.appendChild(nameH3);
        
        availablePlayersContainer.appendChild(playerCard);
      }
    });
  }

  async onMount(gameContext: TiamaPong, appElement: Element | null) {
    this.availablePlayers = gameContext!.users; // Iury, Andre, aqui também precisar chamar o metodo get que faz o fetch dos users
    this.boundPlayerSelection = (e: MouseEvent) => this.playerSelection(e, gameContext);
    const availablePlayersContainer = document.getElementById('available-players');
    availablePlayersContainer!.addEventListener("click", (e: MouseEvent) => this.playerSelection(e, gameContext));
    this.renderPlayerCard(gameContext);
  }

  async beforeMount(gameContext: TiamaPong | null): Promise<boolean> {
    return true;
  }

  async onUnMount() {
    document.getElementById('available-players')?.removeEventListener("click", this.boundPlayerSelection);
  }
}
