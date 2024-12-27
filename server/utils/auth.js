import { Lucia } from "lucia";
import { webcrypto } from "node:crypto";

Object.defineProperty(globalThis, 'crypto', {
  value: webcrypto,
  writable: false,
  configurable: true,
  enumerable: true,
});
import { GitHub } from "arctic";
import { Google } from "arctic";


import { NodePostgresAdapter } from "@lucia-auth/adapter-postgresql";
import pg from "pg";
const connectionString = useRuntimeConfig().dbUri+"?sslmode=require"

export const pool = new pg.Pool({connectionString});

const adapter = new NodePostgresAdapter(pool, {
	user: "auth_user",
	session: "user_session"
});

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: !process.dev
		}
	},
    getUserAttributes: (attributes) => {
		return {
			// attributes has the type of DatabaseUserAttributes
			name: attributes.name,
			username: attributes.username
		};
	}
});

export const github = new GitHub(useRuntimeConfig().githubClientId, useRuntimeConfig().githubClientSecret, "http://localhost:3000/oauth/github/callback");
export const google = new Google(useRuntimeConfig().googleClientId, useRuntimeConfig().googleClientSecret, "http://localhost:3000/oauth/google/callback");
