import fastify from 'fastify'

const loggerOptions = {
	transport: {
		target: 'pino-pretty',
		options: {
		translateTime: 'HH:MM:ss Z'}
	}
}

const app = fastify({logger: loggerOptions});

app.get('/', (request, reply) => reply.send('Hello from service1'));

app.listen({port: 8043});
