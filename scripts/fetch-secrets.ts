#!/usr/bin/env -S deno run --allow-run --allow-env

/**
 * Fetch secrets from Google Secret Manager and export as environment variables
 *
 * Usage (run script directly to avoid deno task stdout noise):
 *   eval $(deno run --allow-run --allow-env scripts/fetch-secrets.ts) && deno task dev
 *
 * Prerequisites:
 *   - gcloud CLI installed and authenticated
 *   - gcloud auth application-default login
 */

const PROJECT_ID = "mklv-infrastructure";

// Map of environment variable names to Secret Manager secret names
const SECRETS: Record<string, string> = {
  SUPABASE_URL: "supabase-mklv-url",
  SUPABASE_PUBLISHABLE_KEY: "supabase-mklv-publishable-key",
  GOOGLE_CLIENT_ID: "login-google-client-id",
  // DATABASE_URL: "login-database-url", // Uncomment if you need local DB access
};

async function getSecret(secretName: string): Promise<string | null> {
  const cmd = new Deno.Command("gcloud", {
    args: [
      "secrets",
      "versions",
      "access",
      "latest",
      `--secret=${secretName}`,
      `--project=${PROJECT_ID}`,
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const { success, stdout, stderr } = await cmd.output();

  if (!success) {
    const error = new TextDecoder().decode(stderr);
    if (error.includes("NOT_FOUND")) {
      console.error(`# Warning: Secret ${secretName} not found`);
    } else {
      console.error(`# Error fetching ${secretName}: ${error.trim()}`);
    }
    return null;
  }

  return new TextDecoder().decode(stdout).trim();
}

async function main() {
  // Check gcloud is available
  const checkCmd = new Deno.Command("gcloud", {
    args: ["--version"],
    stdout: "null",
    stderr: "null",
  });

  const { success } = await checkCmd.output();
  if (!success) {
    console.error(
      "# Error: gcloud CLI not found. Install from https://cloud.google.com/sdk",
    );
    Deno.exit(1);
  }

  // Fetch all secrets and output as export statements
  // Meta info goes to stderr so eval only gets exports
  console.error("# Secrets from Google Secret Manager");
  console.error(`# Project: ${PROJECT_ID}`);

  for (const [envVar, secretName] of Object.entries(SECRETS)) {
    const value = await getSecret(secretName);
    if (value) {
      // Escape single quotes in value for shell safety
      const escaped = value.replace(/'/g, "'\"'\"'");
      console.log(`export ${envVar}='${escaped}'`);
    }
  }
}

main();
