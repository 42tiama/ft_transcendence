import fastify from "fastify";
import fastifyHttpProxy from "@fastify/http-proxy";
import cors from "@fastify/cors";

const loggerOptions = {
    transport: {
        target: "pino-pretty",
        options: {
            translateTime: "HH:MM:ss Z",
        },
    },
};

const corsOptions = {
	origin : true
}
//instatiate server
const server = fastify({ logger: loggerOptions });


//enabling cors
server.register(cors, corsOptions);

// register plugin to send request to other services
// server.register(fastifyHttpProxy, {
// 	upstream: 'http://auth:8043',
// 	prefix: '/register'
// });

server.get('/', (req, reply)=> {
	reply.send({hello: 'world'});
})

//business logic

//start listening
server.listen({ host: "0.0.0.0", port: 8044 }, (err, address) => {
    if (err) {
        server.log.error(err);
        process.exit(1);
    }
});
