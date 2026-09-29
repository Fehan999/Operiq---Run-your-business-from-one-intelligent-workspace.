import { describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { hashToken } from "@/lib/security/tokens";
import type { FirebaseIdentity } from "@/modules/auth/firebase-token";
import {
  createSession,
  revokeOtherSessions,
  revokeUserSession,
  validateSessionToken,
} from "@/modules/auth/session";
import { upsertUserFromIdentity } from "@/modules/users/service";

import { createUser } from "./factories";

const noRequest = { ipAddress: "127.0.0.1", userAgent: "vitest", requestId: null };

function identity(overrides: Partial<FirebaseIdentity> = {}): FirebaseIdentity {
  return {
    uid: "firebase-1",
    email: "jane@example.com",
    emailVerified: true,
    name: "Jane",
    picture: null,
    signInProvider: "password",
    authTime: new Date(),
    ...overrides,
  };
}

describe("sessions", () => {
  it("stores a hash and resolves the user from the raw token", async () => {
    const user = await createUser();
    const { token, session } = await createSession(user.id, noRequest);

    const stored = await db.session.findUniqueOrThrow({ where: { id: session.id } });
    expect(stored.tokenHash).toBe(hashToken(token));
    expect(stored.tokenHash).not.toBe(token);

    const current = await validateSessionToken(token);
    expect(current?.user.id).toBe(user.id);
    expect(await validateSessionToken("made-up-token")).toBeNull();
  });

  it("deletes expired sessions when they are used", async () => {
    const user = await createUser();
    const { token, session } = await createSession(user.id, noRequest);
    await db.session.update({
      where: { id: session.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    expect(await validateSessionToken(token)).toBeNull();
    expect(await db.session.count({ where: { id: session.id } })).toBe(0);
  });

  it("extends active sessions at most once a day", async () => {
    const user = await createUser();
    const { token, session } = await createSession(user.id, noRequest);
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await db.session.update({
      where: { id: session.id },
      data: { lastSeenAt: twoDaysAgo, expiresAt: new Date(Date.now() + 60_000) },
    });

    const current = await validateSessionToken(token);
    expect(current!.session.expiresAt.getTime()).toBeGreaterThan(
      Date.now() + 29 * 24 * 60 * 60 * 1000,
    );
  });

  it("only revokes sessions that belong to the user", async () => {
    const alice = await createUser();
    const bob = await createUser();
    const { session: bobSession } = await createSession(bob.id, noRequest);

    expect(await revokeUserSession(alice.id, bobSession.id)).toBe(false);
    expect(await db.session.count({ where: { id: bobSession.id } })).toBe(1);

    const { session: keep } = await createSession(bob.id, noRequest);
    expect(await revokeOtherSessions(bob.id, keep.id)).toBe(1);
    expect(await db.session.count({ where: { userId: bob.id } })).toBe(1);
  });
});

describe("upsertUserFromIdentity", () => {
  it("creates a user on first sign-in and keeps edited profile fields later", async () => {
    const created = await upsertUserFromIdentity(identity());
    expect(created).toMatchObject({ email: "jane@example.com", name: "Jane" });
    expect(created.emailVerifiedAt).toBeInstanceOf(Date);

    await db.user.update({ where: { id: created.id }, data: { name: "Jane Cooper" } });
    const again = await upsertUserFromIdentity(identity({ name: "jane from google" }));
    expect(again.id).toBe(created.id);
    expect(again.name).toBe("Jane Cooper");
  });

  it("relinks a recreated Firebase account only when the email is verified", async () => {
    const original = await upsertUserFromIdentity(identity());

    await expect(
      upsertUserFromIdentity(identity({ uid: "firebase-2", emailVerified: false })),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const relinked = await upsertUserFromIdentity(identity({ uid: "firebase-2" }));
    expect(relinked.id).toBe(original.id);
    expect(relinked.firebaseUid).toBe("firebase-2");
  });

  it("tracks verification status from the identity provider", async () => {
    const unverified = await upsertUserFromIdentity(identity({ emailVerified: false }));
    expect(unverified.emailVerifiedAt).toBeNull();
    const verified = await upsertUserFromIdentity(identity({ emailVerified: true }));
    expect(verified.emailVerifiedAt).toBeInstanceOf(Date);
  });
});
