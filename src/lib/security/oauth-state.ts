/**
 * Shared constants for the Google OAuth (Gmail 2FA) handshake.
 *
 * Route files may only export HTTP handlers, so the cookie name lives here.
 *
 * @module lib/security/oauth-state
 */

/** Short-lived HttpOnly cookie that binds the OAuth `state` nonce to the browser that started the flow. */
export const OAUTH_STATE_COOKIE = "ireside_oauth_state";
export const OAUTH_STATE_COOKIE_PATH = "/api/landlord/2fa";
export const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;
