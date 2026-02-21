// HTML template loading and placeholder substitution
//
// Reads static HTML files and replaces {{PLACEHOLDER}} markers with values.

const templateCache = new Map<string, string>();
const templateDir = new URL("./public/", import.meta.url).pathname;

/**
 * Read an HTML template file and substitute placeholders.
 *
 * Placeholders use the format {{NAME}} and are replaced with the corresponding
 * value from the provided object. Values are NOT escaped - ensure any user input
 * is sanitized before passing to this function.
 *
 * @param filename - Name of the HTML file in src/public/
 * @param values - Object mapping placeholder names to values
 * @returns The HTML string with placeholders replaced
 */
export async function renderTemplate(
  filename: string,
  values: Record<string, string>,
): Promise<string> {
  let template = templateCache.get(filename);

  if (!template) {
    const path = `${templateDir}${filename}`;
    template = await Deno.readTextFile(path);
    templateCache.set(filename, template);
  }

  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }

  return result;
}

/**
 * Escape a string for safe inclusion in HTML.
 */
export function escapeHtml(text: string): string {
  const escapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => escapeMap[char]);
}

/**
 * Format a value for JavaScript injection (JSON-safe).
 * Returns "null" for null/undefined, quoted string otherwise.
 */
export function jsValue(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return "null";
  }
  return JSON.stringify(value);
}
