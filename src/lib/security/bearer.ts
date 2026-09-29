import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Checks an `Authorization: Bearer <secret>` header in constant time. Both sides are
 * hashed first so the comparison doesn't leak the secret's length either. With no
 * secret configured, every request is refused.
 */
export function hasValidBearer(
  header: string | null | undefined,
  secret: string | undefined,
): boolean {
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const provided = createHash("sha256").update(header.slice("Bearer ".length)).digest();
  const expected = createHash("sha256").update(secret).digest();
  return timingSafeEqual(provided, expected);
}
