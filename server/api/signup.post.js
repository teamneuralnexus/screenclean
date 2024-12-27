import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";

export default eventHandler(async (event) => {
	const body = await readBody(event);
	const username = body.username;
	if (
		typeof username !== "string"
	) {
		throw createError({
			message: "Invalid username or password",
			statusMessage: "Invalid username or password",
			statusCode: 400
		});
	}
	const password = body.password;
	if (typeof password !== "string" || password.length < 6 || password.length > 255) {
		throw createError({
			message: "Invalid password length",
			statusMessage: "Password length should be greater than 6 and less than 255 charachters",
			statusCode: 400
		});
	}

	const passwordHash = await hash(password, {
		// recommended minimum parameters
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
	const userId = generateIdFromEntropySize(10); // 16 characters long

	// TODO: check if username is already used
    try {
        await pool.query("INSERT INTO auth_user(id, username, password_hash, name) VALUES($1, $2, $3, $4)", [userId, username, passwordHash, body.name])
    } catch (error) {
		throw createError({
			statusMessage: "Internal Server Error Occurred",
			statusCode: 500
		});
    }

	const session = await lucia.createSession(userId, {});
	appendHeader(event, "Set-Cookie", lucia.createSessionCookie(session.id).serialize());
});