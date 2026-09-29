"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { runAction } from "@/lib/actions";
import { AppError, type ActionResult } from "@/lib/errors";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { requireVerifiedUser } from "@/modules/auth/session";
import { inviteMembersSchema, type InviteMembersInput } from "@/modules/invitations/schemas";
import {
  acceptInvitationById,
  acceptInvitationByToken,
  createInvitations,
  resendInvitation,
  revokeInvitation,
  type InvitationResult,
} from "@/modules/invitations/service";
import { requireWorkspaceAction } from "@/modules/organizations/context";

const idParam = z.string().min(1).max(64);

export async function inviteMembersAction(
  slug: string,
  input: InviteMembersInput,
): Promise<ActionResult<{ results: InvitationResult[] }>> {
  return runAction("invitations.create", async () => {
    const context = await requireWorkspaceAction(idParam.parse(slug), "members:invite");
    const limit = await rateLimit(`invite:${context.organization.id}`, RATE_LIMITS.invite);
    if (!limit.success) throw new AppError("RATE_LIMITED");

    const { invites } = inviteMembersSchema.parse(input);
    const results = await createInvitations(context, invites);
    revalidatePath(`/w/${context.organization.slug}/settings/members`);
    return { results };
  });
}

export async function revokeInvitationAction(
  slug: string,
  invitationId: string,
): Promise<ActionResult> {
  return runAction(
    "invitations.revoke",
    async () => {
      const context = await requireWorkspaceAction(idParam.parse(slug), "members:invite");
      await revokeInvitation(context, idParam.parse(invitationId));
      revalidatePath(`/w/${context.organization.slug}/settings/members`);
      return null;
    },
    { successMessage: "Invitation revoked." },
  );
}

export async function resendInvitationAction(
  slug: string,
  invitationId: string,
): Promise<ActionResult<{ inviteUrl: string; emailed: boolean }>> {
  return runAction("invitations.resend", async () => {
    const context = await requireWorkspaceAction(idParam.parse(slug), "members:invite");
    const limit = await rateLimit(`invite:${context.organization.id}`, RATE_LIMITS.invite);
    if (!limit.success) throw new AppError("RATE_LIMITED");

    const result = await resendInvitation(context, idParam.parse(invitationId));
    revalidatePath(`/w/${context.organization.slug}/settings/members`);
    return result;
  });
}

export async function acceptInvitationAction(
  token: string,
): Promise<ActionResult<{ redirectTo: string }>> {
  return runAction("invitations.accept", async () => {
    const user = await requireVerifiedUser();
    const { slug } = await acceptInvitationByToken(user, z.string().max(128).parse(token));
    return { redirectTo: `/w/${slug}/dashboard` };
  });
}

export async function acceptInvitationByIdAction(
  invitationId: string,
): Promise<ActionResult<{ redirectTo: string }>> {
  return runAction("invitations.acceptById", async () => {
    const user = await requireVerifiedUser();
    const { slug } = await acceptInvitationById(user, idParam.parse(invitationId));
    return { redirectTo: `/w/${slug}/dashboard` };
  });
}
