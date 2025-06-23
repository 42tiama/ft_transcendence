import fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { readFileSync } from "node:fs";
import dotenv from 'dotenv'; // loads environment variables from .env

//loads environment variables from .env
dotenv.config();

const SINGLE_CONTAINER = process.env.SINGLE_CONTAINER;

const httpsOptions = {
	key: readFileSync("certs/client/key.pem"),
	cert: readFileSync("certs/client/cert.pem")
}

const server = fastify({
	logger: true,
	https: httpsOptions
});

if (SINGLE_CONTAINER === 'true'){
server.register(fastifyStatic,
{
    root: "/fullbase/src" //root of static files webserver will be the root dir of the production container
});

server.get("/:path", (request, reply) => {
     reply.sendFile("./build/static/html/index.html");
});
} else {
	server.register(fastifyStatic,
	{
		root: "/" 
	});

	server.get("/:path", (request, reply) => {
		reply.sendFile("/build/static/html/index.html");
	});
}


server.listen({ host: "0.0.0.0", port: 8042 }, (err, address) => {
    if (err) {
        server.log.error(err);
        process.exit(1);
    }
});
