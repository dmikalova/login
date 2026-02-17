// Session cookie management
//
// Handles setting and clearing session cookies with proper domain scoping.

import { Context } from "hono";
import { getCookieDomain } from "./domain.ts";

const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE = 604800; // 7 days in seconds

/**
 * Set a session cookie with the JWT token.
 * Cookie is scoped to the root domain to enable cross-subdomain sharing.
 */
export function setSessionCookie(c: Context, jwt: string): void {
  const host = c.req.header("Host") || "";
  const cookieDomain = getCookieDomain(host);

  c.header(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${jwt}; Domain=${cookieDomain}; Path=/; Max-Age=${SESSION_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
  );
}

/**
 * Clear the session cookie by setting it to expire immediately.
 */
export function clearSessionCookie(c: Context): void {
  const host = c.req.header("Host") || "";
  const cookieDomain = getCookieDomain(host);

  c.header(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; Domain=${cookieDomain}; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
  );
}

/**
 * Get the session cookie value from the request.
 */
export function getSessionCookie(c: Context): string | null {
  const cookie = c.req.header("Cookie");
  if (!cookie) return null;

  const match = cookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}
