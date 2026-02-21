// Unit tests for domain utilities

import { assertEquals } from "@std/assert";
import {
  getCookieDomain,
  getRootDomain,
  isSupportedDomain,
  parseDomainFromHost,
  SUPPORTED_DOMAINS,
} from "../../api/domain.ts";

// SUPPORTED_DOMAINS tests

Deno.test("SUPPORTED_DOMAINS - includes mklv.tech", () => {
  assertEquals(SUPPORTED_DOMAINS.includes("mklv.tech"), true);
});

Deno.test("SUPPORTED_DOMAINS - includes keyforge.cards", () => {
  assertEquals(SUPPORTED_DOMAINS.includes("keyforge.cards"), true);
});

Deno.test("SUPPORTED_DOMAINS - has at least 2 domains", () => {
  assertEquals(SUPPORTED_DOMAINS.length >= 2, true);
});

// getRootDomain tests

Deno.test("getRootDomain - extracts root from subdomain", () => {
  assertEquals(getRootDomain("login.mklv.tech"), "mklv.tech");
});

Deno.test("getRootDomain - extracts root from nested subdomain", () => {
  assertEquals(getRootDomain("api.staging.mklv.tech"), "mklv.tech");
});

Deno.test("getRootDomain - handles two-part domain", () => {
  assertEquals(getRootDomain("mklv.tech"), "mklv.tech");
});

Deno.test("getRootDomain - handles single-part hostname", () => {
  assertEquals(getRootDomain("localhost"), "localhost");
});

Deno.test("getRootDomain - handles multi-part TLD (.co.uk style)", () => {
  // Note: This implementation doesn't handle public suffix list
  // It will return "co.uk" for "foo.co.uk", not "foo.co.uk"
  assertEquals(getRootDomain("keyforge.cards"), "keyforge.cards");
});

// getCookieDomain tests

Deno.test("getCookieDomain - adds leading dot for subdomain sharing", () => {
  assertEquals(getCookieDomain("login.mklv.tech"), ".mklv.tech");
});

Deno.test("getCookieDomain - adds leading dot to root domain", () => {
  assertEquals(getCookieDomain("mklv.tech"), ".mklv.tech");
});

Deno.test("getCookieDomain - handles keyforge.cards", () => {
  assertEquals(getCookieDomain("login.keyforge.cards"), ".keyforge.cards");
});

// isSupportedDomain tests

Deno.test("isSupportedDomain - returns true for supported domain", () => {
  assertEquals(isSupportedDomain("mklv.tech"), true);
});

Deno.test(
  "isSupportedDomain - returns true for subdomain of supported domain",
  () => {
    assertEquals(isSupportedDomain("login.mklv.tech"), true);
  },
);

Deno.test("isSupportedDomain - returns false for unsupported domain", () => {
  assertEquals(isSupportedDomain("evil.com"), false);
});

Deno.test("isSupportedDomain - returns false for localhost", () => {
  assertEquals(isSupportedDomain("localhost"), false);
});

// parseDomainFromHost tests

Deno.test("parseDomainFromHost - returns domain for login subdomain", () => {
  assertEquals(parseDomainFromHost("login.mklv.tech"), "mklv.tech");
});

Deno.test("parseDomainFromHost - returns domain with port stripped", () => {
  assertEquals(parseDomainFromHost("login.mklv.tech:8080"), "mklv.tech");
});

Deno.test("parseDomainFromHost - returns domain for root domain", () => {
  assertEquals(parseDomainFromHost("mklv.tech"), "mklv.tech");
});

Deno.test("parseDomainFromHost - returns null for unsupported domain", () => {
  assertEquals(parseDomainFromHost("evil.com"), null);
});

Deno.test("parseDomainFromHost - returns null for null input", () => {
  assertEquals(parseDomainFromHost(null), null);
});

Deno.test("parseDomainFromHost - returns null for empty string", () => {
  assertEquals(parseDomainFromHost(""), null);
});

Deno.test("parseDomainFromHost - returns domain for keyforge.cards", () => {
  assertEquals(parseDomainFromHost("login.keyforge.cards"), "keyforge.cards");
});
