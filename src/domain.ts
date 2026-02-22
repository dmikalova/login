// Domain configuration and utilities
//
// Manages supported domain families and domain-related operations.

/**
 * Supported domain families. Each family shares authentication cookies.
 */
export const SUPPORTED_DOMAINS = [
  "cddc39.tech",
  "dmikalova.dev",
  "keyforge.cards",
  "mklv.tech",
] as const;

export type SupportedDomain = (typeof SUPPORTED_DOMAINS)[number];

/**
 * Extract the root domain from a hostname.
 * e.g., "login.mklv.tech" -> "mklv.tech"
 */
export function getRootDomain(hostname: string): string {
  const parts = hostname.split(".");
  if (parts.length >= 2) {
    return parts.slice(-2).join(".");
  }
  return hostname;
}

/**
 * Check if a hostname belongs to a supported domain family.
 */
export function isSupportedDomain(hostname: string): hostname is string {
  const rootDomain = getRootDomain(hostname);
  return SUPPORTED_DOMAINS.includes(rootDomain as SupportedDomain);
}

/**
 * Get the cookie domain for a given hostname.
 * Returns the root domain prefixed with "." to enable subdomain sharing.
 * e.g., "login.mklv.tech" -> ".mklv.tech"
 */
export function getCookieDomain(hostname: string): string {
  return "." + getRootDomain(hostname);
}

/**
 * Extract domain from Host header and validate it.
 * Returns null if the domain is not supported.
 * In development (localhost), defaults to mklv.tech for testing.
 */
export function parseDomainFromHost(
  host: string | null,
): SupportedDomain | null {
  if (!host) return null;

  // Remove port if present
  const hostname = host.split(":")[0];

  // Allow localhost for local development - treat as mklv.tech
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "mklv.tech";
  }

  const rootDomain = getRootDomain(hostname);

  if (SUPPORTED_DOMAINS.includes(rootDomain as SupportedDomain)) {
    return rootDomain as SupportedDomain;
  }

  return null;
}
