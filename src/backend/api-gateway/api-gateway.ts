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

// server.register(fastifyHttpProxy, {
// 	upstream: 'https://auth:8043',
// 	prefix: '/token',
// 	rewritePrefix: '/token'
// });

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
	prefix: '/match-stat',
	rewritePrefix: '/match-stat'
});

server.register(fastifyHttpProxy, {
	upstream: 'https://profile:8046',
	prefix: '/match-hist',
	rewritePrefix: '/match-hist'
});

server.register(fastifyHttpProxy, {
	upstream: 'https://profile:8046',
	prefix: '/friend-register',
	rewritePrefix: '/friend-register'
});



server.get('/', (req, reply)=> {
    req.log.info('Handling root route');
	reply.send({hello: 'from api-gateway'});
});

server.register(fastifyHttpProxy, {
	upstream: 'https://game-service:8045',
	prefix: '/register-ai-match',
	rewritePrefix: '/register-ai-match'
});

server.register(fastifyHttpProxy, {
	upstream: 'https://game-service:8045',
	prefix: '/tournament-history',
	rewritePrefix: '/tournament-history'
});

server.register(fastifyHttpProxy, {
	upstream: 'https://game-service:8045',
	prefix: '/match-history',
	rewritePrefix: '/match-history'
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
