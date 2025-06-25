import fastify, { FastifyRequest } from "fastify";
import { readFileSync } from "node:fs"; // function to read files with SSL certificates
import { db } from "./profile_db"
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
		"verbose": app.log.info
	});
} else {
	app.register(fastifyBetterSqlite3, {
		"pathToDb": './data/profile.db',
		"verbose": app.log.info
	});
}

interface RegisterRequestBody {
	id : number;
	email: string;
	displayName: string;
}

//Adds new user to users table
app.post('/register-profile', async (request: FastifyRequest<{ Body: RegisterRequestBody }>, reply) => {
	const { id, email, displayName } = request.body;
	app.log.info(`Received register request for user id=${id} email=${email}`);

	if (!id || !email || !displayName) {
		app.log.warn(`Missing fields in register request: ${JSON.stringify(request.body)}`);
		reply.code(400).send({ error: "Missing required fields." });
		return;
	}

	try {
		const db = app.betterSqlite3;

		const stmt = db.prepare(`
  			INSERT INTO users (id, display_name, email)
 	  		VALUES (?, ?, ?)
	    `);
 		stmt.run(id, displayName, email);

		app.log.info(`User profile created: id=${id}, email=${email}`);
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
	email: string;
	avatarUrl: string;
	cardColor: string;
}

// Get user profile by ID
app.get('/user/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
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

interface DisplayName {
	displayName: string;
};

// Get user Match History
app.get('/matches/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
	const { id } = request.params;

	try {
		const db = app.betterSqlite3;
		const stmt = db.prepare(`
			SELECT * FROM matches
			WHERE player1 = ? OR player2 = ?
			ORDER BY match_date DESC
		`);

		const matches = stmt.all(id, id) as MatchRecord[];
		if (matches.length === 0) {
			reply.code(404).send({ error: "Matches not found." });
			return;
		}

		// Format Match Records to Match History
		const getDisplayName = db.prepare('SELECT displayName FROM users WHERE id = ?');

		const formattedMatches: FormattedMatch[] = matches.map(match => {
  			const isPlayer1 = match.player1 === Number(id);
  			const opponentId = isPlayer1 ? match.player2 : match.player1;
			const opponentResult = getDisplayName.get(opponentId) as { displayName: string };
  			const opponent = opponentResult?.displayName;
  			const score = isPlayer1 ? `${match.player1Score} - ${match.player2Score}` : `${match.player2Score} - ${match.player1Score}`;
  			const result = match.winner === Number(id) ? 'Win' : 'Loss';

  			return {
    			date: new Date(match.matchDate).toLocaleDateString(),
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
	if (err) {
		app.log.error(err);
		process.exit(1);
	}
    app.log.info(`profile running at ${address}`);
});
