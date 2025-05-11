import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { join } from 'node:path';
const loggerOptions = {
    transport: {
        target: 'pino-pretty',
        options: {
            translateTime: 'HH:MM:ss Z'
        }
    }
};
//instatiate server
const server = fastify({ logger: loggerOptions });
//register plugin to server static files
server.register(fastifyStatic, {
    root: join(__dirname, '../client/static/html')
});
//register plugin to send request to other services
// server.register(fastifyHttpProxy, {
// 	upstream: 'http://localhost:8043',
// 	prefix: '/service1'
// 	});
// console.log(join(__dirname, '../client/build'));
//business logic
server.get('/', (request, reply) => reply.sendFile('index.html'));
//start listening
server.listen({ host: '0.0.0.0', port: 8042 }, (err, address) => {
    if (err) {
        server.log.error(err);
        process.exit(1);
    }
});
