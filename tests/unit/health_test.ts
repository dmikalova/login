// Unit tests for health endpoint

import { assertEquals } from "@std/assert";
import { app } from "../../api/app.ts";

Deno.test("GET /health - returns 200 OK", async () => {
  const res = await app.request("/health");
  assertEquals(res.status, 200);
  assertEquals(await res.text(), "OK");
});

Deno.test("GET /health - works without Host header", async () => {
  // Health check should work regardless of domain validation
  const res = await app.request("/health", {
    headers: {},
  });
  assertEquals(res.status, 200);
});
