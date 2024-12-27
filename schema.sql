CREATE TABLE auth_user (
    id text NOT NULL,
    username text,
    password_hash text,
    name text NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE oauth_account (
    provider_id text NOT NULL,
    provider_user_id text NOT NULL,
    user_id text NOT NULL,
    PRIMARY KEY (provider_id, provider_user_id),
    FOREIGN KEY (user_id) REFERENCES auth_user(id)
);

CREATE TABLE user_session (
    id text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    user_id text NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES auth_user(id)
);