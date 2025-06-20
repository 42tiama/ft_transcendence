import Database from 'better-sqlite3';
import { join } from "node:path";

const dbPath = join(__dirname, '../data/tiama-pong.db');
export const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

function initializeDatabase() {

    // Users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            display_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            avatar_url TEXT,
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0,
            card_color TEXT DEFAULT '#ffba00'
        )
    `);

}

function seedUsers() {
    const checkUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    if (checkUsers.count === 0) {
        const insertUser = db.prepare(`
            INSERT INTO users (display_name, email, avatar_url, wins, losses, card_color) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const users = [
            {
                display_name: 'Allesson',
                email: 'allesson@gmail.com',
                avatar_url: './images/lib_ft',
            },
            {
                display_name: 'Thais',
                email: 'thais@gmail.com',
                avatar_url: './images/lib_ft',
                wins: 0,
                losses: 0,
                card_color: '#ffba00'
            },
            {
                display_name: 'Iury',
                email: 'Iury@gmail.com',
                avatar_url: './images/lib_ft',
                wins: 0,
                losses: 0,
                card_color: '#ffba00'
            },
            {
                display_name: 'Andre',
                email: 'andre@gmail.com',
                avatar_url: './images/lib_ft',
                wins: 0,
                losses: 0,
                card_color: '#ffba00'
            },
            {
                display_name: 'Marcio',
                email: 'marcio@gmail.com',
                avatar_url: './images/lib_ft',
                wins: 0,
                losses: 0,
                card_color: '#ffba00'
            },
            
        ];

        const insertMany = db.transaction((users: any[]) => {
            for (const user of users) {
                insertUser.run(
                    user.display_name,
                    user.email,
                    user.avatar_url,
                    user.wins,
                    user.losses,
                    user.card_color
                );
            }
        });

        insertMany(users);
        // server.log.info(`Seeded ${users.length} users`); // descomment after get to import the logstash
    } else {
        // server.log.info(`Users table already has ${checkUsers.count} users, skipping seed`); // descomment after get to import the logstash
    }
}

initializeDatabase();
seedUsers();