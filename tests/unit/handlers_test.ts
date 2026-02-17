// Unit tests for URL validation and JWT decoding

import { assertEquals } from "@std/assert";
import { decodeJwtPayload, isValidReturnUrl } from "../../src/handlers.ts";

// isValidReturnUrl tests

Deno.test("isValidReturnUrl - accepts relative URL starting with /", () => {
  assertEquals(isValidReturnUrl("/dashboard", "mklv.tech"), true);
});

Deno.test("isValidReturnUrl - accepts relative URL with path", () => {
  assertEquals(isValidReturnUrl("/app/settings", "mklv.tech"), true);
});

Deno.test("isValidReturnUrl - accepts same-domain absolute URL", () => {
  assertEquals(isValidReturnUrl("https://mklv.tech/app", "mklv.tech"), true);
});

Deno.test("isValidReturnUrl - accepts subdomain of same domain", () => {
  assertEquals(
    isValidReturnUrl("https://email.mklv.tech/inbox", "mklv.tech"),
    true,
  );
});

Deno.test("isValidReturnUrl - rejects javascript: URL", () => {
  assertEquals(isValidReturnUrl("javascript:alert(1)", "mklv.tech"), false);
});

Deno.test(
  "isValidReturnUrl - rejects JAVASCRIPT: URL (case insensitive)",
  () => {
    assertEquals(isValidReturnUrl("JAVASCRIPT:alert(1)", "mklv.tech"), false);
  },
);

Deno.test("isValidReturnUrl - rejects data: URL", () => {
  assertEquals(
    isValidReturnUrl("data:text/html,<script>alert(1)</script>", "mklv.tech"),
    false,
  );
});

Deno.test("isValidReturnUrl - rejects DATA: URL (case insensitive)", () => {
  assertEquals(isValidReturnUrl("DATA:text/html,foo", "mklv.tech"), false);
});

Deno.test("isValidReturnUrl - rejects external domain", () => {
  assertEquals(isValidReturnUrl("https://evil.com/steal", "mklv.tech"), false);
});

Deno.test("isValidReturnUrl - rejects different root domain", () => {
  assertEquals(
    isValidReturnUrl("https://keyforge.cards/app", "mklv.tech"),
    false,
  );
});

Deno.test("isValidReturnUrl - rejects malformed URL", () => {
  assertEquals(isValidReturnUrl("not-a-valid-url", "mklv.tech"), false);
});

Deno.test(
  "isValidReturnUrl - accepts keyforge.cards for keyforge.cards domain",
  () => {
    assertEquals(
      isValidReturnUrl("https://keyforge.cards/app", "keyforge.cards"),
      true,
    );
  },
);

// decodeJwtPayload tests

Deno.test("decodeJwtPayload - extracts sub from valid JWT", () => {
  // Create a minimal JWT with just the structure needed
  // Header: {"alg":"HS256","typ":"JWT"}
  // Payload: {"sub":"user-123","email":"test@example.com"}
  // Signature: dummy
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({ sub: "user-123", email: "test@example.com" }),
  );
  const token = `${header}.${payload}.dummy-signature`;

  const result = decodeJwtPayload(token);
  assertEquals(result?.sub, "user-123");
});

Deno.test("decodeJwtPayload - handles base64url encoding", () => {
  // Test with URL-safe base64 characters
  const header = btoa(JSON.stringify({ alg: "HS256" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const payload = btoa(JSON.stringify({ sub: "abc-xyz_123" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const token = `${header}.${payload}.sig`;

  const result = decodeJwtPayload(token);
  assertEquals(result?.sub, "abc-xyz_123");
});

Deno.test(
  "decodeJwtPayload - returns null for malformed token (no dots)",
  () => {
    assertEquals(decodeJwtPayload("not-a-jwt"), null);
  },
);

Deno.test(
  "decodeJwtPayload - returns null for token with wrong number of parts",
  () => {
    assertEquals(decodeJwtPayload("one.two"), null);
    assertEquals(decodeJwtPayload("one.two.three.four"), null);
  },
);

Deno.test("decodeJwtPayload - returns null for invalid base64", () => {
  assertEquals(decodeJwtPayload("x.!!!invalid!!!.z"), null);
});

Deno.test("decodeJwtPayload - returns null for non-JSON payload", () => {
  const header = btoa("{}");
  const payload = btoa("not json");
  assertEquals(decodeJwtPayload(`${header}.${payload}.sig`), null);
});

Deno.test("decodeJwtPayload - returns payload without sub", () => {
  const header = btoa(JSON.stringify({ alg: "HS256" }));
  const payload = btoa(JSON.stringify({ email: "test@example.com" }));
  const token = `${header}.${payload}.sig`;

  const result = decodeJwtPayload(token);
  assertEquals(result?.sub, undefined);
  assertEquals(result !== null, true);
});
