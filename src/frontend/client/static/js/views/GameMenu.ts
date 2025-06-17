import AbstractView from './AbstractView.js';

export default class GameMenu extends AbstractView {
  selectedMode: { versus: boolean, tournament: boolean};

  constructor() {
    super();
    this.setTitle('Menu');
    this.selectedMode = {
      versus: true,
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

  moveCursor = (e: KeyboardEvent) => {
    const versus = document.getElementById("versus");
    const tournament = document.getElementById("tournament");
    if (!versus || !tournament) return; // Adicionado para evitar erro se os elementos não existirem
    if (e.code === "ArrowDown" || e.code === "ArrowUp") {
        e.preventDefault();
        if (e.type === "keydown") {
          this.selectedMode.versus = !this.selectedMode.versus;
          this.selectedMode.tournament = !this.selectedMode.tournament;
        }
        if (this.selectedMode.versus)
          versus.innerHTML = '&#x25b6;';
        else
          versus.innerHTML = '';
        
        if (this.selectedMode.tournament)
          tournament.innerHTML = '&#x25b6;';
        else
          tournament.innerHTML = '';
    } //else if (e.code === "enter") {
      //if (this.selectedMode.versus) {
        // startVersusMatch();
      //}
      //else if (this.selectedMode.tournament) {
        // startNewTournament();
      //}
    //}
  } 

  async onMount() {
    document.addEventListener("keydown", this.moveCursor);
  }
}
