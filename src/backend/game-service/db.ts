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
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0
        )
    `);

}

function seedUsers() {
    const checkUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    if (checkUsers.count === 0) {
        const insertUser = db.prepare(`
            INSERT INTO users (displayName, wins, losses) 
            VALUES (?, ?, ?)
        `);

        const users = [
            {
                displayName: 'Allesson',
                wins: 0,
                losses: 0
            },
            {
                displayName: 'Thais',
                wins: 0,
                losses: 0
            },
            {
                displayName: 'Iury',
                wins: 0,
                losses: 0
            },
            {
                displayName: 'Andre',
                wins: 0,
                losses: 0
            },
            {
                displayName: 'Marcio',
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