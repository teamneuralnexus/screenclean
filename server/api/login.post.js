import { verify } from "@node-rs/argon2";

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

    const query = await pool.query("SELECT * from auth_user where username=$1", [username.toLowerCase()])
	const existingUser = query.rows[0]
	if (!existingUser) {
		throw createError({
			message: "Invalid username or password",
			statusMessage: "Invalid username or password",
			statusCode: 400
		});
	}
	const validPassword = await verify(existingUser.password_hash, password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
	if (!validPassword) {
		throw createError({
			message: "Invalid username or password",
			statusMessage: "Invalid username or password",
			statusCode: 400
		});
	}

	const session = await lucia.createSession(existingUser.id, {});
	appendHeader(event, "Set-Cookie", lucia.createSessionCookie(session.id).serialize());
});