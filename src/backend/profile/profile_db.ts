import Database from 'better-sqlite3';
import { join } from "node:path";

const dbPath = join(__dirname, './data/profile.db');
export const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

function initializeDatabase() {

    // Users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            displayName TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            avatarUrl TEXT DEFAULT '/uploads/avatars/default.png',
            cardColor TEXT DEFAULT '#ffba00',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Matches table
    db.exec(`
        CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY,
            matchType TEXT NOT NULL CHECK(matchType IN ('Tournament', '1v1'),
            tournamentId INTEGER,
            player1 INTEGER NOT NULL,
            player2 INTEGER NOT NULL,
            player1Score INTEGER DEFAULT 0,
            player2Score INTEGER DEFAULT 0,
            winner INTEGER NOT NULL,
            matchDate DATETIME NOT NULL,
            FOREIGN KEY (tournamentId) REFERENCES tournaments(id),
            FOREIGN KEY (player1) REFERENCES users(id),
            FOREIGN KEY (player2) REFERENCES users(id),
            FOREIGN KEY (winner) REFERENCES users(id)
        )
    `);

    // Friends table (one-way friendship)
    db.exec(`
    CREATE TABLE IF NOT EXISTS friends (
        user_id INTEGER NOT NULL,
        friend_id INTEGER NOT NULL,
        UNIQUE(user_id, friend_id),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(friend_id) REFERENCES users(id) ON DELETE CASCADE
    )
    `);

}

function seedUsers() {
    const checkUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    if (checkUsers.count === 0) {
        const insertUser = db.prepare(`
            INSERT INTO users (display_name, email, avatar_url, wins, losses, card_color)
            VALUES (?, ?, ?, ?, ?, ?)
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