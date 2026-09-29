import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { isProduction } from "@/lib/env";
import type { RequestMetadata } from "@/lib/security/request";
import { generateToken, hashToken } from "@/lib/security/tokens";

/*
 * Server-side sessions.
 *
 * Firebase proves who the user is once, at sign-in. After that the app relies on its own
 * opaque session token in an httpOnly cookie, backed by a row in Postgres. That gives us
 * instant revocation, a list of active devices, and no JWT parsing on every request.
 */

export const SESSION_COOKIE_NAME = "operiq_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
// Sliding expiry: an active session is extended at most once a day to limit writes.
const SESSION_EXTEND_AFTER_MS = 24 * 60 * 60 * 1000;

const sessionUserSelect = {
  id: true,
  firebaseUid: true,
  email: true,
  name: true,
  avatarUrl: true,
  emailVerifiedAt: true,
  lastOrganizationId: true,
} as const;

export interface SessionUser {
  id: string;
  firebaseUid: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerifiedAt: Date | null;
  lastOrganizationId: string | null;
}

export interface CurrentSession {
  session: { id: string; expiresAt: Date };
  user: SessionUser;
}

export async function createSession(userId: string, request: RequestMetadata) {
  const token = generateToken();
  const session = await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
    },
    select: { id: true, expiresAt: true },
  });
  return { token, session };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function validateSessionToken(token: string): Promise<CurrentSession | null> {
  const row = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, expiresAt: true, lastSeenAt: true, user: { select: sessionUserSelect } },
  });
  if (!row) return null;

  const now = Date.now();
  if (row.expiresAt.getTime() <= now) {
    await db.session.deleteMany({ where: { id: row.id } });
    return null;
  }

  let expiresAt = row.expiresAt;
  if (now - row.lastSeenAt.getTime() > SESSION_EXTEND_AFTER_MS) {
    expiresAt = new Date(now + SESSION_TTL_MS);
    await db.session.update({
      where: { id: row.id },
      data: { lastSeenAt: new Date(now), expiresAt },
    });
  }

  return { session: { id: row.id, expiresAt }, user: row.user };
}

/** Memoized per request, so layouts, pages and actions share one lookup. */
export const getCurrentSession = cache(async (): Promise<CurrentSession | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token || token.length > 128) return null;
  return validateSessionToken(token);
});

export async function getCurrentUser(): Promise<SessionUser | null> {
  return (await getCurrentSession())?.user ?? null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireVerifiedUser(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.emailVerifiedAt) redirect("/verify-email");
  return user;
}

export async function deleteSession(sessionId: string) {
  await db.session.deleteMany({ where: { id: sessionId } });
}

export async function listUserSessions(userId: string) {
  return db.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" },
    select: { id: true, createdAt: true, lastSeenAt: true, ipAddress: true, userAgent: true },
  });
}

/** Scoped by user id so a crafted session id cannot revoke someone else's session. */
export async function revokeUserSession(userId: string, sessionId: string) {
  const { count } = await db.session.deleteMany({ where: { id: sessionId, userId } });
  return count > 0;
}

export async function revokeOtherSessions(userId: string, keepSessionId: string) {
  const { count } = await db.session.deleteMany({
    where: { userId, id: { not: keepSessionId } },
  });
  return count;
}
