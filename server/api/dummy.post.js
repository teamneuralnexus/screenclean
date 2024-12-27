export default defineEventHandler((event) => {
	if (event.context.user) {
		const username = event.context.user.username;
	}
	else {
		throw createError({
			message: "Unauthorised Access not allowed",
			statusCode: 401
		});
    }
});

// Template api to check if the user is authenticated or not