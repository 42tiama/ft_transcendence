import { fastify, FastifyRequest } from 'fastify';
import { Database } from 'better-sqlite3'
import fastifyBetterSqlite3 from '@punkish/fastify-better-sqlite3';

import { readFileSync } from "node:fs";

//since fastify-better-sqlite3 will only decorate fastify instance at runtime,
//we need to warn the compiler that the fastify object will have a property called
//betterSqlite3
declare module 'fastify' {
  interface FastifyInstance {
    betterSqlite3: Database;
  }
}

//type definition
interface UserRequestBody {
  name: string;
  email: string;
}

const loggerOptions = {
	transport: {
		target: 'pino-pretty',
		options: {
		translateTime: 'HH:MM:ss Z'}
	}
}

const httpsOptions = {
	key: readFileSync("/certs/key.pem"),
	cert: readFileSync("/certs/cert.pem")
}

const app = fastify({
	logger: loggerOptions,
	https: httpsOptions
});

//register plugin
app.register(fastifyBetterSqlite3, {
	"pathToDb": '/data/users.db',
	"verbose": console.log
})

//prepare routes
app.post('/', (request: FastifyRequest<{ Body: UserRequestBody }>, reply) => {
	const { name, email} = request.body;

	const db = app.betterSqlite3;

	try {
    const stmt = db.prepare(`INSERT INTO users (name, email) VALUES (?, ?)`);
    const result = stmt.run(name, email);
    reply.code(201).send({ id: result.lastInsertRowid, name, email });
  } catch (err: any) {
    reply.code(400).send({ error: err.message });
  }
})

app.get('/', (request, reply) => {
	reply.send("Hello from auth service");
	// const db = app.betterSqlite3;
	//
	// console.log("inside route callback");
	// const stmt = db.prepare(`SELECT * FROM users`);
	// const result = stmt.all();
	//
	// console.log(result);
	//
	// return result;
})


app.listen({host: "0.0.0.0", port: 8043 }, (err, address) => {

	//these commands will run before server starts listening
	const db = app.betterSqlite3;

	db.prepare(`CREATE TABLE IF NOT EXISTS users (
				  id INTEGER PRIMARY KEY AUTOINCREMENT,
				  name TEXT NOT NULL,
				  email TEXT NOT NULL UNIQUE)`).run();

	if (err)
		{
		app.log.error(err);
		process.exit(1);
		}
	});
