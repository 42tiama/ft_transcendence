import fastify from "fastify";
import { db } from "./db"

const loggerOptions = {
    transport: {
        target: "pino-pretty",
        options: {
            translateTime: "HH:MM:ss Z",
        },
    },
};

const app = fastify({ logger: loggerOptions });

// API Routes
app.get('/users', async (request, reply) => {
    try {
        const users = db.prepare('SELECT * FROM users ORDER BY id DESC').all();
        return { success: true, data: users };
    } catch (error) {
        app.log.error(error);
        reply.status(500);
        return { success: false, error: 'Failed to fetch users' };
    }
});

app.get('/users/:id', async (request, reply) => {
    try {
        const { id } = request.params as { id: string };
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        
        if (!user) {
            reply.status(404);
            return { success: false, error: 'User not found' };
        }
        
        return { success: true, data: user };
    } catch (error) {
        app.log.error(error);
        reply.status(500);
        return { success: false, error: 'Failed to fetch user' };
    }
});

app.post('/users', async (request, reply) => {
    try {
        const { display_name, email } = request.body as any;
        
        if (!display_name || !email) {
            reply.status(400);
            return { success: false, error: 'The display name and email are required' };
        }

        const insertUser = db.prepare(`
            INSERT INTO users (display_name, email) 
            VALUES (?, ?)
        `);
        
        const result = insertUser.run(display_name, email);
        
        // Get the created user
        const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
        
        return { success: true, data: newUser };
    } catch (error) {
        app.log.error(error);
        
        // Handle unique constraint error
        if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
            reply.status(409);
            return { success: false, error: 'Email already exists' };
        }
        
        reply.status(500);
        return { success: false, error: 'Failed to create user' };
    }
});

app.get('/', (request, reply) => {
    reply.send("Hello from game service");
});

// Start app
app.listen({ host: "0.0.0.0", port: 8045 }, (err, address) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    app.log.info(`api-game running at ${address}`);
});