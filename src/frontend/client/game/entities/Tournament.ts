import Match from "./Match.js";
import  User  from "./User.js";
import  TiamaPong  from "./TiamaPong.js";
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

  private runTournament() {
    // while(this.tournament.totalRounds != 0) {
    //     if (this.tournament.currentRound.length == 1) {
    //         this.matchTitle = 'FINAL';
    //     } else if (this.tournament.currentRound.length == 2) {
    //         this.matchTitle = 'SEMI-FINALS';
    //     }
    //     for (let i : number = 0; i < this.tournament.currentRound.length; i++) {
    //         renderBottomInfo() // sees this.obj and look for a message at matchtTitle or currentRound length to determine if the the front will display a message advertising the stage of the tournament or the next round  
    //         const currentGame = new Game(this.tournament.currentRound[i], 'canvas');
            
    //         //setWinner(tournament.currentRound[i].winner); // api method
    //     }
    //     tournament.currentRound = tournament.createNextRound(tournament.currentRound) // pega os vencedores do round corrente antes de reduzir o numero de rounds
    //     tournament.totalRounds--;
    // }
    // tournament.tournamentFinished = true;
  }

  private createFirstRound(gameContext: TiamaPong) {
    let shuffled : User[] = this.shuffleParticipants(gameContext.preTournamentSelection);
    this.byes = shuffled.splice(0, this.totalByes);
    // let nextRoundBracketSize : number = this.numberOfWinners1stRound + this.totalByes;
    for (let i = 0; i < this.firstRoundTotalParticipants; i = i + 2) {
        this.currentRound.push(new Match(gameContext, 'tournament', shuffled[i], shuffled[i + 1], this));
    }
    // every time a round finishes we create a new array with the winners of that round;
    // then we match n vs n + 1 -> n = n + 2 until n < than next round bracket
  }

  // public createNextRound(finishedRound: Match[]) : Match[] {
  //     let nextRound : Match[];
  //     let winners : User[];

  //     for (let i : number = 0; i <= finishedRound.length; i++) {
  //         winners.push(finishedRound[i].winner);
  //     }
  //     for (let i : number = 0; i <= winners.length; i+2) {
  //         nextRound.push(new Match(game, 'tournament', winners[i], winners[i + 1], this));
  //     }
  //     return nextRound;
  // }
}