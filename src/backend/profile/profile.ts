import fastify, { FastifyRequest } from "fastify";
import { readFileSync } from "node:fs"; // function to read files with SSL certificates
import dotenv from 'dotenv'; // loads environment variables from .env
import { Database } from 'better-sqlite3'; // type for SQLite database
import fastifyBetterSqlite3 from '@punkish/fastify-better-sqlite3'; // fastify plugin for SQLite

dotenv.config();

declare module 'fastify' {
	interface FastifyInstance {
		betterSqlite3: Database;
		authenticate: any;
	}
}

const SINGLE_CONTAINER = process.env.SINGLE_CONTAINER;

const httpsOptions = {
	key: readFileSync("certs/profile/key.pem"),
	cert: readFileSync("certs/profile/cert.pem")
};

const app = fastify({
    logger: true,
    https: httpsOptions
});

if (SINGLE_CONTAINER === 'true'){
	app.register(fastifyBetterSqlite3, {
		"pathToDb": './data/profile.db',
		"verbose": console.log
	});
} else {
	app.register(fastifyBetterSqlite3, {
		"pathToDb": '/data/profile.db',
		"verbose": console.log
	});
}

interface RegisterRequestBody {
	id : number;
	displayName: string;
}

//Adds new user to users table
app.post('/profile-register', async (request: FastifyRequest<{ Body: RegisterRequestBody }>, reply) => {
	const { id, displayName } = request.body;
	app.log.info(`Received register request for user id=${id}`);

	if (!id || !displayName) {
		app.log.warn(`Missing fields in register request: ${JSON.stringify(request.body)}`);
		reply.code(400).send({ error: "Missing required fields." });
		return;
	}

	try {
		const db = app.betterSqlite3;
		const stmt = db.prepare(`
  			INSERT INTO users (id, displayName)
 	  		VALUES (?, ?)
	    `);
 		stmt.run(id, displayName);
 		reply.code(201).send({ success: true, message: "User profile created." });
	} catch (err: any) {
		if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
			reply.code(409).send({ error: "User already exists." });
		} else {
			reply.code(500).send({ error: err.message });
		}
	}
});

interface User {
	id: number;
	displayName: string;
	avatarUrl: string;
	cardColor: string;
}

// Get user profile by ID
app.get('/profile-by-id/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
	const { id } = request.params;

	try {
		const db = app.betterSqlite3;
		const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User;
		if (!user) {
			reply.code(404).send({ error: "User not found." });
			return;
		}
		reply.send({
			success: true,
			data: user
		});
	} catch (err: any) {
		app.log.error('Error fetching user profile:', err);
		reply.code(500).send({ error: "Failed to fetch user profile." });
	}
});

// Get user profile by DisplayName
app.get('/profile-by-displayname/:displayName', async (request: FastifyRequest<{ Params: { displayName: string } }>, reply) => {
	const { displayName } = request.params;

	try {
		const db = app.betterSqlite3;
		const user = db.prepare('SELECT * FROM users WHERE displayName = ?').get(displayName) as User;
		if (!user) {
			reply.code(404).send({ error: "User not found." });
			return;
		}
		reply.send({
			success: true,
			data: user
		});
	} catch (err: any) {
		app.log.error('Error fetching user profile:', err);
		reply.code(500).send({ error: "Failed to fetch user profile." });
	}
});

// Get User Follow Stats
app.get('/follow-stat/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
	const { id } = request.params;

	try {
		const db = app.betterSqlite3;
		const followingStmt = db.prepare(`
			SELECT COUNT(*) AS count FROM friends
			WHERE userId = ?
		`);
		const followersStmt = db.prepare(`
			SELECT COUNT(*) AS count FROM friends
			WHERE friendId = ?
		`);

		const following= followingStmt.get(id) as {count: number};
		const followers = followersStmt.get(id) as {count: number};

		return reply.send({ following: following.count, followers: followers.count });
	} catch (err: any) {
		app.log.error('Error fetching friends:', err);
		reply.code(500).send({ error: "Failed to fetch friends." });
	}
});

//Adds a new friend
app.post('/friend-register', async (request: FastifyRequest<{ Body: {userId: number, displayName: string}}>, reply) => {
	const { userId, displayName } = request.body;
	if (!userId|| !displayName) {
		app.log.warn(`Missing fields in register request: ${JSON.stringify(request.body)}`);
		reply.code(400).send({ error: "Missing required fields." });
		return;
	}
	app.log.info(`Received request for user id=${userId} to add ${displayName} as friend`);

	try {
		const db = app.betterSqlite3;
		//get the friend id
		const friend = db.prepare('SELECT id FROM users WHERE displayName = ?').get(displayName) as {id: number};
		if (!friend) {
			return reply.status(404).send({ error: 'User not found.' });
		}
		if (friend.id === userId) {
		  return reply.status(400).send({ error: 'Cannot add yourself.' });
		}

		//insert the friend
		const insertFriend = db.prepare('INSERT OR IGNORE INTO friends (userId, friendId) VALUES (?, ?)');
		const result = insertFriend.run(userId, friend.id);
		if (result.changes === 0) {
  			return reply.code(409).send({ error: "Already friends." });
		}
 		reply.code(201).send({ success: true, message: "Friend added successfully." });
	} catch (err: any) {
		reply.code(500).send({ error: err.message });
	}
});

interface Friend {
	id: number;
	displayName: string;
	avatarUrl: string;
	cardColor: string;
}

// Get the list of friends the user follows
app.get('/friend-list/:userId', async (request: FastifyRequest<{ Params: { userId: string } }>, reply) => {
	const { userId } = request.params;

	try {
		const db = app.betterSqlite3;
		const stmt = db.prepare(`
    		SELECT u.id, u.displayName, u.avatarUrl, u.cardColor
    		FROM friends f
    		JOIN users u ON u.id = f.friendId
    		WHERE f.userId = ?
			ORDER BY u.displayName COLLATE NOCASE
		`);

		const friends = stmt.all(userId) as Friend[];
		if (friends.length === 0) {
			app.log.info(`User ${userId} hasn't added any friends.`);
			return reply.send({
				success: true,
				data: null
			});
		}
		reply.send({
  		    success: true,
			data: friends
    	});
	} catch (err: any) {
		app.log.error('Error fetching friends list:', err);
		reply.code(500).send({ error: "Failed to fetch friends list." });
	}
});

//Deletes a friend
app.post('/friend-delete', async (request: FastifyRequest<{ Body: {userId: number, friendId: number}}>, reply) => {
	const { userId, friendId } = request.body;
	if (!userId || !friendId) {
		app.log.warn(`Missing fields in register request: ${JSON.stringify(request.body)}`);
		reply.code(400).send({ error: "Missing required fields." });
		return;
	}

	app.log.info(`Received request for user id=${userId} to delete friend id=${friendId}`);

	try {
		const db = app.betterSqlite3;
		const deleteFriend = db.prepare(`
		    DELETE FROM friends
      		WHERE (userId = ? AND friendId = ?)
		`);
		const result = deleteFriend.run(userId, friendId);
		if (result.changes === 0) {
  			return reply.code(404).send({ error: "Friendship not found." });
		}
 		reply.code(200).send({ success: true, message: "Friend deleted successfully." });
	} catch (err: any) {
		app.log.error('Error deleting friend:', err);
		reply.code(500).send({ error: "Failed to delete friend." });
	}
});

//updates the user`s last seen
app.post('/heartbeat/:userId', async (request: FastifyRequest<{ Params: {userId: number}}>, reply) => {
	const { userId } = request.params;

	if (!userId) {
		app.log.warn(`Missing fields in register request: ${JSON.stringify(request.params)}`);
		reply.code(400).send({ error: "Missing required fields." });
		return;
	}

  	try {
		const db = app.betterSqlite3;
  	  	const stmt = db.prepare(`
  	    	UPDATE users SET lastSeen = CURRENT_TIMESTAMP WHERE id = ?
  	  	`);

  	  	const result = stmt.run(userId);

  		if (result.changes === 0) {
			reply.code(404).send({ error: 'User not found' });
			return;
  		}

  	  	reply.send({ status: 'ok' });
  	} catch (err) {
  	  	app.log.error('Error updating lastSeen:', err);
		reply.code(500).send({ error: "Failed to update lastSeen." });
  	}
});

//check if a user is considered online based on lastSeen timestamp
app.get('/online-status/:userId', async (request: FastifyRequest<{ Params: { userId: number } }>, reply) => {
	const { userId } = request.params;

	if (!userId) {
		app.log.warn(`Missing fields in register request: ${JSON.stringify(request.params)}`);
		reply.code(400).send({ error: "Missing required fields." });
		return;
	}

	try {
		const db = app.betterSqlite3;
		const stmt = db.prepare(`
  		    SELECT CASE
  		        WHEN lastSeen IS NOT NULL
  		         AND lastSeen >= DATETIME('now', '-10 seconds')
  		        THEN 1
  		        ELSE 0
  		      END AS onlineStatus
  		    FROM users
  		    WHERE id = ?
		`);

		const result = stmt.get(userId) as {onlineStatus: number};
		if (!result) {
			return reply.code(404).send({ error: "User not found." });
		}
		const isOnline = result.onlineStatus === 1? true : false;
		reply.send({ online: isOnline });
	} catch (err) {
	  app.log.error('Error checking online status:', err);
	  reply.code(500).send({ error: "Failed to check online status." });
	}
});

// Get user Match Stat
//TODO - move to game-service
app.get('/match-stat/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
	const { id } = request.params;

	try {
		const db = app.betterSqlite3;
		const winStmt = db.prepare(`
			SELECT COUNT(*) AS count FROM matches
			WHERE winner = ?
		`);
		const lossStmt = db.prepare(`
			SELECT COUNT(*) AS count FROM matches
			WHERE player1 = ? OR player2 = ?
			AND winner != ?
		`);

		const wins = winStmt.get(id) as {count: number};
		const losses = lossStmt.get(id, id, id) as {count: number};
		const totalMatches = wins.count + losses.count;
		if (totalMatches === 0) {
			app.log.info('No matches found for Match Stat');
			return reply.send({
				success: true,
				data: null
			});
		}
		const winRate = Math.round((wins.count / totalMatches) * 100);

		app.log.info('User total matches: ', totalMatches);

		reply.send({
			success: true,
			data: {
				wins: wins.count,
				losses: losses.count,
				winRate: winRate,
				totalMatches: totalMatches
			}
		});
	} catch (err: any) {
		app.log.error('Error fetching matches:', err);
		reply.code(500).send({ error: "Failed to fetch matches." });
	}
});

interface MatchRecord {
	id: number;
	matchType: string;
	player1: number;
	player2: number;
	player1Score: number;
	player2Score: number;
	winner: number;
	matchDate: string;
};

interface FormattedMatch {
	date: string;
	type: string;
	opponent: string;
	score: string;
	result: string;
};

// Get user Match History
//TODO - move to game-service
app.get('/match-hist/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
	const { id } = request.params;

	try {
		const db = app.betterSqlite3;
		const stmt = db.prepare(`
			SELECT * FROM matches
			WHERE player1 = ? OR player2 = ?
			ORDER BY matchDate DESC
		`);

		const matches = stmt.all(id, id) as MatchRecord[];
		if (matches.length === 0) {
			app.log.info('No matches found for Match History.');
			return reply.send({
				success: true,
				data: []
			});
		}

		// Format Match Records to Match History
		const getDisplayName = db.prepare('SELECT displayName FROM users WHERE id = ?');

		const formattedMatches: FormattedMatch[] = matches.map(match => {
  			const isPlayer1 = match.player1 === Number(id);
  			const opponentId = isPlayer1 ? match.player2 : match.player1;
			const opponentResult = getDisplayName.get(opponentId) as { displayName: string };
  			const opponent = opponentResult?.displayName ?? "AI";
  			const score = isPlayer1 ? `${match.player1Score} - ${match.player2Score}` : `${match.player2Score} - ${match.player1Score}`;
  			const result = match.winner === Number(id) ? 'Win' : 'Loss';

  			return {
    			date: new Date(match.matchDate).toLocaleDateString('pt-BR'),
    			type: match.matchType,
    			opponent,
    			score,
    			result
  			};
		});
		reply.send({
			success: true,
			data: formattedMatches
		});
	} catch (err: any) {
		app.log.error('Error fetching matches:', err);
		reply.code(500).send({ error: "Failed to fetch matches." });
	}
});

app.get('/', (request, reply) => {
	reply.send("Hello from profile service");
});

app.listen({host: "0.0.0.0", port: 8046 }, (err, address) => {
	const db = app.betterSqlite3;

	//Users table
	db.prepare(`
		CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            displayName TEXT UNIQUE NOT NULL,
            avatarUrl TEXT,
            cardColor TEXT DEFAULT '#ffba00',
			lastSeen DATETIME,
			createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`).run();

    //Matches table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY,
            matchType TEXT NOT NULL CHECK(matchType IN ('Tournament', '1v1')),
            player1 INTEGER NOT NULL,
            player2 INTEGER,
            player1Score INTEGER DEFAULT 0,
            player2Score INTEGER DEFAULT 0,
            winner INTEGER NOT NULL,
            matchDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (player1) REFERENCES users(id),
            FOREIGN KEY (player2) REFERENCES users(id),
            FOREIGN KEY (winner) REFERENCES users(id)
        )
	`).run();

    // Friends table (one-way friendship)
    db.prepare(`
        CREATE TABLE IF NOT EXISTS friends (
            userId INTEGER NOT NULL,
            friendId INTEGER NOT NULL,
            UNIQUE(userId, friendId),
            FOREIGN KEY(userId) REFERENCES users(id),
            FOREIGN KEY(friendId) REFERENCES users(id)
        )
	`).run();

	if (err) {
		app.log.error(err);
		process.exit(1);
	}
    app.log.info(`profile running at ${address}`);
});
