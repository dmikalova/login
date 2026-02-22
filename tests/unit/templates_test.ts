// Unit tests for template utilities

import { assertEquals } from "@std/assert";
import { escapeHtml, jsValue } from "../../src/templates.ts";

// escapeHtml tests

Deno.test("escapeHtml - escapes ampersand", () => {
  assertEquals(escapeHtml("foo & bar"), "foo &amp; bar");
});

Deno.test("escapeHtml - escapes less than", () => {
  assertEquals(escapeHtml("<script>"), "&lt;script&gt;");
});

Deno.test("escapeHtml - escapes greater than", () => {
  assertEquals(escapeHtml("a > b"), "a &gt; b");
});

Deno.test("escapeHtml - escapes double quotes", () => {
  assertEquals(escapeHtml('say "hello"'), "say &quot;hello&quot;");
});

Deno.test("escapeHtml - escapes single quotes", () => {
  assertEquals(escapeHtml("it's"), "it&#39;s");
});

Deno.test("escapeHtml - escapes multiple characters", () => {
  assertEquals(
    escapeHtml('<div class="foo">bar & baz</div>'),
    "&lt;div class=&quot;foo&quot;&gt;bar &amp; baz&lt;/div&gt;",
  );
});

Deno.test("escapeHtml - returns plain text unchanged", () => {
  assertEquals(escapeHtml("hello world"), "hello world");
});

Deno.test("escapeHtml - handles empty string", () => {
  assertEquals(escapeHtml(""), "");
});

Deno.test("escapeHtml - prevents XSS script injection", () => {
  const malicious = '<script>alert("xss")</script>';
  const escaped = escapeHtml(malicious);
  assertEquals(escaped.includes("<script>"), false);
  assertEquals(escaped.includes("</script>"), false);
});

// jsValue tests

Deno.test("jsValue - returns null for null", () => {
  assertEquals(jsValue(null), "null");
});

Deno.test("jsValue - returns null for undefined", () => {
  assertEquals(jsValue(undefined), "null");
});

Deno.test("jsValue - returns quoted string for plain text", () => {
  assertEquals(jsValue("hello"), '"hello"');
});

Deno.test("jsValue - escapes quotes in string", () => {
  assertEquals(jsValue('say "hi"'), '"say \\"hi\\""');
});

Deno.test("jsValue - handles empty string", () => {
  assertEquals(jsValue(""), '""');
});

Deno.test("jsValue - escapes backslashes", () => {
  assertEquals(jsValue("path\\to\\file"), '"path\\\\to\\\\file"');
});

Deno.test("jsValue - handles URL with special characters", () => {
  const url = "https://example.com/path?foo=bar&baz=qux";
  const result = jsValue(url);
  assertEquals(result.startsWith('"'), true);
  assertEquals(result.endsWith('"'), true);
  // Should be valid JSON
  assertEquals(JSON.parse(result), url);
});
