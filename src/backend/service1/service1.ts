import fastify from 'fastify'

const app = fastify({logger: true});

app.get('/', (request, reply) => reply.send('Hello from service1'));

app.listen({port: 8043});
