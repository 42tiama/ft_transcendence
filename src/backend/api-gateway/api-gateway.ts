import fastify from "fastify";
import fastifyHttpProxy from "@fastify/http-proxy";

const loggerOptions = {
    transport: {
        target: "pino-pretty",
        options: {
            translateTime: "HH:MM:ss Z",
        },
    },
};
//instatiate server
const server = fastify({ logger: loggerOptions });

//register plugin to send request to other services
// server.register(fastifyHttpProxy, {
// 	upstream: 'http://localhost:8043',
// 	prefix: '/service1'
// 	});

//business logic

//start listening
//TODO: change port that api-gateway is listening. Since we'll use https, it will be 443
server.listen({ host: "0.0.0.0", port: 8043 }, (err, address) => {
    if (err) {
        server.log.error(err);
        process.exit(1);
    }
});
