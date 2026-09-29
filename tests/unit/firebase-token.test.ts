import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTPayload } from "jose";
import { beforeAll, describe, expect, it } from "vitest";

import { AppError } from "@/lib/errors";
import { verifyFirebaseIdToken } from "@/modules/auth/firebase-token";

const PROJECT_ID = "operiq-test";
const KID = "test-key";

let privateKey: CryptoKey;
let keySet: ReturnType<typeof createLocalJWKSet>;

beforeAll(async () => {
  const pair = await generateKeyPair("RS256");
  privateKey = pair.privateKey;
  const jwk = await exportJWK(pair.publicKey);
  keySet = createLocalJWKSet({ keys: [{ ...jwk, kid: KID, alg: "RS256", use: "sig" }] });
});

async function sign(
  claims: JWTPayload = {},
  options: { issuer?: string; audience?: string; expiresAt?: string | number; kid?: string } = {},
) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    email: "Founder@Example.com",
    email_verified: true,
    name: "Jane Founder",
    auth_time: now - 30,
    firebase: { sign_in_provider: "password" },
    ...claims,
  })
    .setProtectedHeader({ alg: "RS256", kid: options.kid ?? KID })
    .setIssuer(options.issuer ?? `https://securetoken.google.com/${PROJECT_ID}`)
    .setAudience(options.audience ?? PROJECT_ID)
    .setSubject((claims.sub as string | undefined) ?? "firebase-uid-123")
    .setIssuedAt(now - 30)
    .setExpirationTime(options.expiresAt ?? "1h")
    .sign(privateKey);
}

const verify = (token: string) => verifyFirebaseIdToken(token, { projectId: PROJECT_ID, keySet });

describe("verifyFirebaseIdToken", () => {
  it("accepts a valid token and normalises the identity", async () => {
    const identity = await verify(await sign());
    expect(identity).toMatchObject({
      uid: "firebase-uid-123",
      email: "founder@example.com",
      emailVerified: true,
      name: "Jane Founder",
      signInProvider: "password",
    });
    expect(identity.authTime).toBeInstanceOf(Date);
  });

  it("rejects tokens issued for another Firebase project", async () => {
    await expect(verify(await sign({}, { audience: "someone-else" }))).rejects.toBeInstanceOf(
      AppError,
    );
    await expect(
      verify(await sign({}, { issuer: "https://securetoken.google.com/someone-else" })),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects expired tokens", async () => {
    const now = Math.floor(Date.now() / 1000);
    // A number is an absolute timestamp for jose, so this token expired a minute ago.
    const token = await sign({}, { expiresAt: now - 60 });
    await expect(verify(token)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("rejects tokens signed by an unknown key", async () => {
    await expect(verify(await sign({}, { kid: "rotated-away" }))).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });

  it("rejects tokens without an email address", async () => {
    await expect(verify(await sign({ email: undefined }))).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });

  it("rejects an authentication time in the future", async () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    await expect(verify(await sign({ auth_time: future }))).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });

  it("treats a missing email_verified claim as unverified", async () => {
    const identity = await verify(await sign({ email_verified: undefined }));
    expect(identity.emailVerified).toBe(false);
  });

  it("refuses to run without a project id", async () => {
    await expect(
      verifyFirebaseIdToken(await sign(), { projectId: "", keySet }),
    ).rejects.toMatchObject({
      code: "UNAVAILABLE",
    });
  });

  it("rejects garbage", async () => {
    await expect(verify("not-a-jwt")).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });
});
