// Database connection for login service
//
// Uses postgres.js for PostgreSQL connections to Supabase.

import postgres from "postgres";

let sql: postgres.Sql | null = null;

/**
 * Get database connection pool.
 * Creates connection on first call, reuses on subsequent calls.
 */
export function getConnection(): postgres.Sql {
  if (sql) {
    return sql;
  }

  const url = Deno.env.get("DATABASE_URL_TRANSACTION");
  if (!url) {
    throw new Error("DATABASE_URL_TRANSACTION environment variable is required");
  }

  const schema = Deno.env.get("DATABASE_SCHEMA") || "login";

  sql = postgres(url, {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
    ssl: "require",
    onnotice: () => {},
    transform: {
      undefined: null,
    },
    connection: {
      search_path: `${schema}, public`,
    },
  });

  return sql;
}

/**
 * Close database connection pool.
 */
export async function closeConnection(): Promise<void> {
  if (sql) {
    await sql.end();
    sql = null;
  }
}
