import fastify from "fastify";
import { readFileSync } from "node:fs"; // function to read files with SSL certificates
// import { db } from "./db";
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

 //using fastifyBetterSqlite3 (instead of bettersqlite)
 app.register(fastifyBetterSqlite3, {
  "pathToDb": pathToDb,
  "verbose": console.log
 });


// ROUTE HANDLERS
// app.get('/users', async (request: any, reply: any) => {
//     try {
//         const users = db.prepare('SELECT * FROM users ORDER BY id DESC').all();
//         return { success: true, data: users };
//     } catch (error) {
//         app.log.error(error);
//         reply.status(500);
//         return { success: false, error: 'Failed to fetch users' };
//     }
// });

// app.get('/users/:id', async (request: any, reply: any) => {
//     try {
//         const { id } = request.params as { id: string };
//         const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        
//         if (!user) {
//             reply.status(404);
//             return { success: false, error: 'User not found' };
//         }
        
//         return { success: true, data: user };
//     } catch (error) {
//         app.log.error(error);
//         reply.status(500);
//         return { success: false, error: 'Failed to fetch user' };
//     }
// });

// app.post('/users', async (request: any, reply: any) => {
//     try {
//         const {displayName} = request.body as any;
        
//         if (!displayName) {
//             reply.status(400);
//             return { success: false, error: 'The display name is required' };
//         }

//         const insertUser = db.prepare(`
//             INSERT INTO users (displayName) 
//             VALUES (?)
//         `);
        
//         const result = insertUser.run(displayName);
        
//         // Get the created user
//         const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
        
//         return { success: true, data: newUser };
//     } catch (error) {
//         app.log.error(error);
        
//         // Handle unique constraint error
//         if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
//             reply.status(409);
//             return { success: false, error: 'Email already exists' };
//         }
        
//         reply.status(500);
//         return { success: false, error: 'Failed to create user' };
//     }
// });

// tournament routes
// app.get('/tournament-history', async (request: any, reply: any) => {
//     try {
//         const tournaments = db.prepare('SELECT * FROM tournaments ORDER BY id DESC').all();
//         return { success: true, data: tournaments };
//     } catch (error) {
//         // server.log.error(error); //uncomment after import log stash
//         reply.status(500);
//         return { success: false, error: 'Failed to fetch tournaments' };
//     }
// });

// app.post('/tournament-history', async (request: any, reply: any) => {
//   try {
//     const tournamentInfo = request.body as TournamentInfo;
    
//     if (!tournamentInfo.totalPlayers || !tournamentInfo.totalMatches || !tournamentInfo.winner) {
//         reply.status(400);
//         return { success: false, error: 'Missing data to insert in tournament history' };
//     }

//     const insertTournament = db.prepare(`
//         INSERT INTO tournaments (totalPlayers, totalMatches, winner) 
//         VALUES (?, ?, ?)
//     `);
    
//     insertTournament.run(tournamentInfo.totalPlayers, tournamentInfo.totalMatches, tournamentInfo.winner);
    
//     // server.log.info('Data inserted at tournaments table'); // descomentar qdo importar logstash
    
//     return { success: true };
    
//   } catch (error) {
//     // server.log.error('Error inserting tournament data:', error); // descomentar qdo importar logstash
    
//     if (error instanceof Error) {
//       if (error.message.includes('UNIQUE constraint failed')) {
//         reply.status(409);
//         return { success: false, error: 'Duplicate tournament data' };
//       }
      
//       if (error.message.includes('FOREIGN KEY constraint failed')) {
//         reply.status(400);
//         return { success: false, error: 'Invalid player/winner reference' };
//       }
//     }
    
//     reply.status(500);
//     return { success: false, error: 'Internal server error' };
//   }
// });

//match routes

// app.get('/match-history', async (request: any, reply: any) => {
//     try {
//         const matches = db.prepare('SELECT * FROM matches ORDER BY id DESC').all();
//         return { success: true, data: matches };
//     } catch (error) {
//         // server.log.error(error); // uncomments when import logstash
//         reply.status(500);
//         return { success: false, error: 'Failed to fetch matches' };
//     }
// });

// app.post('/match-history', async (request: any, reply: any) => {
//   try {
//     const matches = request.body as Match[];
    
//     if (!matches || !Array.isArray(matches) || matches.length === 0) {
//       reply.status(400);
//       return { success: false, error: 'Missing or invalid match data' };
//     }

//     for (const match of matches) {
//       if (!match.matchType || !match.player1 || !match.player2 || !match.winner) {
//         reply.status(400);
//         return { success: false, error: 'Invalid match data: missing required fields' };
//       }
//     }

//     const insertMatch = db.prepare(`
//       INSERT INTO matches (matchType, tournamentId, player1, player2, player1Score, player2Score, winner)
//       VALUES (?, ?, ?, ?, ?, ?, ?)
//     `);
    
//     const insertTransaction = db.transaction((matchesToInsert: Match[]) => {
//       for (const match of matchesToInsert) {
//         insertMatch.run(
//           match.matchType,
//           match.tournamentId || null,
//           match.player1,
//           match.player2,
//           match.player1Score,
//           match.player2Score,
//           match.winner
//         );
//       }
//     });

//     insertTransaction(matches);
//     // server.log.info('Data inserted at matches table'); // descomentar qdo importar logstash
//     return { success: true, data: { insertedCount: matches.length } };
    
//   } catch (error) {
//     // server.log.error('Error inserting match history:', error); // descomentar qdo importar logstash
    
//     if (error instanceof Error) {
//       if (error.message.includes('UNIQUE constraint failed')) {
//         reply.status(409);
//         return { success: false, error: 'Duplicate match data' };
//       }
      
//       if (error.message.includes('FOREIGN KEY constraint failed')) {
//         reply.status(400);
//         return { success: false, error: 'Invalid player or tournament reference' };
//       }
//     }
    
//     reply.status(500);
//     return { success: false, error: 'Internal server error' };
//   }
// });

app.get('/', (request: any, reply: any) => {
    reply.send("Hello from game service");
});

// Start app
app.listen({ host: "0.0.0.0", port: 8045 }, (err: any, address: any) => {
  const db = app.betterSqlite3;

  try {db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            displayName TEXT NOT NULL,
            points INTEGER DEFAULT 0,
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0
        )`).run();
  }
  catch (err){
    app.log.error(err);
  };

    db.prepare(`
        CREATE TABLE IF NOT EXISTS tournaments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            totalPlayers INTEGER DEFAULT 0,
            totalMatches INTEGER DEFAULT 0,
            winner TEXT NOT NULL,
            FOREIGN KEY (winner) REFERENCES users(displayName)
            )
        `).run();

    db.prepare(`
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
    `).run();

    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    app.log.info(`Game-service is running at ${address}`);
});