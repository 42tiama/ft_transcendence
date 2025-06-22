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
            displayName TEXT NOT NULL,
            points INTEGER DEFAULT 0,
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS tournaments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            totalPlayers INTEGER DEFAULT 0,
            totalMatches INTEGER DEFAULT 0,
            winner TEXT NOT NULL,
            FOREIGN KEY (winner) REFERENCES users(displayName)
            )
        `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            matchType TEXT NOT NULL,
            tournamentId INTEGER,
            player1 TEXT NOT NULL,
            player2 TEXT NOT NULL,
            player1Score INTEGER DEFAULT 0,
            player2Score INTEGER DEFAULT 0,
            winner TEXT NOT NULL,
            FOREIGN KEY (tournamentId) REFERENCES tournaments(id),
            FOREIGN KEY (player1) REFERENCES users(displayName),
            FOREIGN KEY (player2) REFERENCES users(displayName),
            FOREIGN KEY (winner) REFERENCES users(displayName)
        )
    `);

}

function seedUsers() {
    const checkUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    if (checkUsers.count === 0) {
        const insertUser = db.prepare(`
            INSERT INTO users (displayName, points, wins, losses) 
            VALUES (?, ?, ?, ?)
        `);

        const users = [
            {
                displayName: 'Allesson',
                points: 0,
                wins: 0,
                losses: 0
            },
            {
                displayName: 'Thais',
                points: 0,
                wins: 0,
                losses: 0
            },
            {
                displayName: 'Iury',
                points: 0,
                wins: 0,
                losses: 0
            },
            {
                displayName: 'Andre',
                points: 0,
                wins: 0,
                losses: 0
            },
            {
                displayName: 'Marcio',
                points: 0,
                wins: 0,
                losses: 0
            },
            
        ];

        const insertMany = db.transaction((users: any[]) => {
            for (const user of users) {
                insertUser.run(
                    user.displayName,
                    user.wins,
                    user.losses
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