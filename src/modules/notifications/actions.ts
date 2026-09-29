"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { runAction } from "@/lib/actions";
import type { ActionResult } from "@/lib/errors";
import { markAllNotificationsRead, markNotificationRead } from "@/modules/notifications/service";
import { requireWorkspaceAction } from "@/modules/organizations/context";

const idParam = z.string().min(1).max(64);

export async function markNotificationReadAction(
  slug: string,
  notificationId: string,
): Promise<ActionResult> {
  return runAction("notifications.markRead", async () => {
    const context = await requireWorkspaceAction(idParam.parse(slug));
    await markNotificationRead(
      context.organization.id,
      context.user.id,
      idParam.parse(notificationId),
    );
    revalidatePath(`/w/${context.organization.slug}`, "layout");
    return null;
  });
}

export async function markAllNotificationsReadAction(slug: string): Promise<ActionResult> {
  return runAction("notifications.markAllRead", async () => {
    const context = await requireWorkspaceAction(idParam.parse(slug));
    await markAllNotificationsRead(context.organization.id, context.user.id);
    revalidatePath(`/w/${context.organization.slug}`, "layout");
    return null;
  });
}
