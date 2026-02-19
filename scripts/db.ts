#!/usr/bin/env -S deno run --allow-run --allow-env

/**
 * Database schema management using Atlas
 *
 * Usage:
 *   deno task db:apply  # Apply schema changes
 *   deno task db:diff   # Show planned changes
 *
 * Automatically fetches DATABASE_URL from Google Secret Manager.
 *
 * Prerequisites:
 *   - Atlas CLI installed (brew install ariga/tap/atlas)
 *   - gcloud CLI installed and authenticated
 *   - Docker running (for Atlas dev container)
 */

const PROJECT_ID = "mklv-infrastructure";
const SECRET_NAME = "login-database-url";
const SCHEMA_NAME = "login";

async function getDatabaseUrl(): Promise<string> {
  // Check for override from environment
  const envUrl = Deno.env.get("DATABASE_URL");
  if (envUrl) {
    console.error("Using DATABASE_URL from environment");
    return envUrl;
  }

  console.error("Fetching DATABASE_URL from Secret Manager...");
  const cmd = new Deno.Command("gcloud", {
    args: [
      "secrets",
      "versions",
      "access",
      "latest",
      `--secret=${SECRET_NAME}`,
      `--project=${PROJECT_ID}`,
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const { success, stdout, stderr } = await cmd.output();

  if (!success) {
    const error = new TextDecoder().decode(stderr);
    console.error(`Error fetching secret: ${error.trim()}`);
    Deno.exit(1);
  }

  return new TextDecoder().decode(stdout).trim();
}

async function runAtlas(
  command: "apply" | "diff",
  databaseUrl: string,
): Promise<void> {
  const baseArgs = command === "apply"
    ? ["schema", "apply", "--url", databaseUrl]
    : ["schema", "diff", "--from", databaseUrl];

  const args = [
    ...baseArgs,
    "--to",
    "file://db/schema.hcl",
    "--dev-url",
    "docker://postgres/15/dev?search_path=public",
    "--schema",
    SCHEMA_NAME,
  ];

  console.error(`Running: atlas ${args.join(" ").replace(databaseUrl, "***")}`);

  const cmd = new Deno.Command("atlas", {
    args,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  const { code } = await cmd.spawn().status;
  Deno.exit(code);
}

// Main
const command = Deno.args[0];
if (command !== "apply" && command !== "diff") {
  console.error("Usage: db.ts <apply|diff>");
  console.error("  apply - Apply schema changes to database");
  console.error("  diff  - Show planned schema changes");
  Deno.exit(1);
}

const databaseUrl = await getDatabaseUrl();
await runAtlas(command, databaseUrl);
