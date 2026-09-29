import { createHash, randomBytes } from "node:crypto";

/** URL-safe random token. 32 bytes gives 256 bits of entropy. */
export function generateToken(byteLength = 32): string {
  return randomBytes(byteLength).toString("base64url");
}

/**
 * Tokens (sessions, invitations) are stored hashed. SHA-256 without a salt is fine here
 * because the input is already high-entropy random data, not a user-chosen password.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
