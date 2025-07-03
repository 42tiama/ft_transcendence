import fastify from "fastify";
import fastifyHttpProxy from "@fastify/http-proxy";
import cors from "@fastify/cors";
import { readFileSync } from "node:fs";

const httpsOptions = {
	key: readFileSync("certs/api-gateway/key.pem"),
	cert: readFileSync("certs/api-gateway/cert.pem")
}

const corsOptions = {
	origin : true
}

//instatiate server
const server = fastify({
	logger: true,
	https: httpsOptions
});

//enabling cors
server.register(cors, corsOptions);

// register plugin to send request to other services
server.register(fastifyHttpProxy, {
	upstream: 'https://auth:8043',
	prefix: '/register',
	rewritePrefix: '/register'
});

server.register(fastifyHttpProxy, {
	upstream: 'https://auth:8043',
	prefix: '/login',
	rewritePrefix: '/login'
});

server.register(fastifyHttpProxy, {
	upstream: 'https://auth:8043',
	prefix: '/changepass',
	rewritePrefix: '/changepass'
});

server.register(fastifyHttpProxy, {
	upstream: 'https://auth:8043',
	prefix: '/google-login',
	rewritePrefix: '/google-login'
});

server.register(fastifyHttpProxy, {
	upstream: 'https://profile:8046',
	prefix: '/profile-register',
	rewritePrefix: '/profile-register'
});

server.register(fastifyHttpProxy, {
	upstream: 'https://profile:8046',
	prefix: '/profile-by-id',
	rewritePrefix: '/profile-by-id'
});

server.register(fastifyHttpProxy, {
	upstream: 'https://profile:8046',
	prefix: '/profile-by-displayname',
	rewritePrefix: '/profile-by-displayname'
});

server.register(fastifyHttpProxy, {
	upstream: 'https://profile:8046',
	prefix: '/profile-update',
	rewritePrefix: '/profile-update'
});

server.register(fastifyHttpProxy, {
	upstream: 'https://profile:8046',
	prefix: '/follow-stat',
	rewritePrefix: '/follow-stat'
});

server.register(fastifyHttpProxy, {
	upstream: 'https://profile:8046',
	prefix: '/friend-register',
	rewritePrefix: '/friend-register'
});

server.register(fastifyHttpProxy, {
	upstream: 'https://profile:8046',
	prefix: '/friend-delete',
	rewritePrefix: '/friend-delete'
});

server.register(fastifyHttpProxy, {
	upstream: 'https://profile:8046',
	prefix: '/friend-list',
	rewritePrefix: '/friend-list'
});

server.register(fastifyHttpProxy, {
	upstream: 'https://profile:8046',
	prefix: '/heartbeat',
	rewritePrefix: '/heartbeat'
});

server.register(fastifyHttpProxy, {
	upstream: 'https://profile:8046',
	prefix: '/online-status',
	rewritePrefix: '/online-status'
});

server.register(fastifyHttpProxy, {
	upstream: 'https://profile:8046',
	prefix: '/uploads',
	rewritePrefix: '/uploads'
});

server.get('/', (req, reply)=> {
    req.log.info('Handling root route');
	reply.send({hello: 'from api-gateway'});
});

server.register(fastifyHttpProxy, {
	upstream: 'https://game-service:8045',
	prefix: '/player/',
	rewritePrefix: '/player/',
});

server.register(fastifyHttpProxy, {
	upstream: 'https://game-service:8045',
	prefix: '/tournament/',
	rewritePrefix: '/tournament/'
});

server.register(fastifyHttpProxy, {
	upstream: 'https://game-service:8045',
	prefix: '/match/',
	rewritePrefix: '/match/'
});

//business logic

//start listening
server.listen({ host: "0.0.0.0", port: 8044 }, (err: any, address: any) => {
    if (err) {
        server.log.error(err);
        process.exit(1);
    }
    server.log.info(`Api-gateway listening at ${address}`);
});
