import { createRemoteJWKSet, errors, jwtVerify, type JWTVerifyGetKey } from "jose";

import { AppError } from "@/lib/errors";

/*
 * Verifies Firebase ID tokens without the Admin SDK.
 *
 * Firebase signs ID tokens with rotating Google keys published as a JWKS. Following the
 * checks Firebase documents for third-party JWT libraries means we do not need a service
 * account key on the server at all, which is one less secret to leak.
 */

const FIREBASE_JWKS_URL = new URL(
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
);

let remoteKeySet: JWTVerifyGetKey | undefined;

function getRemoteKeySet(): JWTVerifyGetKey {
  // jose caches keys and refetches when it sees an unknown kid, so one instance is enough.
  remoteKeySet ??= createRemoteJWKSet(FIREBASE_JWKS_URL, { cacheMaxAge: 60 * 60 * 1000 });
  return remoteKeySet;
}

export interface FirebaseIdentity {
  uid: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
  signInProvider: string | null;
  authTime: Date;
}

export interface VerifyOptions {
  projectId: string;
  keySet?: JWTVerifyGetKey;
  currentDate?: Date;
}

const CLOCK_TOLERANCE_SECONDS = 5;

export async function verifyFirebaseIdToken(
  idToken: string,
  { projectId, keySet = getRemoteKeySet(), currentDate }: VerifyOptions,
): Promise<FirebaseIdentity> {
  if (!projectId) {
    throw new AppError("UNAVAILABLE", "Authentication is not configured.");
  }

  let payload;
  try {
    ({ payload } = await jwtVerify(idToken, keySet, {
      algorithms: ["RS256"],
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      clockTolerance: CLOCK_TOLERANCE_SECONDS,
      currentDate,
      requiredClaims: ["sub", "iat", "exp", "auth_time"],
    }));
  } catch (error) {
    if (error instanceof errors.JOSEError) {
      throw new AppError("UNAUTHENTICATED", "Your sign-in session is invalid or has expired.", {
        cause: error,
      });
    }
    throw error;
  }

  const nowSeconds = Math.floor((currentDate ?? new Date()).getTime() / 1000);
  const { sub, iat, auth_time: authTime, email, email_verified: emailVerified } = payload;

  if (typeof sub !== "string" || sub.length === 0 || sub.length > 128) {
    throw new AppError("UNAUTHENTICATED", "Invalid token subject.");
  }
  if (typeof iat !== "number" || iat > nowSeconds + CLOCK_TOLERANCE_SECONDS) {
    throw new AppError("UNAUTHENTICATED", "Token was issued in the future.");
  }
  if (typeof authTime !== "number" || authTime > nowSeconds + CLOCK_TOLERANCE_SECONDS) {
    throw new AppError("UNAUTHENTICATED", "Invalid authentication time.");
  }
  if (typeof email !== "string" || email.length === 0) {
    // Operiq accounts are email based; phone-only or anonymous Firebase users are rejected.
    throw new AppError("UNAUTHENTICATED", "An email address is required to use Operiq.");
  }

  const firebaseClaim = payload.firebase as { sign_in_provider?: unknown } | undefined;

  return {
    uid: sub,
    email: email.trim().toLowerCase(),
    emailVerified: emailVerified === true,
    name: typeof payload.name === "string" ? payload.name.slice(0, 120) : null,
    picture: typeof payload.picture === "string" ? payload.picture : null,
    signInProvider:
      typeof firebaseClaim?.sign_in_provider === "string" ? firebaseClaim.sign_in_provider : null,
    authTime: new Date(authTime * 1000),
  };
}
