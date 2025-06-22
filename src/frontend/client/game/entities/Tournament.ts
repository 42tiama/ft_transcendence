import Match from "./Match.js";
import User from "./User.js";
import TiamaPong  from "./TiamaPong.js";
import Game from "./Game.js";

export default class Tournament {
  tournamentId: string;
  currentRound: Match[] = [];
  totalPlayers: number;
  totalMatches: number;
  nextPowerOf2: number;
  totalByes: number;
  byes: User[] = [];
  firstRoundTotalParticipants: number;
  totalRounds: number;
  tournamentFinished: boolean = false;
  matchTitle: string = '';

  constructor(gameContext: TiamaPong) {
    this.tournamentInit(gameContext);
  }

  private tournamentInit(gameContext: TiamaPong) {
    this.totalPlayers = gameContext.preTournamentSelection.length;
    this.totalMatches = this.totalPlayers - 1;
    this.nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(this.totalPlayers)));
    this.totalByes = this.nextPowerOf2 - this.totalPlayers;
    this.firstRoundTotalParticipants = this.totalPlayers - this.totalByes;
    this.totalRounds = Math.ceil(Math.log2(this.nextPowerOf2));
    console.log("INIT DONE!");
    console.log(`
            totalPlayers: ${this.totalPlayers}\n
            totalMatches: ${this.totalMatches}\n
            nextPowerOf2: ${this.nextPowerOf2}\n
            totalByes: ${this.totalByes}\n
            firstRoundTotalParticipants: ${this.firstRoundTotalParticipants}\n
            totalRounds: ${this.totalRounds}`);
    this.createFirstRound(gameContext);
    // this.debugPrintRoundArray();
  }

  private debugPrintParticipantsArray(participants: User[]): void {
    for (let i = 0; i < participants.length; i++) {
      console.log(`player ${i}: ${participants[i].displayName}\n`);
    }
  }

  public debugPrintRoundArray(): void {
    for (let i = 0; i < this.currentRound.length; i++) {
      console.log(`Match ${i}\n`);
      console.log(`player 1: ${this.currentRound[i].player1.displayName}\n VS `);
      console.log(`player 2: ${this.currentRound[i].player2.displayName}\n`);
    }
    console.log(`Byers: \n`);
    for (let i = 0; i <= this.byes.length; i++) {
      console.log(`Byer ${i}: `);
      console.log(`${this.byes[i].displayName}`);
    }
  }

  private shuffleParticipants(participants: User[]): User[] {
    console.log("Before shuffle: ");
    this.debugPrintParticipantsArray(participants);
    for (let i = participants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [participants[i], participants[j]] = [participants[j], participants[i]];
    }
    console.log("After shuffle: ");
    this.debugPrintParticipantsArray(participants);
    return participants;
  }

  renderPageInfo(appElement: Element | null, currentMatch: Match, nextMatch: Match | null) {
    const displayNameP1 = appElement.querySelector('#p1-display-name');
    const displayNameP2 = appElement.querySelector('#p2-display-name');
    const p1Wins = appElement.querySelector('#p1-wins');
    const p1Losses = appElement.querySelector('#p1-losses');
    const p2Wins = appElement.querySelector('#p2-wins');
    const p2Losses = appElement.querySelector('#p2-losses');

    const matchTitle = appElement.querySelector('#match-title') as HTMLElement;
    const nextMatchInfo = appElement.querySelector('#next-match-info') as HTMLElement;
    const nextMatchP1 = appElement.querySelector('#next-match-p1');
    const nextMatchP2 = appElement.querySelector('#next-match-p2');

    displayNameP1.innerHTML = currentMatch.player1.displayName ;
    displayNameP2.innerHTML = currentMatch.player2.displayName;
    p1Wins.innerHTML = `Wins: ${currentMatch.player1.wins.toString()}`;
    p1Losses.innerHTML = `Losses: ${currentMatch.player1.losses.toString()}`;
    p2Wins.innerHTML = `Wins: ${currentMatch.player2.wins.toString()}`;
    p2Losses.innerHTML = `Losses: ${currentMatch.player2.losses.toString()}`;

    matchTitle.innerHTML = this.matchTitle.length === 0 ? 'Next Match' : this.matchTitle;
    matchTitle.innerHTML != 'Next Match' ? nextMatchInfo.style.display = 'none' : matchTitle;
    this.matchTitle = matchTitle.innerHTML;

    nextMatchP1.innerHTML = nextMatch ? nextMatch.player1.displayName : '';
    nextMatchP2.innerHTML = nextMatch ? nextMatch.player2.displayName : '';
  }

  private async renderFreezeTimeModalInfo(appElement: Element | null): Promise<void> {
    const displayNameP1 = appElement.querySelector('#player1');
    const displayNameP2 = appElement.querySelector('#player2');
    displayNameP1.textContent = this.currentRound[0].player1.displayName;
    displayNameP2.textContent = this.currentRound[0].player2.displayName;

    const startButton = appElement.querySelector('#start-button') as HTMLButtonElement ;
    const modal = appElement.querySelector('#freeze-time-modal') as HTMLElement;
    let countDown: number = 3;

    if (modal.style.display == 'none') {
      modal.style.display = 'block';
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
              modal.style.display = 'none';
              startButton.removeEventListener('click', clickHandler);
              resolve();
            }
            countDown--;
          }, 1000);
        };
        startButton.addEventListener('click', clickHandler);
      });
    };
  }

  private async renderTournamentInfo(appElement: Element | null, currentMatch: Match, nextMatch: Match | null) {
    this.renderPageInfo(appElement, currentMatch, nextMatch);
    await this.renderFreezeTimeModalInfo(appElement);
  }

  private async renderMatchWinner(appElement: Element | null, match: Match): Promise<void> {
    const matchWinnerModal = appElement.querySelector('#match-winner-modal') as HTMLElement;
    const winner = appElement.querySelector('#winner-display-name') as HTMLElement;
    const nextMatchButton = appElement.querySelector('#next-match-button') as HTMLButtonElement;

    matchWinnerModal.classList.replace('hidden', 'flex');
    winner.innerHTML = match.winner.displayName;

    return new Promise<void>((resolve) => {
      nextMatchButton.addEventListener('click', (event: MouseEvent) => {
        matchWinnerModal.classList.replace('flex', 'hidden');
        resolve();
      })
    })
  }

  public async runTournament(appElement: Element | null) {
    while(!this.tournamentFinished) {
      if (this.totalRounds == 1) {
        this.matchTitle = 'FINAL';
      } else if (this.totalRounds == 2) {
        this.matchTitle = 'SEMI-FINALS';
      } else if (this.currentRound.length == 1) {
        this.matchTitle = 'LAST ROUND MATCH!';
      }
      for (let i : number = 0; i < this.currentRound.length; i++) {
        const currentGame = new Game(this.currentRound[i], 'board');
        await this.renderTournamentInfo(appElement, this.currentRound[i], this.currentRound[i + 1]);
        await currentGame.startMatch(this.currentRound[i]);
        if (this.matchTitle != 'FINAL') {
          await this.renderMatchWinner(appElement, this.currentRound[i]);
        }
      }
      if (this.totalRounds == 0)
        this.tournamentFinished = true;
      // render champion modal
      else {
        this.currentRound = this.createNextRound(this.currentRound);
        this.totalRounds--;
      }
    }
     // api method
  }

  private createFirstRound(gameContext: TiamaPong) {
    let shuffled : User[] = this.shuffleParticipants(gameContext.preTournamentSelection);
    this.byes = shuffled.splice(0, this.totalByes);
    for (let i = 0; i < this.firstRoundTotalParticipants; i = i + 2) {
        this.currentRound.push(new Match('tournament', shuffled[i], shuffled[i + 1]));
    }
  }

  public createNextRound(finishedRound: Match[]) : Match[] {
    let winners : User[] = [];
    let nextRoundPlayers: User[] = [];
    let nextRound : Match[] = [];

    for (let i : number = 0; i < finishedRound.length; i++) {
        winners.push(finishedRound[i].winner);
    }
    nextRoundPlayers.push(...winners);
    if (this.totalByes > 0) {
      this.byes.forEach(byer => {
        nextRoundPlayers.push(byer);
      });
      this.totalByes = 0;
    }
    for (let i : number = 0; i < nextRoundPlayers.length; i+=2) {
        nextRound.push(new Match('tournament', nextRoundPlayers[i], nextRoundPlayers[i + 1]));
    }
    return nextRound;
  }
}