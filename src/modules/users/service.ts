import "server-only";

import { Prisma, type User } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { FirebaseIdentity } from "@/modules/auth/firebase-token";

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * Creates or refreshes the local user row for a verified Firebase identity.
 * Profile fields the user edited in Operiq win over what the identity provider sends.
 */
export async function upsertUserFromIdentity(identity: FirebaseIdentity): Promise<User> {
  const existing = await db.user.findUnique({ where: { firebaseUid: identity.uid } });

  if (existing) {
    return db.user.update({
      where: { id: existing.id },
      data: {
        email: identity.email,
        emailVerifiedAt: identity.emailVerified ? (existing.emailVerifiedAt ?? new Date()) : null,
        name: existing.name ?? identity.name,
        avatarUrl: existing.avatarUrl ?? identity.picture,
      },
    });
  }

  const sameEmail = await db.user.findUnique({ where: { email: identity.email } });
  if (sameEmail) {
    // Firebase keeps emails unique, so a different uid with the same email means the old
    // Firebase account was deleted and recreated. Only relink when the new account has
    // proven it owns the inbox, otherwise anyone could claim an existing Operiq user.
    if (!identity.emailVerified) {
      throw new AppError(
        "CONFLICT",
        "An account with this email already exists. Verify your email address to continue.",
      );
    }
    return db.user.update({
      where: { id: sameEmail.id },
      data: {
        firebaseUid: identity.uid,
        emailVerifiedAt: sameEmail.emailVerifiedAt ?? new Date(),
      },
    });
  }

  try {
    return await db.user.create({
      data: {
        firebaseUid: identity.uid,
        email: identity.email,
        name: identity.name,
        avatarUrl: identity.picture,
        emailVerifiedAt: identity.emailVerified ? new Date() : null,
      },
    });
  } catch (error) {
    // Two tabs finishing sign-in at the same moment can race here; the loser reads the row.
    if (isUniqueViolation(error)) {
      const winner = await db.user.findUnique({ where: { firebaseUid: identity.uid } });
      if (winner) return winner;
    }
    throw error;
  }
}

export async function getUserProfile(userId: string) {
  return db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
  });
}

export async function updateUserProfile(userId: string, data: { name: string }) {
  const before = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } });
  const updated = await db.user.update({
    where: { id: userId },
    data: { name: data.name },
    select: { name: true },
  });
  return { before, after: updated };
}

export async function setUserAvatar(userId: string, avatar: { url: string; path: string } | null) {
  const before = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { avatarPath: true },
  });
  await db.user.update({
    where: { id: userId },
    data: { avatarUrl: avatar?.url ?? null, avatarPath: avatar?.path ?? null },
  });
  return { previousPath: before.avatarPath };
}

export async function setLastOrganization(userId: string, organizationId: string) {
  await db.user.update({ where: { id: userId }, data: { lastOrganizationId: organizationId } });
}
