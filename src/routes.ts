// Route definitions for login service
import { Hono } from "hono";
import {
  handleCallback,
  handleError,
  handleLogin,
  handleLogout,
} from "./handlers.ts";

export const routes = new Hono();

// Login page at root (login.mklv.tech/)
routes.get("/", handleLogin);

// OAuth callback
routes.get("/callback", handleCallback);

// Logout
routes.get("/logout", handleLogout);

// Error page
routes.get("/error", handleError);
