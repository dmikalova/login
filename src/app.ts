// Hono application setup
import { Hono } from "hono";
import { domainMiddleware } from "./middleware.ts";
import { routes } from "./routes.ts";

export const app = new Hono();

// Health check endpoint (no domain validation required)
app.get("/health", (c) => c.text("OK"));

// Apply domain middleware to all other routes
app.use("*", domainMiddleware);

// Mount routes
app.route("/", routes);
