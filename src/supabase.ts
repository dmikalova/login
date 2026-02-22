// Supabase client configuration
//
// Initializes the Supabase client using environment variables.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

/**
 * Get the Supabase client instance.
 * Lazily initializes on first call.
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing required environment variables: SUPABASE_URL and/or SUPABASE_PUBLISHABLE_KEY",
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // Server-side, we manage sessions via cookies
    },
  });

  return supabaseClient;
}

/**
 * Get the Supabase project URL from environment.
 */
export function getSupabaseUrl(): string {
  const url = Deno.env.get("SUPABASE_URL");
  if (!url) {
    throw new Error("Missing required environment variable: SUPABASE_URL");
  }
  return url;
}
