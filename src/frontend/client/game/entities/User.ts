import { User as UserInterface } from '../types.js';
import TiamaPong from '../entities/TiamaPong.js'

export default class User implements UserInterface {
    id: number;
    displayName: string;
    userName: string;
    email: string;
    record: {wins : number, losses: number};
    level: number;
    cardColor: number;

    constructor(game: TiamaPong, displayName: string, email: string) {
        // this.id = this.getId(game);
        this.displayName = displayName;
        this.email = email;
        this.record = {wins : 0, losses : 0};
        this.level = null;
        this.cardColor = null;
    }

    // getId(game: TiamaPong) : number {
    //     if (game.users.length == 0 )
    //         return 0
    //     else
    //         return (game.users.length + 1);
    // }
}