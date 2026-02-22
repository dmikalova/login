// Domain login tracking
//
// Records which domains each user has logged into for audit and analytics.

import { SupportedDomain } from "../domain.ts";
import { getConnection } from "./connection.ts";

/**
 * Record or update a user's login for a specific domain.
 *
 * Uses upsert to:
 * - Insert new record if user hasn't logged into this domain before
 * - Update last_login_at if they have
 *
 * @param userId - Supabase auth user ID (UUID)
 * @param domain - The root domain the user logged into
 */
export async function upsertDomainLogin(
  userId: string,
  domain: SupportedDomain,
): Promise<void> {
  const sql = getConnection();

  await sql`
    INSERT INTO domain_logins (user_id, domain, last_login_at)
    VALUES (${userId}, ${domain}, NOW())
    ON CONFLICT (user_id, domain)
    DO UPDATE SET
      last_login_at = NOW(),
      login_count = domain_logins.login_count + 1
  `;
}

/**
 * Get all domains a user has logged into.
 *
 * @param userId - Supabase auth user ID
 * @returns List of domains with login timestamps
 */
export async function getDomainLogins(userId: string): Promise<
  Array<{
    domain: SupportedDomain;
    first_login_at: Date;
    last_login_at: Date;
    login_count: number;
  }>
> {
  const sql = getConnection();

  const rows = await sql`
    SELECT domain, first_login_at, last_login_at, login_count
    FROM domain_logins
    WHERE user_id = ${userId}
    ORDER BY last_login_at DESC
  `;

  return rows as unknown as Array<{
    domain: SupportedDomain;
    first_login_at: Date;
    last_login_at: Date;
    login_count: number;
  }>;
}
