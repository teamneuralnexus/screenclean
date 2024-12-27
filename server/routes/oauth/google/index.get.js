import { generateState, generateCodeVerifier  } from "arctic";

export default defineEventHandler(async (event) => {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const scopes = ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"]
    const url = google.createAuthorizationURL(state, codeVerifier, scopes);
    setCookie(event, "google_oauth_state", state, {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 60 * 10,
        sameSite: "lax"
    });
	setCookie(event, "google_code_verifier", codeVerifier, {
		path: "/",
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		maxAge: 60 * 10, // 10 minutes
		sameSite: "lax"
	});
    const redirectUri = url.toString() + "&prompt=select_account"
    return sendRedirect(event, redirectUri);
});