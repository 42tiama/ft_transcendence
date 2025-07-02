
import { fastify, FastifyRequest } from 'fastify'; // framework and request type
import { Database } from 'better-sqlite3'; // type for SQLite database
import fastifyBetterSqlite3 from '@punkish/fastify-better-sqlite3'; // fastify plugin for SQLite
import { readFileSync } from "node:fs"; // function to read files with SSL certificates
import bcrypt from 'bcrypt'; // password hashing library
import { authenticator } from 'otplib'; // for TOTP secrets & validation
import crypto from 'crypto'; // for encryption/decryption of TOTP secrets
import dotenv from 'dotenv'; // load environment variables from .env
import fastifyJwt from '@fastify/jwt'; // fastify plugin for JWT token authentication
import fetch from 'node-fetch'; // used for Google OAuth token verification

// load environment variables from .env
dotenv.config();

//capture if we're on devContainer
const SINGLE_CONTAINER = process.env.SINGLE_CONTAINER;

// read variables from env
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;
const ENCRYPTION_SALT = process.env.ENCRYPTION_SALT;
const JWT_SECRET = process.env.JWT_SECRET;
if (!ENCRYPTION_SECRET || !ENCRYPTION_SALT || !JWT_SECRET) {
	throw new Error('❌ FATAL: ENCRYPTION_SECRET, ENCRYPTION_SALT, and JWT_SECRET must be set in .env. Aborting.');
}

// use scrypt to derive a 32-byte AES key from the secret and salt
const ENCRYPTION_KEY = crypto.scryptSync(ENCRYPTION_SECRET, ENCRYPTION_SALT, 32);

// AES-256 encrypt a string, prepends IV as hex
function encrypt(text: string): string {
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
	const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
	return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// decode IV and ciphertext, returns decrypted string
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


// add betterSqlite3 (DB) and authenticate (JWT middleware) to Fastify
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
	twofa_enabled?: boolean;
}

// requestBody interfaces: types for /login
interface LoginRequestBody {
	email: string;
	password: string;
	totp: string;
}

// requestBody interfaces: types for /changepass
interface ChangePassRequestBody {
	email: string;
	currentPassword: string;
	totp?: string;
	newPassword?: string;
}

// user interface: DB user row type.
interface User {
	id: number;
	email: string;
	displayName: string;
	password: string;
	totp_secret: string;
	twofa_enabled: number;
}

// email validation
function isValidEmail(email: string): boolean {
	const emailRegex = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+\.[a-z]{2,}$/;
	if (!email || email.length > 320) return false;
	const [local, domain] = email.split('@');
	if (!local || !domain || local.length > 64 || domain.length > 255) return false;
	return emailRegex.test(email);
}

// password validation
function isValidPassword(password: string): boolean {
	return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
}

// display name validation (max 20 chars, not empty)
function isValidDisplayName(displayName: string): boolean {
	return typeof displayName === 'string' && displayName.trim().length > 0 && displayName.trim().length <= 20;
}

// read the SSL/TLS certificate and private key
const httpsOptions = {
	key: readFileSync("certs/auth/key.pem"),
	cert: readFileSync("certs/auth/cert.pem")
};

// create a new Fastify server instance with logging and HTTPS enabled
const app = fastify({
	logger: true,
	https: httpsOptions
});

// if in devContainer, create database in relative path
if (SINGLE_CONTAINER === 'true'){
	app.register(fastifyBetterSqlite3, {
		"pathToDb": './data/users.db',
		"verbose": console.log
	});
} else {
// register SQLite plugin with DB file /data/users.db.
	app.register(fastifyBetterSqlite3, {
		"pathToDb": '/data/users.db',
		"verbose": console.log
	});
}

// register JWT plugin with secret
app.register(fastifyJwt, {
	secret: JWT_SECRET,
});

// add authenticate decorator: Middleware for protected endpoints using JWT.
app.decorate("authenticate", async function(request: FastifyRequest, reply: any) {
	try {
		await request.jwtVerify();
	} catch (err) {
		reply.code(401).send({ error: 'Unauthorized' });
	}
});

// easter egg for Thais
const message: string = "Vai Corinthians!";
console.log(message);


// --- POST /register ---
app.post('/register', async (request: FastifyRequest<{ Body: UserRequestBody }>, reply) => {
	const { email, displayName, password, twofa_enabled } = request.body;

	// validate email
	if (!isValidEmail(email)) {
		reply.code(400).send({ error: "Invalid email format." });
		return;
	}

	// validate display name
	if (!isValidDisplayName(displayName)) {
		reply.code(400).send({ error: "Display Name must be 1 to 20 characters." });
		return;
	}

	// validate password
	if (!isValidPassword(password)) {
		reply.code(400).send({ error: "Password too weak. Must be 8+ chars, include upper and lower case, number, special char." });
		return;
	}

	const db = app.betterSqlite3;
	try {

		// check for duplicate displayName before insert
		const existingDisplayName = db.prepare('SELECT 1 FROM users WHERE displayName = ?').get(displayName);
		if (existingDisplayName) {
			reply.code(400).send({ error: "This display name is already taken. Please choose another display name." });
			return;
		}

		// hash the password with bcrypt
		const hashedPassword = await bcrypt.hash(password, 10);

		// determine if 2FA is enabled (default: true = enable; false = disable)
		const use2fa = twofa_enabled !== false;

		// generate and encrypt TOTP secret for 2FA
		let totpSecret = "";
		let encryptedTotp = "";

		if (use2fa) {
			totpSecret = authenticator.generateSecret();
			encryptedTotp = encrypt(totpSecret);
		}

		// insert user into DB
		const stmt = db.prepare(
			`INSERT INTO users (email, displayName, password, totp_secret, twofa_enabled) VALUES (?, ?, ?, ?, ?)`
		);
		const result = stmt.run(email, displayName, hashedPassword, encryptedTotp, use2fa ? 1 : 0);

		//if insertion was OK, send POST to game-service and profile so that they can add to their own database
		if (result.changes === 1){
			const profilePayload = {
				id: result.lastInsertRowid,
				displayName: displayName,
			}

			fetch('https://game-service:8045/register-from-auth', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(profilePayload)
			})
			.then((gameServiceResponse) => {
				if (!gameServiceResponse.ok) {
					app.log.warn(`Game-service failed for user ID ${profilePayload.id}`);
				} else {
					app.log.info(`Game-service registered user ID ${profilePayload.id}`);
				}
			})
			.catch((err) => {
				app.log.error('Could not reach game-service:', err);
			})

			//Insert user into profile-service DB
			try {
				const profileResponse = await fetch('https://profile:8046/profile-register', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(profilePayload)
				});

				if (!profileResponse.ok) {
					app.log.warn(`Profile service failed for user ID ${profilePayload.id}`);
				}
				else {
					app.log.info(`Profile service registered user ID ${profilePayload.id}`)
				}
			} catch (err) {
				app.log.error('Could not reach profile service:', err);
			}
		}

		// only return totpSecret if 2FA is enabled
		const response: any = { id: result.lastInsertRowid, email, displayName };
		if (use2fa) response.totpSecret = totpSecret;
		reply.code(201).send(response);

	} catch (err: any) {
		// handle errors
		let message = err.message;
		if (message && message.includes('UNIQUE constraint failed: users.email')) {
			message = 'This email is already registered. Please use another email.';
		}
		// handle duplicate displayName error message
		else if (message && message.includes('UNIQUE constraint failed: users.displayName')) {
			message = 'This display name is already taken. Please choose another display name.';
		}
		reply.code(400).send({ error: message });
	}
});


// --- POST /login ---
app.post('/login', async (request: FastifyRequest<{ Body: LoginRequestBody }>, reply) => {
	const { email, password, totp } = request.body;

	// validate email format
	if (!isValidEmail(email)) {
		reply.code(400).send({ error: "Invalid email format." });
		return;
	}

	// validate password format
	if (!password) {
		reply.code(400).send({ error: "Password is required." });
		return;
	}

	const db = app.betterSqlite3;
	try {
		// look up user by email
		const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as User & { twofa_enabled?: number } | undefined;

		if (!user) {
			reply.code(401).send({ error: "Email not found." });
			return;
		}

		// reject Google users (with placeholder password) from using password login.
		if (user.password === 'Google#1A') {
			reply.code(400).send({ error: "Please use Google Sign-In for this account." });
			return;
		}

		// verify password with bcrypt.
		const passwordMatch = await bcrypt.compare(password, user.password);
		if (!passwordMatch) {
			reply.code(401).send({ error: "Password does not match." });
			return;
		}

		// if user has 2FA enabled, require TOTP and validate it
		if (user.twofa_enabled) {
			if (!totp) {
				reply.code(400).send({ error: "TOTP code is required." });
				return;
			}
			// decrypt TOTP secret and checks TOTP code.
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
		} else {
			// if the user tries to supply a TOTP code anyway, that's an error!
			if (typeof totp === "string" && totp.trim() !== "") {
				reply.code(400).send({ error: "2FA is not enabled for this account." });
				return;
			}
		}

		// on success: issues a JWT (expires in 12 hours) and returns user info
		const token = app.jwt.sign({
			id: user.id,
			email: user.email,
			displayName: user.displayName
		}, { expiresIn: '12h' });

		reply.code(200).send({
			success: true,
			id: user.id,
			email: user.email,
			displayName: user.displayName,
			token
		});
	} catch (err: any) {
		reply.code(500).send({ error: err.message });
	}
});


// --- POST /changepass ---
app.post('/changepass', async (request: FastifyRequest<{ Body: ChangePassRequestBody }>, reply) => {
	const { email, currentPassword, totp, newPassword } = request.body;

	// validate inputs
	if (!email || !currentPassword || !newPassword) {
		reply.code(400).send({ error: "Missing required fields: email, current password, and at least one of new password or new display name." });
		return;
	}

	// validate email format
	if (!isValidEmail(email)) {
		reply.code(400).send({ error: "Invalid email format." });
		return;
	}

	// validate password format
	if (newPassword && !isValidPassword(newPassword)) {
		reply.code(400).send({ error: "Password too weak. Must be 8+ chars, include upper and lower case, number, special char." });
		return;
	}

	const db = app.betterSqlite3;
	// look up user
	const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as User | undefined;
	if (!user) {
		reply.code(404).send({ error: "Email not found." });
		return;
	}

	// reject Google users from changing password or displayName
	if (user.password === 'Google#1A') {
		reply.code(400).send({ error: "Change not allowed for Google Sign-In accounts." });
		return;
	}

	// validate current password
	const passwordMatch = await bcrypt.compare(currentPassword, user.password);
	if (!passwordMatch) {
		reply.code(401).send({ error: "Current password does not match." });
		return;
	}

	// if user has 2FA enabled, require TOTP
	if (user.twofa_enabled) {
		if (!totp) {
			reply.code(400).send({ error: "TOTP code is required." });
			return;
		}
		// decrypt TOTP secret and validates TOTP
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
	} else {
		// if user does NOT have 2FA enabled, TOTP code must NOT be supplied
		if (typeof totp === "string" && totp.trim() !== "") {
			reply.code(400).send({ error: "2FA is not enabled for this account." });
			return;
		}
	}

	// build update statement
	const updates: string[] = [];
	const params: any[] = [];
	if (newPassword) {
		const hashedPassword = await bcrypt.hash(newPassword, 10);
		updates.push("password = ?");
		params.push(hashedPassword);
	}
	params.push(email);

	if (updates.length === 0) {
		reply.code(400).send({ error: "No fields to update." });
		return;
	}

	// hash new password and update user record
	try {
		db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE email = ?`).run(...params);

		reply.code(200).send({
			success: true,
			message: "Change successful.",
		});
	} catch (err: any) {
		let message = err.message;
		if (message && message.includes('UNIQUE constraint failed: users.displayName')) {
			message = 'This display name is already taken. Please choose another display name.';
		}
		reply.code(500).send({ error: message || "Failed to update user." });
	}
});


// --- POST /google-login ---
app.post('/google-login', async (request: FastifyRequest<{ Body: { credential: string } }>, reply) => {
	const { credential } = request.body;

	try {
		// verify token with Google.
		const googleRes = await fetch(
			`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
		);
		const googleData = await googleRes.json() as { email_verified: string, email: string, name: string };

		if (!googleData.email_verified) {
			return reply.code(401).send({ error: 'Email not verified by Google' });
		}

		// find or create user in your users table
		const email = googleData.email;
		const displayName = googleData.name;
		let user = app.betterSqlite3.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;

		// if user doesn't exist, create it with placeholder password and empty TOTP
		if (!user) {
			const googlePlaceholderPassword = "Google#1A";
			const result = app.betterSqlite3.prepare(
				"INSERT INTO users (email, displayName, password, totp_secret) VALUES (?, ?, ?, ?)"
			).run(email, displayName, googlePlaceholderPassword, "");

			//sync user with game-service players table
			if (result.changes === 1){
				const profilePayload = {
					id: result.lastInsertRowid,
					displayName: displayName,
				}

				fetch('https://game-service:8045/register-from-auth', {
					method: 'POST',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(profilePayload)
				})
				.then((gameServiceResponse) => {
					if (!gameServiceResponse.ok) {
						app.log.warn(`Game-service failed for user ID ${profilePayload.id}`);
					} else {
						app.log.info(`Game-service registered user ID ${profilePayload.id}`);
					}
				})
				.catch((err) => {
					app.log.error('Could not reach game-service:', err);
				})

				//sync user with profile-service users table
				try {
					const profileResponse = await fetch('https://profile:8046/profile-register', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(profilePayload)
					});

					if (!profileResponse.ok) {
						app.log.warn(`Profile service failed for user ID ${profilePayload.id}`);
					}
					else {
						app.log.info(`Profile service registered user ID ${profilePayload.id}`)
					}
				} catch (err) {
					app.log.error('Could not reach profile service:', err);
				}
			}

			// fetch the newly inserted user
			user = app.betterSqlite3.prepare('SELECT * FROM users WHERE email = ?').get(email) as User;
		}

		// issue app JWT (expires in 10 hours), returns with user info.
		const token = app.jwt.sign({
			id: user!.id,
			email: user!.email,
			displayName: user!.displayName
		}, { expiresIn: '10h' });

		reply.send({ token, id: user!.id, email: user!.email, displayName: user!.displayName });
	} catch (err) {
		// handle errors
		reply.code(500).send({ error: 'Google login failed.' });
	}
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
			displayName TEXT NOT NULL UNIQUE,
			password TEXT NOT NULL,
			totp_secret TEXT,
			twofa_enabled INTEGER DEFAULT 1
			)`).run();

	if (err) {
		app.log.error(err);
		process.exit(1);
	}
});

