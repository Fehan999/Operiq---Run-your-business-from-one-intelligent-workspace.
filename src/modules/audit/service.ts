import "server-only";

import type { ActorType, Prisma } from "@/generated/prisma/client";
import { db, type DbClient } from "@/lib/db";
import { getRequestMetadata } from "@/lib/security/request";
import type { ChangeSet } from "@/modules/audit/diff";
import type { AuditAction } from "@/modules/audit/events";

export interface AuditEntry {
  action: AuditAction;
  organizationId?: string | null;
  actorId?: string | null;
  actorType?: ActorType;
  targetType?: string;
  targetId?: string;
  changes?: ChangeSet | null;
  metadata?: Prisma.InputJsonObject;
}

/**
 * Appends an audit entry. Pass the transaction client when the audited change happens in
 * a transaction, so the log and the change commit or roll back together.
 */
export async function recordAuditLog(entry: AuditEntry, client: DbClient = db): Promise<void> {
  const request = await getRequestMetadata();

  await client.auditLog.create({
    data: {
      action: entry.action,
      organizationId: entry.organizationId ?? null,
      actorId: entry.actorId ?? null,
      actorType: entry.actorType ?? "USER",
      targetType: entry.targetType,
      targetId: entry.targetId,
      changes: entry.changes ? (entry.changes as unknown as Prisma.InputJsonObject) : undefined,
      metadata: entry.metadata,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      requestId: request.requestId,
    },
  });
}

const PAGE_SIZE = 25;

export async function listAuditLogs(organizationId: string, cursor?: string) {
  const rows = await db.auditLog.findMany({
    where: { organizationId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      action: true,
      actorType: true,
      targetType: true,
      targetId: true,
      changes: true,
      metadata: true,
      ipAddress: true,
      createdAt: true,
      actor: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });

  const hasMore = rows.length > PAGE_SIZE;
  const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1]?.id : undefined };
}
