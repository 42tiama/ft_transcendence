import { User as UserInterface } from '../types.js';
import TiamaPong from '../entities/TiamaPong.js'

export default class User implements UserInterface {
    id: number;
    displayName: string;
    points: number;
    wins : number;
    losses: number;

    constructor(game: TiamaPong, id: number = 42, displayName: string, email: string) {
        this.id = id;
        this.displayName = displayName;
        this.points = 0;
        this.wins = 0;
        this.losses = 0;
    }

    // getId(game: TiamaPong) : number {
    //     if (game.users.length == 0 )
    //         return 0
    //     else
    //         return (game.users.length + 1);
    // }
}
