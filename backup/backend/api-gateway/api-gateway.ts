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
	prefix: '/profile',
	rewritePrefix: '/profile'
});

server.register(fastifyHttpProxy, {
	upstream: 'https://auth:8043',
	prefix: '/google-login',
	rewritePrefix: '/google-login'
});

server.register(fastifyHttpProxy, {
	upstream: 'https://profile:8046',
	prefix: '/register-profile',
	rewritePrefix: '/register'
});

server.get('/', (req, reply)=> {
    req.log.info('Handling root route');
	reply.send({hello: 'from api-gateway'});
})

//business logic

//start listening
server.listen({ host: "0.0.0.0", port: 8044 }, (err, address) => {
    if (err) {
        server.log.error(err);
        process.exit(1);
    }
    server.log.info(`Api-gateway listening at ${address}`);
});
