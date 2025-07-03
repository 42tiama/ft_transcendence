import fastify, { FastifyRequest } from "fastify";
import { readFileSync } from "node:fs"; // function to read files with SSL certificates
import dotenv from 'dotenv'; // loads environment variables from .env
import { Database } from 'better-sqlite3'; // type for SQLite database
import fastifyBetterSqlite3 from '@punkish/fastify-better-sqlite3'; // fastify plugin for SQLite
import fastifyMultipart from '@fastify/multipart';
import { writeFile } from 'fs/promises';
import fastifyStatic from '@fastify/static';
import path from 'path';

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

app.register(fastifyMultipart);
app.register(fastifyStatic, {
	root: path.join(__dirname, '/static/uploads'),
	prefix: '/uploads/',
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

// display name validation (max 20 chars, not empty)
function isValidDisplayName(displayName: string): boolean {
	return typeof displayName === 'string' && displayName.trim().length > 0 && displayName.trim().length <= 20;
}

// Updates display name, card color and avatar
app.post('/profile-update/:userId', async (request: FastifyRequest<{ Params: { userId: string } }>, reply) => {
	const { userId } = request.params;
	const parts = request.parts();

	let displayName = '';
	let cardColor = '';
	let avatarBuffer: Buffer | null = null; // binary contents of the file
	let avatarFilename = ''; // original file name
	for await (const part of parts) {
		if (part.type === 'file' && part.fieldname === 'avatar') {
			avatarBuffer = await part.toBuffer();
			avatarFilename = part.filename;
		} else if (part.type === 'field') {
			if (part.fieldname === 'displayName') displayName = part.value as string;
			if (part.fieldname === 'cardColor') cardColor = part.value as string;
		}
	}

	if (!userId|| !displayName || !cardColor) {
		app.log.warn(`Missing fields in update profile request: ${JSON.stringify(request.body)}`);
		reply.code(400).send({ error: "Missing required fields." });
		return;
	}

	// validate displayName format
	if (!isValidDisplayName(displayName)) {
		reply.code(400).send({ error: "Display Name must be 1 to 20 characters." });
		return;
	}

	const db = app.betterSqlite3;

	// check for duplicate display name
	if (displayName) {
		const otherUser = db.prepare(`SELECT 1 FROM users WHERE displayName = ? AND id != ?`).get(displayName, userId);
		if (otherUser) {
			reply.code(400).send({ error: "This display name is already taken. Please choose another display name." });
			return;
		}
	}

	// Save avatar to disk if present
	let avatarPath = '';
	if (avatarBuffer && avatarFilename) {
		const safeFilename = `${userId}-${Date.now()}-${avatarFilename}`.replace(/[^a-z0-9.\-_]/gi, '_');
		avatarPath = `/uploads/${safeFilename}`;
  		const fullPath = path.join(__dirname, 'static', avatarPath);
		await writeFile(fullPath, avatarBuffer);
	} else {
		// Keep the one from the db if no file sent
		const currentAvatar = db.prepare(`SELECT avatarUrl FROM users WHERE id = ?`).get(userId) as {avatarUrl: string};
		avatarPath = currentAvatar.avatarUrl;
	}


	try {
		const result = db.prepare(`
			UPDATE users
			SET
			  displayName = ?,
			  avatarUrl = ?,
			  cardColor = ?
			WHERE id = ?
		`).run(displayName, avatarPath, cardColor, userId);

		//sync display name update with game-service players table
		if (result.changes === 1){
			const userPayload = {
				displayName: displayName,
			}

			fetch(`https://game-service:8045/player/${userId}/info/display-name`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(userPayload)
			})
			.then((gameServiceResponse) => {
				if (!gameServiceResponse.ok) {
					app.log.warn(`Profile failed to update display name of player ID ${userId}`);
				} else {
					app.log.info(`Profile updated display name of player ID ${userId}`);
				}
			})
			.catch((err) => {
				app.log.error('Could not reach game-service - update display name:', err);
			})

			//sync display name update with auth users table
			try {
				const authResponse = await fetch(`https://auth:8043/change-user-displayname/${userId}`, {
					method: 'POST',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(userPayload)
				})
				if (!authResponse.ok) {
					app.log.warn(`Profile failed to update display name of auth user ID ${userId}`);
				} else {
					app.log.info(`Profile updated display name of auth user ID ${userId}`);
				}
			} catch (err) {
				app.log.error('Could not reach auth service - update display name:', err);
			}
		}
		reply.code(200).send({
			success: true,
			message: "Profile update successful.",
		});
	} catch (err: any) {
		let message = err.message;
		console.log(err);
		if (message && message.includes('UNIQUE constraint failed: users.displayName')) {
			message = 'This display name is already taken. Please choose another display name.';
		}
		reply.code(500).send({ error: message || "Failed to update user." });
	}
});

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
            cardColor TEXT DEFAULT '#374151',
			lastSeen DATETIME,
			createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
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
