import fastify from "fastify";
import fastifyStatic from "@fastify/static";

import { join } from "node:path";

const loggerOptions = {
    transport: {
        target: "pino-pretty",
        options: {
            translateTime: "HH:MM:ss Z",
        },
    },
};

const server = fastify({ logger: loggerOptions });

server.register(fastifyStatic,
{
	root: join(__dirname, '../../')
});

server.get("/", (request, reply) => {
    reply.sendFile("/build/frontend/static/html/index.html");
});

server.listen({ host: "0.0.0.0", port: 8042 }, (err, address) => {
    if (err) {
        server.log.error(err);
        process.exit(1);
    }
});
