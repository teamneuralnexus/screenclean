import { generateState } from "arctic";

export default defineEventHandler(async (event) => {
    const state = generateState();
    const scopes = ["user"]
    const url = github.createAuthorizationURL(state, scopes);

    setCookie(event, "github_oauth_state", state, {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 60 * 10,
        sameSite: "lax"
    });
    const redirectUri = url.toString() + "?prompt=select_account"
    return sendRedirect(event, redirectUri);
});