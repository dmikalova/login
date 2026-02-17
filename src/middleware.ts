// Middleware for domain validation and request context
import { Context, Next } from "hono";
import { parseDomainFromHost, SupportedDomain } from "./domain.ts";

// Extend Hono context with domain info
declare module "hono" {
  interface ContextVariableMap {
    domain: SupportedDomain;
  }
}

/**
 * Middleware that validates the Host header and sets the domain in context.
 * Returns 400 Bad Request for unrecognized domains.
 */
export async function domainMiddleware(c: Context, next: Next) {
  const host = c.req.header("Host");
  const domain = parseDomainFromHost(host ?? null);

  if (!domain) {
    return c.text(`Unsupported domain: ${host || "unknown"}`, 400);
  }

  c.set("domain", domain);
  await next();
}
