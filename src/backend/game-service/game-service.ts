import fastify, {FastifyRequest, FastifyReply} from "fastify";
import { readFileSync } from "node:fs"; // function to read files with SSL certificates
import dotenv from 'dotenv'; // loads environment variables from .env
import { Database } from 'better-sqlite3'; // type for SQLite database
import fastifyBetterSqlite3 from '@punkish/fastify-better-sqlite3'; // fastify plugin for SQLite

dotenv.config();

// Adds betterSqlite3 (DB) and authenticate (JWT middleware) to Fastify.
declare module 'fastify' {
	interface FastifyInstance {
		betterSqlite3: Database;
		authenticate: any;
	}
}

const SINGLE_CONTAINER = process.env.SINGLE_CONTAINER;

const httpsOptions = {
	key: readFileSync("certs/game-service/key.pem"),
	cert: readFileSync("certs/game-service/cert.pem")
};

let loggerOptions: boolean | object;
let pathToDb: string;

if (SINGLE_CONTAINER === 'true'){
  loggerOptions = {
    transport: {
      target: "pino-pretty",
      options: {
          translateTime: "HH:MM:ss Z"
      }
    }
  };
  pathToDb = './data/game-service.db';
} else {
  loggerOptions = true;
  pathToDb = '/data/game-service.db';
}

const app = fastify({ 
    logger: loggerOptions,
    https: httpsOptions
 });

app.register(fastifyBetterSqlite3, {
  "pathToDb": pathToDb,
  "verbose": console.log
});

/////////////// CALLBACK FUNCTIONS ///////////////////////

interface aiMatchPayload {
	player1Id: number;
	player1Score: number;
	player2Score: number;
	winner: number | null;
}

async function addAiMatch(
	request: FastifyRequest<{ Body: aiMatchPayload }>,
	reply: FastifyReply
){
	const {player1Id, player1Score, player2Score, winner} = request.body;

	try {
		const stmt = request.server.betterSqlite3.prepare(`
			INSERT INTO matches (matchType, tournamentId, player1, player2,
			player1Score, player2Score, winner)
			VALUES (?, ?, ?, ?, ?, ?, ?)`);

		stmt.run("vsAI", null, player1Id, null, player1Score, player2Score, winner);

		request.server.log.info(`AI match added to matches table.`);
		reply.code(201).send({message: 'AI match stored on backend'});
	}
	catch (err) {
		request.log.error(err);
		reply.code(500).send({error: 'Internal server Error'});
	}
}

interface UserPayload {
	id: number;
	displayName: string;
}

async function addUser(
	request: FastifyRequest<{ Body: UserPayload }>,
	reply: FastifyReply
){
	const {id, displayName} = request.body;

	try {
		const stmt = request.server.betterSqlite3.prepare(`
			INSERT INTO players (userId, displayName)
			VALUES (?, ?)`
		);

		stmt.run(id, displayName);

		request.server.log.info(`Player ${displayName} added to players table.`);
		reply.code(201).send({message: 'User synced to game-service DB'});
	}
	catch (err){
		request.log.error(err);
		reply.code(500).send({error: 'Internal server Error'});
	}
}

/////////////////// ROUTE HANDLERS //////////////////

app.post('/register-from-auth', addUser);

app.post('/register-ai-match', addAiMatch)

app.get('/', (request: any, reply: any) => {
    reply.send("Hello from game service");
});

// Start app
app.listen({ host: "0.0.0.0", port: 8045 }, (err: any, address: any) => {
	const db = app.betterSqlite3;

	db.prepare(`
        CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL UNIQUE,
            displayName TEXT NOT NULL,
            points INTEGER DEFAULT 0,
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0
        )`).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS tournaments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            totalPlayers INTEGER DEFAULT 0,
            totalMatches INTEGER DEFAULT 0,
            winner INTEGER NOT NULL,
            FOREIGN KEY (winner) REFERENCES players(id)
            )`).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            matchType TEXT NOT NULL,
            tournamentId INTEGER,
            player1 INTEGER NOT NULL,
            player2 INTEGER,
            player1Score INTEGER DEFAULT 0,
            player2Score INTEGER DEFAULT 0,
            winner INTEGER,
            FOREIGN KEY (tournamentId) REFERENCES tournaments(id),
            FOREIGN KEY (player1) REFERENCES players(id),
            FOREIGN KEY (player2) REFERENCES players(id),
            FOREIGN KEY (winner) REFERENCES players(id)
        )`).run();

    if (err) {
        app.log.error(err);
        process.exit(1);
    }

    app.log.info(`Game-service is running at ${address}`);
});
