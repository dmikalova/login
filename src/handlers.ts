// Login route handlers
import { Context } from "hono";
import {
  clearSessionCookie,
  getSessionCookie,
  setSessionCookie,
} from "./cookie.ts";
import { upsertDomainLogin } from "./db/index.ts";
import { SupportedDomain, getRootDomain } from "./domain.ts";
import { getSupabaseUrl } from "./supabase.ts";
import { renderTemplate, escapeHtml, jsValue } from "./templates.ts";

/**
 * Validate a return URL to prevent open redirects.
 * Only allows URLs within the same domain family.
 */
export function isValidReturnUrl(
  returnUrl: string,
  domain: SupportedDomain,
): boolean {
  // Reject javascript: and data: URLs
  const lowerUrl = returnUrl.toLowerCase();
  if (lowerUrl.startsWith("javascript:") || lowerUrl.startsWith("data:")) {
    return false;
  }

  // Allow relative URLs
  if (returnUrl.startsWith("/")) {
    return true;
  }

  // Parse and validate absolute URLs
  try {
    const url = new URL(returnUrl);
    const urlDomain = getRootDomain(url.hostname);
    return urlDomain === domain;
  } catch {
    return false;
  }
}

/**
 * Decode JWT payload without verification.
 * Used to extract user ID and check expiration after Supabase has already validated the token.
 * Exported for testing.
 */
export function decodeJwtPayload(token: string): { sub?: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Base64url decode the payload
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * GET /login - Render the login page
 */
export async function handleLogin(c: Context) {
  const domain = c.get("domain") as SupportedDomain;

  // Check if user is already logged in with a valid session
  const existingSession = getSessionCookie(c);
  if (existingSession) {
    // Validate JWT expiration before redirecting
    const payload = decodeJwtPayload(existingSession);
    const now = Math.floor(Date.now() / 1000);
    
    if (payload?.exp && payload.exp > now) {
      // Valid session, redirect to return URL or domain root
      const returnUrl = c.req.query("returnUrl");
      if (returnUrl && isValidReturnUrl(returnUrl, domain)) {
        return c.redirect(returnUrl);
      }
      return c.redirect(`https://${domain}/`);
    }
    
    // Invalid or expired session - clear the cookie
    clearSessionCookie(c);
  }

  // Get configuration from environment
  const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

  if (!googleClientId || !supabaseKey) {
    return c.text("Server configuration error", 500);
  }

  // Parse and validate returnUrl
  const returnUrl = c.req.query("returnUrl");
  const validatedReturnUrl =
    returnUrl && isValidReturnUrl(returnUrl, domain) ? returnUrl : null;

  const error = c.req.query("error");

  const html = await renderTemplate("login.html", {
    DOMAIN: domain,
    ERROR: error ? jsValue(escapeHtml(error)) : "null",
    RETURN_URL: jsValue(validatedReturnUrl),
    GOOGLE_CLIENT_ID: googleClientId,
    SUPABASE_URL: supabaseUrl,
    SUPABASE_KEY: supabaseKey,
  });

  return c.html(html);
}

/**
 * GET /callback - Handle OAuth callback and set session cookie
 */
export async function handleCallback(c: Context) {
  const domain = c.get("domain") as SupportedDomain;

  // Token can come from query param (One Tap) or from Supabase redirect
  const token = c.req.query("token");

  if (!token) {
    // Supabase OAuth redirects with tokens in the URL hash (client-side)
    // Return a page that extracts the token and calls back
    const html = await renderTemplate("callback.html", {
      SUPABASE_URL: getSupabaseUrl(),
      SUPABASE_KEY: Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "",
    });
    return c.html(html);
  }

  // Set the session cookie with the JWT
  setSessionCookie(c, token);

  // Record domain login for analytics (non-blocking)
  const payload = decodeJwtPayload(token);
  if (payload?.sub) {
    upsertDomainLogin(payload.sub, domain).catch((err) => {
      console.error("Failed to record domain login:", err);
    });
  }

  // Redirect to return URL or domain root
  const returnUrl = c.req.query("returnUrl");
  if (returnUrl && isValidReturnUrl(returnUrl, domain)) {
    return c.redirect(returnUrl);
  }

  return c.redirect(`https://${domain}/`);
}

/**
 * GET /logout - Clear session and redirect
 */
export function handleLogout(c: Context) {
  const domain = c.get("domain") as SupportedDomain;

  // Clear the session cookie
  clearSessionCookie(c);

  // Redirect to return URL or domain root
  const returnUrl = c.req.query("returnUrl");
  if (returnUrl && isValidReturnUrl(returnUrl, domain)) {
    return c.redirect(returnUrl);
  }

  return c.redirect(`https://${domain}/`);
}
// Error code to user-friendly message mapping
const ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
  auth_failed: {
    title: "Authentication Failed",
    message: "We couldn't sign you in. Please try again.",
  },
  access_denied: {
    title: "Access Denied",
    message: "You denied access to your account. Sign in is required to continue.",
  },
  cancelled: {
    title: "Sign In Cancelled",
    message: "You cancelled the sign in process.",
  },
  network_error: {
    title: "Connection Error",
    message: "We couldn't connect to the authentication service. Please check your connection and try again.",
  },
  invalid_request: {
    title: "Invalid Request",
    message: "Something went wrong with the sign in request.",
  },
  server_error: {
    title: "Server Error",
    message: "Something went wrong on our end. Please try again later.",
  },
  default: {
    title: "Sign In Error",
    message: "Something went wrong during sign in. Please try again.",
  },
};

/**
 * GET /error - Display error page with user-friendly message
 */
export async function handleError(c: Context) {
  const domain = c.get("domain") as SupportedDomain;
  const errorCode = c.req.query("code") || "default";
  const returnUrl = c.req.query("returnUrl");

  const errorInfo = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.default;
  const returnUrlParam = returnUrl && isValidReturnUrl(returnUrl, domain)
    ? `?returnUrl=${encodeURIComponent(returnUrl)}`
    : "";

  const html = await renderTemplate("error.html", {
    DOMAIN: domain,
    TITLE: errorInfo.title,
    MESSAGE: errorInfo.message,
    RETURN_URL_PARAM: returnUrlParam,
  });

  return c.html(html);
}