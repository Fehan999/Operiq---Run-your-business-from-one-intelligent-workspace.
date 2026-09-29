"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ROLES } from "@/lib/authorization/permissions";
import { runAction } from "@/lib/actions";
import type { ActionResult } from "@/lib/errors";
import { changeMemberRole, leaveWorkspace, removeMember } from "@/modules/members/service";
import { requireWorkspaceAction } from "@/modules/organizations/context";

const idParam = z.string().min(1).max(64);
const roleParam = z.enum(ROLES);

export async function changeMemberRoleAction(
  slug: string,
  memberId: string,
  role: string,
): Promise<ActionResult> {
  return runAction(
    "members.changeRole",
    async () => {
      const context = await requireWorkspaceAction(idParam.parse(slug), "members:manage");
      await changeMemberRole(context, idParam.parse(memberId), roleParam.parse(role));
      revalidatePath(`/w/${context.organization.slug}`, "layout");
      return null;
    },
    { successMessage: "Role updated." },
  );
}

export async function removeMemberAction(slug: string, memberId: string): Promise<ActionResult> {
  return runAction(
    "members.remove",
    async () => {
      const context = await requireWorkspaceAction(idParam.parse(slug), "members:manage");
      await removeMember(context, idParam.parse(memberId));
      revalidatePath(`/w/${context.organization.slug}`, "layout");
      return null;
    },
    { successMessage: "Member removed." },
  );
}

export async function leaveWorkspaceAction(
  slug: string,
): Promise<ActionResult<{ redirectTo: string }>> {
  return runAction("members.leave", async () => {
    const context = await requireWorkspaceAction(idParam.parse(slug));
    await leaveWorkspace(context);
    return { redirectTo: "/dashboard" };
  });
}
