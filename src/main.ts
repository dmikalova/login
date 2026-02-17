// Main entry point for login service
import { app } from "./app.ts";

const port = parseInt(Deno.env.get("PORT") || "8080");

console.log(`Starting login service on port ${port}`);

Deno.serve({ port }, app.fetch);
