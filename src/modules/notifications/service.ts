import "server-only";

import { db, type DbClient } from "@/lib/db";

export interface NotificationInput {
  organizationId: string;
  recipientId: string;
  type: "member.joined" | "invitation.accepted" | "role.changed";
  title: string;
  body?: string;
  link?: string;
}

export async function createNotification(input: NotificationInput, client: DbClient = db) {
  await client.notification.create({ data: input });
}

export async function listNotifications(organizationId: string, recipientId: string, take = 20) {
  const [items, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { organizationId, recipientId },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        link: true,
        readAt: true,
        createdAt: true,
      },
    }),
    db.notification.count({ where: { organizationId, recipientId, readAt: null } }),
  ]);
  return { items, unreadCount };
}

export type NotificationItem = Awaited<ReturnType<typeof listNotifications>>["items"][number];

/** Scoped by recipient and workspace so one member can never mark another's notifications. */
export async function markNotificationRead(
  organizationId: string,
  recipientId: string,
  notificationId: string,
) {
  await db.notification.updateMany({
    where: { id: notificationId, organizationId, recipientId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(organizationId: string, recipientId: string) {
  await db.notification.updateMany({
    where: { organizationId, recipientId, readAt: null },
    data: { readAt: new Date() },
  });
}
