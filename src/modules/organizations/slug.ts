/*
 * Workspace slugs appear in every private URL (/w/<slug>/...). They are lowercase, dash
 * separated, and a handful of words are reserved so a slug can never look like a system
 * route or be used to impersonate the product.
 */

export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 40;
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "billing",
  "dashboard",
  "demo",
  "help",
  "invite",
  "login",
  "logout",
  "new",
  "onboarding",
  "operiq",
  "register",
  "settings",
  "signup",
  "support",
  "system",
  "www",
]);

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

export function validateSlug(slug: string): string | null {
  if (slug.length < SLUG_MIN_LENGTH) return `Use at least ${SLUG_MIN_LENGTH} characters.`;
  if (slug.length > SLUG_MAX_LENGTH) return `Use at most ${SLUG_MAX_LENGTH} characters.`;
  if (!SLUG_PATTERN.test(slug)) {
    return "Use lowercase letters, numbers and single dashes only.";
  }
  if (slug.includes("--")) return "Avoid double dashes.";
  if (isReservedSlug(slug)) return "That address is reserved. Try another one.";
  return null;
}

/** Appends a short random suffix, used when the preferred slug is already taken. */
export function withRandomSuffix(slug: string, random: () => number = Math.random): string {
  const suffix = Math.floor(random() * 36 ** 4)
    .toString(36)
    .padStart(4, "0");
  const base = slug.slice(0, SLUG_MAX_LENGTH - suffix.length - 1).replace(/-+$/g, "");
  return `${base || "workspace"}-${suffix}`;
}
