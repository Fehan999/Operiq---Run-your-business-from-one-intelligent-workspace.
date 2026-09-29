"use server";

import { z } from "zod";

import { runAction } from "@/lib/actions";
import { getServerEnv } from "@/lib/env";
import { AppError, type ActionResult } from "@/lib/errors";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getRequestMetadata } from "@/lib/security/request";
import { safeRedirectPath } from "@/lib/utils";
import { recordAuditLog } from "@/modules/audit/service";
import { verifyFirebaseIdToken } from "@/modules/auth/firebase-token";
import {
  clearSessionCookie,
  createSession,
  deleteSession,
  getCurrentSession,
  revokeOtherSessions,
  revokeUserSession,
  setSessionCookie,
} from "@/modules/auth/session";
import { upsertUserFromIdentity } from "@/modules/users/service";

// A fresh sign-in is required to open a new session. This narrows what an attacker can do
// with a leaked ID token, which Firebase keeps valid for up to an hour.
const MAX_SIGN_IN_AGE_MS = 10 * 60 * 1000;

const establishSessionSchema = z.object({
  idToken: z.string().min(32).max(4096),
  next: z.string().max(512).optional(),
});

export async function establishSessionAction(
  input: z.input<typeof establishSessionSchema>,
): Promise<ActionResult<{ redirectTo: string; emailVerified: boolean }>> {
  return runAction("auth.establishSession", async () => {
    const { idToken, next } = establishSessionSchema.parse(input);
    const request = await getRequestMetadata();

    const limit = await rateLimit(`sign-in:${request.ipAddress ?? "unknown"}`, RATE_LIMITS.signIn);
    if (!limit.success) throw new AppError("RATE_LIMITED");

    const identity = await verifyFirebaseIdToken(idToken, {
      projectId: getServerEnv().NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });

    const current = await getCurrentSession();
    const isRefresh = current?.user.firebaseUid === identity.uid;

    if (!isRefresh && Date.now() - identity.authTime.getTime() > MAX_SIGN_IN_AGE_MS) {
      throw new AppError("UNAUTHENTICATED", "Please sign in again to continue.");
    }

    const user = await upsertUserFromIdentity(identity);

    // Refreshing an existing session (for example right after verifying an email) only
    // syncs the profile. Anything else gets a brand new session token.
    if (!isRefresh) {
      if (current) await deleteSession(current.session.id);
      const { token, session } = await createSession(user.id, request);
      await setSessionCookie(token, session.expiresAt);
      await recordAuditLog({
        action: "auth.signed_in",
        actorId: user.id,
        metadata: { provider: identity.signInProvider },
      });
    }

    const emailVerified = Boolean(user.emailVerifiedAt);
    return {
      emailVerified,
      redirectTo: emailVerified ? safeRedirectPath(next) : "/verify-email",
    };
  });
}

export async function signOutAction(): Promise<ActionResult> {
  return runAction("auth.signOut", async () => {
    const current = await getCurrentSession();
    if (current) {
      await deleteSession(current.session.id);
      await recordAuditLog({ action: "auth.signed_out", actorId: current.user.id });
    }
    await clearSessionCookie();
    return null;
  });
}

const sessionIdSchema = z.string().min(1).max(64);

export async function revokeSessionAction(sessionId: string): Promise<ActionResult> {
  return runAction(
    "auth.revokeSession",
    async () => {
      const current = await getCurrentSession();
      if (!current) throw new AppError("UNAUTHENTICATED");

      const id = sessionIdSchema.parse(sessionId);
      if (id === current.session.id) {
        throw new AppError("VALIDATION", "Use sign out to end your current session.");
      }

      const revoked = await revokeUserSession(current.user.id, id);
      if (!revoked) throw new AppError("NOT_FOUND", "That session no longer exists.");

      await recordAuditLog({
        action: "auth.session_revoked",
        actorId: current.user.id,
        targetType: "session",
        targetId: id,
      });
      return null;
    },
    { successMessage: "Session revoked." },
  );
}

export async function revokeOtherSessionsAction(): Promise<ActionResult<{ count: number }>> {
  return runAction("auth.revokeOtherSessions", async () => {
    const current = await getCurrentSession();
    if (!current) throw new AppError("UNAUTHENTICATED");

    const count = await revokeOtherSessions(current.user.id, current.session.id);
    if (count > 0) {
      await recordAuditLog({
        action: "auth.session_revoked",
        actorId: current.user.id,
        metadata: { scope: "all_other_sessions", count },
      });
    }
    return { count };
  });
}
