import Match from "./Match.js";
import User from "./User.js";
import TiamaPong  from "./TiamaPong.js";
import Game from "./Game.js";
import { TournamentInfo, GameServices } from "../types.js";
import TournamentService from '../../services/TournamentService.js'
import MatchService from '../../services/MatchService.js'
import { TournamentData } from "services/types.js";
// import { Server } from "http";

// sets the API base URL to the API gateway for all authentication requests.
const API_BASE = 'https://localhost:8044';

export default class Tournament {
  tournamentId: number = 0;
  currentRound: Match[] = [];
  currentGame: Game | null = null;
  totalPlayers: number = 0;
  totalMatches: number = 0;
  nextPowerOf2: number = 0;
  totalByes: number = 0;
  byes: User[] = [];
  firstRoundTotalParticipants: number = 0;
  totalRounds: number = 0;
  tournamentFinished: boolean = false;
  tournamentWinner?: User | null;
  matchTitle: string = '';
  matchLog: Match[] = [];
  gameServices: Partial<GameServices> = { tournament: undefined, match: undefined };

  constructor(gameContext: TiamaPong) {
    this.tournamentInit(gameContext);
    this.initGameServices();
  }

  initGameServices() {
    this.gameServices.tournament = new TournamentService();
    this.gameServices.match = new MatchService();
  }

  private async registerTournament() {
    this.gameServices.tournament = new TournamentService();

    if (this.gameServices.tournament) {
        const tournamentInfo: TournamentData = {
          totalMatches: this.totalMatches,
          totalPlayers: this.totalPlayers,
      };
      this.tournamentId = await this.gameServices.tournament.createTournament(tournamentInfo);
    }
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
    this.registerTournament();
    this.createFirstRound(gameContext);
    // this.debugPrintRoundArray();
  }

  private debugPrintParticipantsArray(participants: User[]): void {
    for (let i = 0; i < participants.length; i++) {
      console.log(`player ${i}: ${participants[i].displayName}\n`);
    }
  }

  // public debugPrintRoundArray(): void {
  //   for (let i = 0; i < this.currentRound.length; i++) {
  //     console.log(`Match ${i}\n`);
  //     console.log(`player 1 - ${this.currentRound[i].player1.displayName} VS ${this.currentRound[i].player2.displayName} - Player 2\n`);
  //   }
  //   console.log(`Byers: \n`);
  //   for (let i = 0; i < this.byes.length; i++) {
  //     console.log(`Byer ${i}: ${this.byes[i].displayName}`);
  //   }
  // }

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

  async renderPageInfo(appElement: Element, currentMatch: Match, nextMatch: Match | null) {
    // Fetch profile data for both players
    const player1Profile = await this.getPlayerProfile(currentMatch.player1.id);
    const player2Profile = await this.getPlayerProfile(currentMatch.player2!.id);

    if (player1Profile && player2Profile) {
      const displayNameP1 = appElement.querySelector('#p1-display-name');
      const displayNameP2 = appElement.querySelector('#p2-display-name');
      displayNameP1!.innerHTML = player1Profile?.displayName || currentMatch.player1.displayName;
      displayNameP2!.innerHTML = player2Profile?.displayName || currentMatch.player2!.displayName;

      const p1Avatar = appElement.querySelector('#p1-avatar') as HTMLElement;
      const p2Avatar = appElement.querySelector('#p2-avatar') as HTMLElement;
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

      const p1Card = appElement.querySelector('#p1-card') as HTMLElement;
      const p2Card = appElement.querySelector('#p2-card') as HTMLElement;
      if (p1Card && player1Profile?.cardColor) {
        p1Card.style.backgroundColor = player1Profile.cardColor;
      }
      if (p2Card && player2Profile?.cardColor) {
        p2Card.style.backgroundColor = player2Profile.cardColor;
      }
    }

    const p1Wins = appElement.querySelector('#p1-wins');
    const p1Losses = appElement.querySelector('#p1-losses');
    const p2Wins = appElement.querySelector('#p2-wins');
    const p2Losses = appElement.querySelector('#p2-losses');

    const matchTitle = appElement.querySelector('#match-title') as HTMLElement;
    const nextMatchInfo = appElement.querySelector('#next-match-info') as HTMLElement;
    const nextMatchP1 = appElement.querySelector('#next-match-p1');
    const nextMatchP2 = appElement.querySelector('#next-match-p2');

    p1Wins!.innerHTML = `Wins: ${currentMatch.player1.wins.toString()}`;
    p1Losses!.innerHTML = `Losses: ${currentMatch.player1.losses.toString()}`;
    p2Wins!.innerHTML = `Wins: ${currentMatch.player2!.wins.toString()}`;
    p2Losses!.innerHTML = `Losses: ${currentMatch.player2!.losses.toString()}`;

    matchTitle.innerHTML = this.matchTitle.length === 0 ? 'Next Match' : this.matchTitle;
    matchTitle.innerHTML != 'Next Match' ? nextMatchInfo.style.display = 'none' : matchTitle;
    this.matchTitle = matchTitle.innerHTML;
    if (nextMatch) {
      nextMatchP1!.innerHTML = nextMatch ? nextMatch.player1.displayName : '';
      nextMatchP2!.innerHTML = nextMatch ? nextMatch.player2!.displayName : '';
    }
  }

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

  private async renderTournamentInfo(appElement: Element, currentMatch: Match, nextMatch: Match | null) {
    await this.renderPageInfo(appElement, currentMatch, nextMatch);
    await this.renderFreezeTimeModalInfo(appElement, currentMatch);
  }

  private async renderMatchWinner(appElement: Element, match: Match): Promise<void> {
    const matchWinnerModal = appElement.querySelector('#match-winner-modal')! as HTMLElement;
    const winner = appElement.querySelector('#winner-display-name')! as HTMLElement;
    const nextMatchButton = appElement.querySelector('#next-match-button')! as HTMLButtonElement;

    matchWinnerModal.classList.replace('hidden', 'flex');
    winner.innerHTML = match.winner!.displayName;

    return new Promise<void>((resolve) => {
      nextMatchButton.addEventListener('click', (event: MouseEvent) => {
        matchWinnerModal.classList.replace('flex', 'hidden');
        resolve();
      }, { once: true })
    })
  }

  private async renderChampionModal(appElement: Element, match: Match): Promise<void> {
    const championModal = appElement.querySelector('#tournament-winner-modal')! as HTMLElement;
    const winner = appElement.querySelector('#champion-display-name')! as HTMLElement;
    const transcendButton = appElement.querySelector('#transcend-button')! as HTMLButtonElement;

    championModal.classList.replace('hidden', 'flex');
    winner.innerHTML = match.winner!.displayName;

    return new Promise<void>((resolve) => {
      transcendButton.addEventListener('click', (event: MouseEvent) => {
        championModal.classList.replace('flex', 'hidden');
        resolve();
      }, { once: true })
    })
  }

  public async runTournament(appElement: Element) {
    while(!this.tournamentFinished) {
      if (this.totalRounds == 1) {
        this.matchTitle = 'FINAL';
      } else if (this.totalRounds == 2) {
        this.matchTitle = 'SEMI-FINALS';
      } else if (this.currentRound.length == 1) {
        this.matchTitle = 'LAST ROUND MATCH!';
      }
      for (let i : number = 0; i < this.currentRound.length; i++) {
        this.currentGame = new Game(this.currentRound[i], 'board');
        await this.renderTournamentInfo(appElement, this.currentRound[i], this.currentRound[i + 1]);
        // this.debugPrintRoundArray();
        await this.currentGame.startMatch(this.currentRound[i]);
        if (this.matchTitle != 'FINAL') {
          this.matchLog.push(...this.currentRound);
          this.tournamentWinner = this.currentRound[i].winner;
          await this.renderMatchWinner(appElement, this.currentRound[i]);
        }
      }
      this.matchLog.push(...this.currentRound);
      // Iury, Andre nesse ponto, caso decida enviar os matchs antes de finalizar o campeonato
      // vc consegue no array "matchLog", todos os resultados de partidas desse round
      this.totalRounds--;
      if (this.totalRounds == 0) {
        this.tournamentFinished = true;
        await this.renderChampionModal(appElement, this.currentRound[0]);
      }
      else {
        this.currentRound = this.createNextRound(this.currentRound);
      }
    }
    await this.createTournamentLog();
    // Iury, Andre aqui da forma que eu havia pensado, eu crio o payload pra mandar os dados macros do torneio
    // e tbm chamo o endpoint pra mandar o log dos matchs, igual pode ser feito la em cima(213), porem de uma vez só,
    // matchs do torneio inteiro
  }

  private createFirstRound(gameContext: TiamaPong) {
    this.shuffleParticipants(gameContext.preTournamentSelection);
    this.byes = gameContext.preTournamentSelection.splice(0, this.totalByes);
    for (let i = 0; i < this.firstRoundTotalParticipants; i = i + 2) {
        this.currentRound.push(new Match('tournament', this, gameContext.preTournamentSelection[i], gameContext.preTournamentSelection[i + 1]));
    }
    gameContext.preTournamentSelection = [];
  }

  public createNextRound(finishedRound: Match[]) : Match[] {
    let winners : User[] | null = [];
    let nextRoundPlayers: User[] = [];
    let nextRound : Match[] = [];

    for (let i : number = 0; i < finishedRound.length; i++) {
        winners.push(finishedRound[i].winner!);
    }
    nextRoundPlayers.push(...winners);
    if (this.totalByes > 0) {
      this.byes.forEach(byer => {
        nextRoundPlayers.push(byer);
      });
      this.totalByes = 0;
    }
    for (let i : number = 0; i < nextRoundPlayers.length; i+=2) {
        nextRound.push(new Match('tournament', this, nextRoundPlayers[i], nextRoundPlayers[i + 1]));
    }
    return nextRound;
  }

  public async createTournamentLog(): Promise<void> {
    const tournamentInfo: TournamentInfo = {
      totalPlayers: this.totalPlayers,
      totalMatches: this.totalMatches,
      winner: this.tournamentWinner!
    }

    const tournamentServiceResponse = await this.gameServices.tournament!.registerTournamentResults({
      tournamentId: this.tournamentId,
      winner: this.tournamentWinner!.id,
      finished: this.tournamentFinished ? 1 : 0,
    });

    if (tournamentServiceResponse) {
      console.log('Tournament history saved successfully!');
    } else {
      console.error('Failed to save the tournament log');
    }

    // const matchServiceResponse = await this.gameServices.match!.createMatches(this.matchLog);
    // if (matchServiceResponse) {
    //   // server.log('Matches saved successfully!');
    // } else {
    //   // server.log.error('Failed to save matches');
    // }
  }
}
