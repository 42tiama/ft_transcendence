import fastify from "fastify";
import fastifyStatic from "@fastify/static";

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
	root: "/" //root of static files webserver will be the root dir of the production container
});

server.get("/:path", (request, reply) => {
    reply.sendFile("/build/static/html/index.html");
});

server.listen({ host: "0.0.0.0", port: 8042 }, (err, address) => {
    if (err) {
        server.log.error(err);
        process.exit(1);
    }
});
