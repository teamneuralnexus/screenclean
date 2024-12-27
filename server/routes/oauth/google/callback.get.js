import { OAuth2RequestError  } from "arctic";
import { generateIdFromEntropySize } from "lucia";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const code = query.code?.toString() ?? null;
    const state = query.state?.toString() ?? null;
    const storedState = getCookie(event, "google_oauth_state") ?? null;
    const codeVerifier  = getCookie(event, "google_code_verifier") ?? null;
    if (!code || !state || !codeVerifier || !storedState || state !== storedState) {
        throw createError({
            status: 400
        });
    }

    try {
        const tokens = await google.validateAuthorizationCode(code, codeVerifier);
        const googleUserData = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: {
                Authorization: `Bearer ${tokens.accessToken()}`
            }
        });
        const googleUser = await googleUserData.json();
        const username = googleUser.email
        const name = googleUser.name
        const existingUser = await pool.query("SELECT u.id FROM auth_user u LEFT JOIN oauth_account oa ON u.id = oa.user_id WHERE u.username = $1 AND (oa.provider_id = $2 AND oa.provider_user_id = $3);", [username, "Google", googleUser.id])
        if(existingUser.rows.length !==0) {
            const session = await lucia.createSession(existingUser.rows[0].id, {});
            appendHeader(event, "Set-Cookie", lucia.createSessionCookie(session.id).serialize());
            return sendRedirect(event, "/dashboard");
        }
        const normalUser = await pool.query("SELECT u.id from auth_user u where u.username=$1", [username])
        if(normalUser.rows.length !==0){
            console.log(normalUser)
            await pool.query("INSERT INTO oauth_account(provider_id, provider_user_id, user_id) VALUES($1, $2, $3)", ["Google", googleUser.id, normalUser.rows[0].id])
            const session = await lucia.createSession(normalUser.rows[0].id, {});
            appendHeader(event, "Set-Cookie", lucia.createSessionCookie(session.id).serialize());
            return sendRedirect(event, "/dashboard");

        }
        else {
            const userId = generateIdFromEntropySize(10); // 16 characters long
            await pool.query("INSERT INTO auth_user(id, username, name) VALUES($1, $2, $3)", [userId, username, name])
            await pool.query("INSERT INTO oauth_account(provider_id, provider_user_id, user_id) VALUES($1, $2, $3)", ["Google", googleUser.id, userId])
    
            const session = await lucia.createSession(userId, {});
            appendHeader(event, "Set-Cookie", lucia.createSessionCookie(session.id).serialize());
            return sendRedirect(event, "/dashboard");
        }

    } catch (e) {
        console.log(e)
        // the specific error message depends on the provider
        if (e instanceof OAuth2RequestError) {
            // invalid code
            throw createError({
                status: 400
            });
        }
        throw createError({
            status: 500
        });
    }
});