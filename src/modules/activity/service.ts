import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db, type DbClient } from "@/lib/db";

export const ACTIVITY_TYPES = [
  "workspace.created",
  "workspace.updated",
  "member.invited",
  "member.joined",
  "member.left",
  "member.removed",
  "member.role_changed",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface ActivityInput {
  organizationId: string;
  actorId?: string | null;
  type: ActivityType;
  entityType?: string;
  entityId?: string;
  data?: Prisma.InputJsonObject;
}

export async function recordActivity(input: ActivityInput, client: DbClient = db) {
  await client.activity.create({
    data: {
      organizationId: input.organizationId,
      actorId: input.actorId ?? null,
      type: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
      data: input.data ?? {},
    },
  });
}

export async function listRecentActivity(organizationId: string, take = 12) {
  return db.activity.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      type: true,
      data: true,
      createdAt: true,
      actor: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });
}

export type RecentActivity = Awaited<ReturnType<typeof listRecentActivity>>[number];
