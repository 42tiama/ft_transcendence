import fastify from 'fastify'
import fastifyStatic from '@fastify/static';

import { join } from 'node:path'

const server = fastify({logger: true});

server.register(fastifyStatic,
{
	root: join(__dirname, '../../build/client')
});

console.log(join(__dirname, '../../build/client'));

server.get('/', (request, reply) => reply.sendFile('index.html'));

server.listen({ host: '0.0.0.0', port: 8042 }, (err, address) => {
	if (err) {
		server.log.error(err);
		process.exit(1);
	}
})
