import fastify from "fastify";
import { readFileSync } from "node:fs"; // function to read files with SSL certificates
import { db } from "./db"
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

const loggerOptions = {
    transport: {
        target: "pino-pretty",
        options: {
            translateTime: "HH:MM:ss Z"
        },
    },
};

const app = fastify({ 
    logger: loggerOptions,
    https: httpsOptions
 });

if (SINGLE_CONTAINER === 'true'){
	app.register(fastifyBetterSqlite3, {
		"pathToDb": './data/users.db',
		"verbose": console.log
	});
} else {
// registers SQLite plugin with DB file /data/users.db.
	app.register(fastifyBetterSqlite3, {
		"pathToDb": '/data/users.db',
		"verbose": console.log
	});
}

// API Routes
app.get('/users', async (request, reply) => {
    try {
        const users = db.prepare('SELECT * FROM users ORDER BY id DESC').all();
        return { success: true, data: users };
    } catch (error) {
        app.log.error(error);
        reply.status(500);
        return { success: false, error: 'Failed to fetch users' };
    }
});

app.get('/users/:id', async (request, reply) => {
    try {
        const { id } = request.params as { id: string };
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        
        if (!user) {
            reply.status(404);
            return { success: false, error: 'User not found' };
        }
        
        return { success: true, data: user };
    } catch (error) {
        app.log.error(error);
        reply.status(500);
        return { success: false, error: 'Failed to fetch user' };
    }
});

app.post('/users', async (request, reply) => {
    try {
        const {displayName} = request.body as any;
        
        if (!displayName) {
            reply.status(400);
            return { success: false, error: 'The display name is required' };
        }

        const insertUser = db.prepare(`
            INSERT INTO users (displayName) 
            VALUES (?)
        `);
        
        const result = insertUser.run(displayName);
        
        // Get the created user
        const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
        
        return { success: true, data: newUser };
    } catch (error) {
        app.log.error(error);
        
        // Handle unique constraint error
        if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
            reply.status(409);
            return { success: false, error: 'Email already exists' };
        }
        
        reply.status(500);
        return { success: false, error: 'Failed to create user' };
    }
});

app.post('/tournament-history', async (request, reply) => {
    try {
        const {
            totalPlayers,
            totalMatches,
            winner,
        } = request.body as any;
        
        if (!totalPlayers || !totalMatches || !winner) {
            reply.status(400);
            return { success: false, error: 'Missing data to insert in tournament history' };
        }

        const insertTournament = db.prepare(`
            INSERT INTO tournaments (totalPlayers, totalMatches, winner) 
            VALUES (?, ?, ?)
        `);
        
        const result = insertTournament.run(totalPlayers, totalMatches, winner);

        
        return { success: true };
    } catch (error) {
        // Server.log.error(error);
        
        if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
            reply.status(409);
            return { success: false, error: error.message };
        }
   }
});

app.post('/match-history', async (request, reply) => {
    try {
        const {
            totalPlayers,
            totalMatches,
            winner,
        } = request.body as any;
        
        if (!totalPlayers || !totalMatches || !winner) {
            reply.status(400);
            return { success: false, error: 'Missing data to insert in tournament history' };
        }

        const insertTournament = db.prepare(`
            INSERT INTO tournaments (totalPlayers, totalMatches, winner) 
            VALUES (?, ?, ?)
        `);
        
        const result = insertTournament.run(totalPlayers, totalMatches, winner);

        
        return { success: true };
    } catch (error) {
        // Server.log.error(error);
        
        if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
            reply.status(409);
            return { success: false, error: error.message };
        }
   }
});

app.get('/', (request, reply) => {
    reply.send("Hello from game service");
});

// Start app
app.listen({ host: "0.0.0.0", port: 8045 }, (err, address) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    app.log.info(`api-game running at ${address}`);
});