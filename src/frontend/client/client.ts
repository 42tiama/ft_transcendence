import fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { readFileSync } from "node:fs";

const httpsOptions = {
	key: readFileSync("/certs/key.pem"),
	cert: readFileSync("/certs/cert.pem")
}

const server = fastify({
	logger: true,
	https: httpsOptions
});

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
