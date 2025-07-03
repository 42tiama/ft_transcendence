import fastify, {FastifyRequest, FastifyReply} from "fastify";
import { readFileSync } from "node:fs"; // function to read files with SSL certificates
import dotenv from 'dotenv'; // loads environment variables from .env
import { Database } from 'better-sqlite3'; // type for SQLite database
import fastifyBetterSqlite3 from '@punkish/fastify-better-sqlite3'; // fastify plugin for SQLite
import { get } from "node:http";

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

interface UserPayload {
	id?: number;
	displayName?: string;
	wins?: number;
	losses?: number;
	points?: number;
}

interface MatchPayload {
  id?: number;
  matchType?: string;
  tournamentId?: number | null;
  player1?: number;
  player2?: number | null;
  player1Score?: number;
  player2Score?: number;
  winner?: number | null;
}

interface TournamentPayload {
  id?: number;
  totalPlayers?: number;
  totalMatches?: number;
  winner?: number | null;
  finished?: boolean;
}

// PLAYER FUNCTIONS

async function addUser(
	request: FastifyRequest<{ Body: UserPayload }>,
	reply: FastifyReply
){
	const {
		id,
		displayName
	} = request.body;

	try {
		const stmt = request.server.betterSqlite3.prepare(`
			INSERT INTO
				players (userId, displayName)
			VALUES
				(?, ?)
		`);

		stmt.run(id, displayName);

		request.server.log.info(`Player ${displayName} added to players table.`);
		reply.code(201).send({
			success: true,
			message: 'User created',
		});
	}
	catch (err){
		request.log.error(err);
		reply.code(500).send({
			error: 'Internal server Error'
		});
	}
}

async function playerInfoById(
	request: FastifyRequest<{ Params: { id: string } }>,
	reply: FastifyReply
){
	const userId = request.params.id;

	try {
		const query = request.server.betterSqlite3.prepare(`
			SELECT
				id,
				userId,
				displayName,
				points,
				wins,
				losses
			FROM
				players
			WHERE
				id = ?
		`);

		const playerInfo = query.get(userId);

		if (playerInfo) {
			reply.code(200).send({
				success: true,
				message: `Player with ID ${userId} found`,
				data: playerInfo
			});
		} else {
			reply.code(404).send({
				error: `Player with ID ${userId} not found`
			});
		}
	} catch (err) {
		request.log.error(err, `Error fetching player with ID ${userId}`);
		reply.code(500).send({
			error: 'Internal server Error'
		});
	}
}


async function updateDisplayName(
	request: FastifyRequest<{ Params: { id: string }, Body: UserPayload }>,
	reply: FastifyReply
){
	const userId = request.params.id;
	const {
		displayName
	} = request.body;

	try {
		const query = request.server.betterSqlite3.prepare(`
			UPDATE
				players
			SET
				displayName = ?
			WHERE
				id = ?
		`);

		query.run(displayName, userId);

		request.server.log.info(`Player with ID ${userId} updated.`);
		reply.code(200).send({
			success: true,
			message: 'Display name updated'
		});
	} catch (err) {
		request.log.error(err, `Error updating player with ID ${userId}`);
		reply.code(500).send({
			error: 'Internal server Error'
		});
	}
}

async function updateWinStat(
	request: FastifyRequest<{ Params: { id: string }, Body: UserPayload }>,
	reply: FastifyReply
){
	const userId = request.params.id;
	const {
		points
	} = request.body;

	try {
		const query = request.server.betterSqlite3.prepare(`
			UPDATE
				players
			SET
				points = points + ?,
				wins = wins + ?
			WHERE
				id = ?
		`);

		query.run(points, 1, userId);

		request.server.log.info(`Player with ID ${userId} stats updated.`);
		reply.code(200).send({
			success: true,
			message: 'Player stats updated'
		});
	} catch (err) {
		request.log.error(err, `Error updating player with ID ${userId}`);
		reply.code(500).send({
			error: 'Internal server Error',
			data: {
				points: points,
				userId: userId
			}
		});
	}
}

async function updateLossStat(
	request: FastifyRequest<{ Params: { id: string }, Body: UserPayload }>,
	reply: FastifyReply
){
	const userId = request.params.id;
	const {
		points
	} = request.body;

	try {
		const query = request.server.betterSqlite3.prepare(`
			UPDATE
				players
			SET
				points = points + ?,
				losses = losses + ?
			WHERE
				id = ?
		`);

		query.run(points, 1, userId);

		request.server.log.info(`Player with ID ${userId} losses updated.`);
		reply.code(200).send({
			success: true,
			message: 'Player losses updated'
		});
	} catch (err) {
		request.log.error(err, `Error updating player with ID ${userId}`);
		reply.code(500).send({
			error: 'Internal server Error',
			data: {
				points: points,
				userId: userId
			}
		});
	}
}

async function playersList(
	request: FastifyRequest,
	reply: FastifyReply
){
	try {
		const query = request.server.betterSqlite3.prepare(`
			SELECT
				id, userId, displayName, points, wins, losses
			FROM
				players
		`);

		const players = query.all();

		if (players.length > 0) {
			reply.send({
				success: true,
				message: 'Players found',
				data: players
			});
		} else {
			reply.code(404).send({
				error: 'No players found'
			});
		}
	} catch (err) {
		request.log.error(err, 'Error fetching players');
		reply.code(500).send({
			error: 'Internal server Error'
		});
	}
}

// TOURNAMENT FUNCTIONS

async function addTournament(
	request: FastifyRequest<{ Body: TournamentPayload }>,
	reply: FastifyReply
){

	const {
		totalPlayers,
		totalMatches
	} = request.body;

	try {
		const query = request.server.betterSqlite3.prepare(`
			INSERT INTO
				tournaments (totalPlayers, totalMatches)
			VALUES
				(?, ?)
		`);

		const result = query.run(totalPlayers, totalMatches);

		request.server.log.info(`Tournament with ID ${result.lastInsertRowid} added.`);
		reply.code(201).send({
			success: true,
			message: 'Tournament created',
			data: result.lastInsertRowid
		});
	} catch (err: any) {
		request.log.error(err, `Error adding tournament: ${err.message}`);
		reply.code(500).send({
			error: 'Internal server Error'
		});
	}
}

async function addTornamentWinner(
	request: FastifyRequest<{ Params: { id: string }, Body: TournamentPayload }>,
	reply: FastifyReply
){
	const tournamentId = Number(request.params.id);
	const {
		winner,
		finished
	} = request.body;

	try {
		const query = request.server.betterSqlite3.prepare(`
			UPDATE
				tournaments
			SET
				winner = ?,	finished = ?
			WHERE
				id = ?
		`);

		query.run(winner, finished, tournamentId);

		request.server.log.info(`Tournament with ID ${tournamentId} updated.`);
		reply.code(200).send({
			success: true,
			message: 'Tournament winner updated',
			data: true
		});
	} catch (err) {
		request.log.error(err, `Error updating tournament with ID ${tournamentId}`);
		reply.code(500).send({
			error: `Internal server Error: ${tournamentId}`,
			data: {
				winner: winner,
				finished: finished,
				tournamentId: tournamentId
			}
		});
	}
}

async function tournamentInfoById(
	request: FastifyRequest<{ Params: { id: string } }>,
	reply: FastifyReply
){
	const tournamentId = request.params.id;

	try {
		const query = request.server.betterSqlite3.prepare(`
    		SELECT
				id,
				totalPlayers,
				totalMatches,
				winner
			FROM
				tournaments
			WHERE
				id = ?
		`);

		const tournamentInfo = query.get(tournamentId);

		if (tournamentInfo) {
			reply.send({
				success: true,
				message: `Tournament with ID ${tournamentId} found`,
				data: tournamentInfo
			});
		} else {
			reply.code(404).send({
				error: `Tournament with ID ${tournamentId} not found`
			});
		}
	} catch (err) {
		request.log.error(err, `Error fetching tournament with ID ${tournamentId}`);
		reply.code(500).send({
			error: 'Internal server Error'
		});
	}
}

async function tournamentListByWinner(
	request: FastifyRequest<{ Params: { winnerId: string } }>,
	reply: FastifyReply
){
	const winnerId = request.params.winnerId;

	try {
		const query = request.server.betterSqlite3.prepare(`
			SELECT
				id,
				totalPlayers,
				totalMatches,
				winner
			FROM
				tournaments
			WHERE
				winner = ?
		`);

		const tournaments = query.all(winnerId);

		if (tournaments.length > 0) {
			reply.send({
				success: true,
				message: `Tournaments for winner ID ${winnerId} found`,
				data: tournaments
			});
		} else {
			reply.code(404).send({
				error: `No tournaments found for winner ID ${winnerId}`,
				success: false
			});
		}
	} catch (err) {
		request.log.error(err, `Error fetching tournaments for winner ID ${winnerId}`);
		reply.code(500).send({
			error: 'Internal server Error',
			success: false
		});
	}
}

// MATCH FUNCTIONS

async function addMatch(
	request: FastifyRequest<{ Body: MatchPayload }>,
	reply: FastifyReply
){
	const {
		matchType,
		tournamentId,
		player1,
		player2,
		player1Score,
		player2Score,
		winner
	} = request.body;

	try {
		const query = request.server.betterSqlite3.prepare(`
			INSERT INTO
				matches (matchType, tournamentId, player1, player2, player1Score, player2Score, winner)
			VALUES
				(?, ?, ?, ?, ?, ?, ?)
		`);

		const result = query.run(
			matchType,
			tournamentId ?? null,
			player1,
			player2 ?? null,
			player1Score,
			player2Score,
			winner ?? null
		);

		request.server.log.info(`Match with ID ${result.lastInsertRowid} added.`);
		reply.code(201).send({
			success: true,
			message: 'Match created',
			data: result.lastInsertRowid
		});
	} catch (err: any) {
		request.log.error(err, `Error adding match: ${err.message}`);
		reply.code(500).send({
			error: 'Internal server Error',
			data: {
				matchType,
				tournamentId,
				player1,
				player2,
				player1Score,
				player2Score,
				winner
			}
		});
	}
}

async function addMatches(
	request: FastifyRequest<{ Body: { matches: MatchPayload[] } }>,
	reply: FastifyReply
) {
	const matches = request.body.matches;

	const db = request.server.betterSqlite3;
	const insert = db.prepare(`
		INSERT INTO
			matches (
				matchType,
				tournamentId,
				player1,
				player2,
				player1Score,
				player2Score,
				winner
		) VALUES
			(?, ?, ?, ?, ?, ?, ?)
	`);

	let insertedIds: number[] = [];

	const insertMany = db.transaction((matches: MatchPayload[]) => {
		for (const match of matches) {
		const result = insert.run(
			match.matchType,
			match.tournamentId ?? null,
			match.player1,
			match.player2 ?? null,
			match.player1Score,
			match.player2Score,
			match.winner ?? null
		);
		insertedIds.push(Number(result.lastInsertRowid));
		}
	});

	try {
		insertMany(matches);
		reply.code(201).send({
		success: true,
		message: 'Matches created',
		data: insertedIds
		});
	} catch (err) {
		request.log.error(err, 'Error adding matches');
		reply.code(500).send({
		error: 'Internal server Error'
		});
  	}
}

async function matchInfoById(
	request: FastifyRequest<{ Params: { id: string } }>,
	reply: FastifyReply
){
	const matchId = request.params.id;

	try {
		const query = request.server.betterSqlite3.prepare(`
			SELECT
				id,
				matchType,
				tournamentId,
				player1,
				player2,
				player1Score,
				player2Score,
				winner
			FROM
				matches
			WHERE
				id = ?
		`);

		const matchInfo = query.get(matchId);

		if (matchInfo) {
			reply.send({
				success: true,
				message: `Match with ID ${matchId} found`,
				data: matchInfo
			});
		} else {
			reply.code(404).send({
				error: `Match with ID ${matchId} not found`
			});
		}
	} catch (err) {
		request.log.error(err, `Error fetching match with ID ${matchId}`);
		reply.code(500).send({
			error: 'Internal server Error'
		});
	}
}

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

async function matchListByPlayerId(
	request: FastifyRequest<{ Params: { id: string } }>,
	reply: FastifyReply
){
	const { id } = request.params;

	try {
		const db = app.betterSqlite3;
		const stmt = db.prepare(`
			SELECT
				*
			FROM
				matches
			WHERE
				player1 = ? OR player2 = ?
			ORDER BY
				matchDate DESC
		`);

		const matches = stmt.all(id, id) as MatchRecord[];
		app.log.info(`No matches found for Match History.`);
		if (matches.length === 0) {
			return reply.send({
				success: true,
				data: null
			});
		}

		// Format Match Records to Match History
		const getDisplayName = db.prepare('SELECT displayName FROM players WHERE id = ?');

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
		reply.code(500).send({
			error: "Failed to fetch matches.",
		});
	}
}

async function matchStatsByPlayerId(
	request: FastifyRequest<{ Params: { id: string } }>,
	reply: FastifyReply
){
	const { id } = request.params;

	try {
			const query = request.server.betterSqlite3.prepare(`
				SELECT
					wins,
					losses
				FROM
					players
				WHERE
					id = ?
			`);

		const stat = query.get(id) as { wins: number, losses: number } | undefined;
		const wins = stat?.wins ?? 0;
		const losses = stat?.losses ?? 0;
		const totalMatches = wins + losses;

		if (totalMatches === 0) {
			app.log.info('No matches found for Match Stat');
			return reply.send({
				success: true,
				data: null
			});
		}
		const winRate = Math.round((wins / totalMatches) * 100);

		app.log.info('User total matches: ', totalMatches);

		reply.send({
			success: true,
			data: {
				wins,
				losses,
				winRate,
				totalMatches
			}
		});
	} catch (err: any) {
		app.log.error('Error fetching matches:', err);
		reply.code(500).send({
			error: "Failed to fetch matches."
		});
	}
}

async function addResultMatch(
	request: FastifyRequest<{ Params: { matchId: string }, Body: MatchPayload }>,
	reply: FastifyReply
){
	const matchId = request.params.matchId;
	const {
		player1Score,
		player2Score,
		winner
	} = request.body;

	try {
		const query = request.server.betterSqlite3.prepare(`
			UPDATE
				matches
			SET
				player1Score = ?, player2Score = ?, winner = ?
			WHERE id = ?
		`);

		query.run(player1Score, player2Score, winner, matchId);

		request.server.log.info(`Match with ID ${matchId} updated.`);
		reply.code(200).send({
			success: true,
			message: 'Match result updated',
			data: true
		});
	} catch (err) {
		request.log.error(err, `Error updating match with ID ${matchId}`);
		reply.code(500).send({
			error: 'Internal server Error',
			data: false
		});
	}
}

async function matchListByTornamentId(
	request: FastifyRequest<{ Params: { tournamentId: string } }>,
	reply: FastifyReply
){
	const tournamentId = request.params.tournamentId;

	try {
		const query = request.server.betterSqlite3.prepare(`
			SELECT
				id,
				matchType,
				tournamentId,
				player1,
				player2,
				player1Score,
				player2Score,
				winner
			FROM
				matches
			WHERE
				tournamentId = ?
		`);

		const matches = query.all(tournamentId);

		if (matches.length > 0) {
			reply.send({
				success: true,
				message: `Matches for tournament ID ${tournamentId} found`,
				data: matches
			});
		} else {
			reply.code(404).send({
				error: `No matches found for tournament ID ${tournamentId}`,
				sucess: false
			});
		}
	} catch (err) {
		request.log.error(err, `Error fetching matches for tournament ID ${tournamentId}`);
		reply.code(500).send({
			error: 'Internal server Error',
			success: false
		});
	}
}

/////////////////// ROUTE HANDLERS //////////////////

/* POST */
app.post('/register-from-auth', addUser);

// Tournament
app.post('/tournament/register', addTournament);
app.post('/tournament/:id/result', addTornamentWinner);

// Match
app.post('/match/register', addMatch );
app.post('/match/:id/result', addResultMatch);
app.post('/match/register-many', addMatches)

// Player
app.post('/player/register', addUser);
app.post('/player/:id/info/display-name', updateDisplayName);
app.post('/player/:id/info/wins', updateWinStat);
app.post('/player/:id/info/losses', updateLossStat);


/* GET */
app.get('/', (request: any, reply: any) => { reply.send("Hello from game service"); });

// Tournament
app.get('/tournament/:id/info', tournamentInfoById);
app.get('/tournament/:winnerId/matches', tournamentListByWinner);

// Match
app.get('/match/:id/info', matchInfoById);
app.get('/match/tournament/:tournamentId/matches', matchListByTornamentId);
app.get('/match/player/:id/matches', matchListByPlayerId);
app.get('/match/player/:id/stats', matchStatsByPlayerId);

// Player
app.get('/player/:id/info', playerInfoById);
app.get('/player/players', playersList);


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
            totalPlayers INTEGER NOT NULL,
            totalMatches INTEGER NOT NULL,
            winner INTEGER,
			finished INTEGER DEFAULT 0,
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
			matchDate DATETIME DEFAULT CURRENT_TIMESTAMP,
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
