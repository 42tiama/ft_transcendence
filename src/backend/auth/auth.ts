
import { fastify, FastifyRequest } from 'fastify'; // framework and request type
import { Database } from 'better-sqlite3'; // type for SQLite database
import fastifyBetterSqlite3 from '@punkish/fastify-better-sqlite3'; // fastify plugin for SQLite
import { readFileSync } from "node:fs"; // function to read files with SSL certificates
import bcrypt from 'bcrypt'; // password hashing library
import { authenticator } from 'otplib'; // for TOTP secrets & validation
import crypto from 'crypto'; // for encryption/decryption of TOTP secrets
import dotenv from 'dotenv'; // loads environment variables from .env
import fastifyJwt from '@fastify/jwt'; // fastify plugin for JWT token authentication
import fetch from 'node-fetch'; // used for Google OAuth token verification

// loads environment variables from .env
dotenv.config();

// reads secrets from env
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;
const ENCRYPTION_SALT = process.env.ENCRYPTION_SALT;
const JWT_SECRET = process.env.JWT_SECRET;
if (!ENCRYPTION_SECRET || !ENCRYPTION_SALT || !JWT_SECRET) {
	throw new Error('❌ FATAL: ENCRYPTION_SECRET, ENCRYPTION_SALT, and JWT_SECRET must be set in .env. Aborting.');
}

// uses scrypt to derive a 32-byte AES key from the secret and salt.
const ENCRYPTION_KEY = crypto.scryptSync(ENCRYPTION_SECRET, ENCRYPTION_SALT, 32);

// AES-256 encrypts a string, prepends IV as hex
function encrypt(text: string): string {
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
	const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
	return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// decodes IV and ciphertext, returns decrypted string.
function decrypt(encrypted: string): string {
	const [ivHex, encryptedHex] = encrypted.split(':');
	if (!ivHex || !encryptedHex) {
		throw new Error('Invalid encrypted format. Expected iv:ciphertext');
	}
	const iv = Buffer.from(ivHex, 'hex');
	const encryptedText = Buffer.from(encryptedHex, 'hex');
	const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
	return Buffer.concat([decipher.update(encryptedText), decipher.final()]).toString('utf8');
}


// Adds betterSqlite3 (DB) and authenticate (JWT middleware) to Fastify.
declare module 'fastify' {
	interface FastifyInstance {
		betterSqlite3: Database;
		authenticate: any;
	}
}

// requestBody interfaces: types for /register
interface UserRequestBody {
	email: string;
	displayName: string;
	password: string;
}

// requestBody interfaces: types for /login
interface LoginRequestBody {
	email: string;
	password: string;
	totp: string;
}

// requestBody interfaces: types for /changepass requests
interface ChangePassRequestBody {
	email: string;
	totp: string;
	newPassword: string;
}

// user interface: DB user row type.
interface User {
	id: number;
	email: string;
	displayName: string;
	password: string;
	totp_secret: string;
}

// email validation.
function isValidEmail(email: string): boolean {
	// const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
	const emailRegex = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+\.[a-z]{2,}$/;
	if (!email || email.length > 320) return false;
	const [local, domain] = email.split('@');
	if (!local || !domain || local.length > 64 || domain.length > 255) return false;
	return emailRegex.test(email);
}

// password validation.
function isValidPassword(password: string): boolean {
	return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
}

// display name validation (max 9 chars, not empty)
function isValidDisplayName(displayName: string): boolean {
	return typeof displayName === 'string' && displayName.trim().length > 0 && displayName.trim().length <= 9;
}

// reads the SSL/TLS certificate and private key
const httpsOptions = {
	key: readFileSync("certs/auth/key.pem"),
	cert: readFileSync("certs/auth/cert.pem")
};

// creates a new Fastify server instance with logging and HTTPS enabled
const app = fastify({
	logger: true,
	https: httpsOptions
});

// registers SQLite plugin with DB file /data/users.db.
app.register(fastifyBetterSqlite3, {
	//"pathToDb": '/data/users.db', CHANGE FOR PRODUCTION
	"pathToDb": './data/users.db',

	"verbose": console.log
});

// registers JWT plugin with secret
app.register(fastifyJwt, {
	secret: JWT_SECRET,
});

// adds authenticate decorator: Middleware for protected endpoints using JWT.
app.decorate("authenticate", async function(request: FastifyRequest, reply: any) {
	try {
		await request.jwtVerify();
	} catch (err) {
		reply.code(401).send({ error: 'Unauthorized' });
	}
});

// logs easter egg for Thais
const message: string = "Vai Corinthians!";
console.log(message);


// --- POST /register ---
app.post('/register', async (request: FastifyRequest<{ Body: UserRequestBody }>, reply) => {
	const { email, displayName, password } = request.body;

	// validates email
	if (!isValidEmail(email)) {
		reply.code(400).send({ error: "Invalid email format." });
		return;
	}

	// validates display name
	if (!isValidDisplayName(displayName)) {
		reply.code(400).send({ error: "Display Name must be 1 to 9 characters." });
		return;
	}

	// validates password
	if (!isValidPassword(password)) {
		reply.code(400).send({ error: "Password too weak. Must be 8+ chars, include upper and lower case, number, special char." });
		return;
	}

	const db = app.betterSqlite3;
	try {
		// hashes the password with bcrypt
		const hashedPassword = await bcrypt.hash(password, 10);

		// generate and encrypt TOTP secret for 2FA
		const totpSecret = authenticator.generateSecret();
		const encryptedTotp = encrypt(totpSecret);

		// inserts user into DB
		const stmt = db.prepare(
			`INSERT INTO users (email, displayName, password, totp_secret) VALUES (?, ?, ?, ?)`
		);
		const result = stmt.run(email, displayName, hashedPassword, encryptedTotp);
		// returns: new user ID, email, displayName, and plain TOTP secret (for user to set up authenticator app).
		reply.code(201).send({ id: result.lastInsertRowid, email, displayName, totpSecret });
	} catch (err: any) {
		// handles errors
		let message = err.message;
		if (message && message.includes('UNIQUE constraint failed: users.email')) {
			message = 'This email is already registered. Please use another email.';
		}
		reply.code(400).send({ error: message });
	}
});



// --- POST /login ---
app.post('/login', async (request: FastifyRequest<{ Body: LoginRequestBody }>, reply) => {
	const { email, password, totp } = request.body;

	// validates email format
	if (!isValidEmail(email)) {
		reply.code(400).send({ error: "Invalid email format." });
		return;
	}

	// validates password format
	if (!password) {
		reply.code(400).send({ error: "Password is required." });
		return;
	}

	// validates TOTP
	if (!totp) {
		reply.code(400).send({ error: "TOTP code is required." });
		return;
	}

	const db = app.betterSqlite3;
	try {
		// looks up user by email
		const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as User | undefined;

		if (!user) {
			reply.code(401).send({ error: "Email not found." });
			return;
		}

		// rejects Google users (with placeholder password) from using password login.
		if (user.password === 'Google#1A') {
			reply.code(400).send({ error: "Please use Google Sign-In for this account." });
			return;
		}

		// verifies password with bcrypt.
		const passwordMatch = await bcrypt.compare(password, user.password);
		if (!passwordMatch) {
			reply.code(401).send({ error: "Password does not match." });
			return;
		}

		// decrypts TOTP secret and checks TOTP code.
		let decryptedTotp: string;
		try {
			decryptedTotp = decrypt(user.totp_secret);
		} catch (err) {
			reply.code(500).send({ error: "Failed to decrypt TOTP secret." });
			return;
		}

		const totpValid = authenticator.check(totp, decryptedTotp);
		if (!totpValid) {
			reply.code(401).send({ error: "TOTP code does not match." });
			return;
		}

		// on success: issues a JWT (expires in 12 horas) and returns user info.
		const token = app.jwt.sign({
			id: user.id,
			email: user.email,
			displayName: user.displayName
		}, { expiresIn: '12h' });

		reply.code(200).send({
			success: true,
			email: user.email,
			displayName: user.displayName,
			token
		});
	} catch (err: any) {
		// handles errors: bad email, password, TOTP, etc.
		reply.code(500).send({ error: err.message });
	}
});



// --- POST /changepass ---
app.post('/changepass', async (request: FastifyRequest<{ Body: ChangePassRequestBody }>, reply) => {
	const { email, totp, newPassword } = request.body;

	// validates inputs
	if (!email || !totp || !newPassword) {
		reply.code(400).send({ error: "Missing required fields." });
		return;
	}

	// validates email format
	if (!isValidEmail(email)) {
		reply.code(400).send({ error: "Invalid email format." });
		return;
	}

	// validates password format
	if (!isValidPassword(newPassword)) {
		reply.code(400).send({ error: "Password too weak. Must be 8+ chars, include upper and lower case, number, special char." });
		return;
	}

	const db = app.betterSqlite3;
	// looks up user
	const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as User | undefined;
	if (!user) {
		reply.code(404).send({ error: "Email not found." });
		return;
	}

	// rejects Google users from changing password.
	if (user.password === 'Google#1A') {
		reply.code(400).send({ error: "Password change not allowed for Google Sign-In accounts." });
		return;
	}

	// decrypts TOTP secret and validates TOTP
	let decryptedTotp: string;
	try {
		decryptedTotp = decrypt(user.totp_secret);
	} catch (err) {
		reply.code(500).send({ error: "Failed to decrypt TOTP secret." });
		return;
	}
	const totpValid = authenticator.check(totp, decryptedTotp);
	if (!totpValid) {
		reply.code(401).send({ error: "TOTP code does not match." });
		return;
	}

	// Hashes new password and updates user record
	try {
		const hashedPassword = await bcrypt.hash(newPassword, 10);
		db.prepare(`UPDATE users SET password = ? WHERE email = ?`).run(hashedPassword, email);
		reply.code(200).send({ success: true, message: "Password changed successfully." });
	} catch (err: any) {
		reply.code(500).send({ error: "Failed to update password." });
	}
});



// --- POST /google-login ---
app.post('/google-login', async (request: FastifyRequest<{ Body: { credential: string } }>, reply) => {
	const { credential } = request.body;

	try {
		// verifies token with Google.
		const googleRes = await fetch(
			`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
		);
		// const googleData = await googleRes.json();
		const googleData = await googleRes.json() as { email_verified: string, email: string, name: string };

		if (!googleData.email_verified) {
			return reply.code(401).send({ error: 'Email not verified by Google' });
		}

		// finds or create user in your users table
		const email = googleData.email;
		const displayName = googleData.name;
		let user = app.betterSqlite3.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;

		// if user doesn't exist, create it with placeholder password and empty TOTP
		if (!user) {
			const googlePlaceholderPassword = "Google#1A";
			app.betterSqlite3.prepare(
				"INSERT INTO users (email, displayName, password, totp_secret) VALUES (?, ?, ?, ?)"
			).run(email, displayName, googlePlaceholderPassword, "");
			user = app.betterSqlite3.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
		}

		// issues app JWT (expires in 1 minute), returns with user info.
		const token = app.jwt.sign({
			id: user!.id,
			email: user!.email,
			displayName: user!.displayName
		}, { expiresIn: '1m' });

		reply.send({ token, email: user!.email, displayName: user!.displayName });
	} catch (err) {
		// handles errors
		reply.code(500).send({ error: 'Google login failed.' });
	}
});


// --- GET /profile (Protected Route) ---
app.get('/profile', { preValidation: [app.authenticate] }, async (request, reply) => {
	// Extracts JWT from Authorization header
	const authHeader = request.headers['authorization'] || request.headers['Authorization'];
	let jwt = '';
	if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
		jwt = authHeader.substring(7);
	}
	reply.send({
		// returns
		jwt,                 // the raw JWT
		json: request.user,  // the decoded JWT payload
		status: 'ok'
	});
});


// health check
app.get('/', (request, reply) => {
	reply.send("Hello from auth service");
});


// on startup creates users table if not exists, log errors and aborts on failure
// and listens on 0.0.0.0:8043
app.listen({host: "0.0.0.0", port: 8043 }, (err, address) => {
	const db = app.betterSqlite3;
	db.prepare(`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			email TEXT NOT NULL UNIQUE,
			displayName TEXT NOT NULL,
			password TEXT NOT NULL,
			totp_secret TEXT
			)`).run();

	if (err) {
		app.log.error(err);
		process.exit(1);
	}
});
