import { User as UserInterface, GameConfig } from '../types.js';

export class User implements UserInterface {
    id: number;
    displayName: string;
    userName: string;
    email: string;
    record: {wins : number, losses: number};
    level: number;
    cardColor: number;

    // constructor(x: number, y: number, config: GameConfig) {
    //     this.id = 
    //     this.displayName = 
    //     this.userName = 
    //     this.email = 
    //     this.record = 
    //     this.level = 
    //     this.cardColor = 
    // }


}