// Load secrets from JSON file mounted by Secret Manager volume.
// Must be imported before any other modules that read Deno.env.

const SECRETS_PATH = "/secrets/config.json";

try {
  const json = Deno.readTextFileSync(SECRETS_PATH);
  const secrets: Record<string, string> = JSON.parse(json);
  for (const [key, value] of Object.entries(secrets)) {
    if (!Deno.env.has(key)) {
      Deno.env.set(key, value);
    }
  }
} catch (error) {
  if (!(error instanceof Deno.errors.NotFound)) {
    throw error;
  }
}
