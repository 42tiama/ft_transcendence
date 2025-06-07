import fastify from 'fastify'

// const loggerOptions = {
// 	transport: {
// 		target: 'pino-pretty',
// 		options: {
// 		translateTime: 'HH:MM:ss Z'}
// 	}
// }

// const app = fastify({logger: true});

// const loggerOptions = {
// 	base: {service: 'service1'},
// 	timestamp: () => `,"@timestamp":"${new Date().toISOString()}"`
// }

const app = fastify({logger: true});

app.get('/', (request, reply) => reply.send('Hello from service1'));

app.listen({port: 8043});
