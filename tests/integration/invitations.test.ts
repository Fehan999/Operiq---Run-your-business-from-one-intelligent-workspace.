import { describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";
import {
  acceptInvitationById,
  acceptInvitationByToken,
  createInvitations,
  getInvitationPreview,
} from "@/modules/invitations/service";

import { addMember, contextFor, createUser, createWorkspace, toSessionUser } from "./factories";

function tokenFrom(url: string | undefined) {
  if (!url) throw new Error("expected an invite url");
  return url.split("/invite/")[1]!;
}

async function ownerWorkspace() {
  const owner = await createUser({ email: "owner@acme.test", name: "Olivia Owner" });
  const workspace = await createWorkspace("Acme");
  await addMember(workspace.id, owner.id, "OWNER");
  return { owner, workspace, context: await contextFor(owner.id, workspace.id) };
}

describe("invitations", () => {
  it("stores only a hash of the token and accepts with the matching email", async () => {
    const { workspace, context, owner } = await ownerWorkspace();
    const [result] = await createInvitations(context, [
      { email: "sara@acme.test", role: "MANAGER" },
    ]);
    const token = tokenFrom(result?.inviteUrl);

    const stored = await db.invitation.findFirstOrThrow({
      where: { organizationId: workspace.id },
    });
    expect(stored.tokenHash).not.toBe(token);
    expect(stored.tokenHash).toHaveLength(64);

    expect(await getInvitationPreview(token)).toMatchObject({ status: "pending", role: "MANAGER" });

    const sara = await createUser({ email: "sara@acme.test", name: "Sara" });
    const accepted = await acceptInvitationByToken(toSessionUser(sara), token);
    expect(accepted).toEqual({ slug: workspace.slug, joined: true });

    const membership = await db.organizationMember.findUniqueOrThrow({
      where: { organizationId_userId: { organizationId: workspace.id, userId: sara.id } },
    });
    expect(membership.role).toBe("MANAGER");

    // The inviter is told, and the event is in the audit log and activity feed.
    expect(await db.notification.count({ where: { recipientId: owner.id } })).toBe(1);
    expect(await db.auditLog.count({ where: { action: "invitation.accepted" } })).toBe(1);
    expect(await db.activity.count({ where: { type: "member.joined" } })).toBe(1);
  });

  it("refuses someone signed in with a different email", async () => {
    const { context, workspace } = await ownerWorkspace();
    const [result] = await createInvitations(context, [
      { email: "sara@acme.test", role: "MEMBER" },
    ]);
    const mallory = await createUser({ email: "mallory@evil.test" });

    await expect(
      acceptInvitationByToken(toSessionUser(mallory), tokenFrom(result?.inviteUrl)),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(await db.organizationMember.count({ where: { organizationId: workspace.id } })).toBe(1);
  });

  it("cannot be used twice, but re-clicking as the member is harmless", async () => {
    const { context } = await ownerWorkspace();
    const [result] = await createInvitations(context, [
      { email: "sara@acme.test", role: "MEMBER" },
    ]);
    const token = tokenFrom(result?.inviteUrl);
    const sara = toSessionUser(await createUser({ email: "sara@acme.test" }));

    await acceptInvitationByToken(sara, token);
    await expect(acceptInvitationByToken(sara, token)).resolves.toMatchObject({ joined: false });
  });

  it("rejects expired and revoked invitations", async () => {
    const { context, workspace } = await ownerWorkspace();
    const [result] = await createInvitations(context, [
      { email: "late@acme.test", role: "MEMBER" },
    ]);
    await db.invitation.updateMany({
      where: { organizationId: workspace.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const late = toSessionUser(await createUser({ email: "late@acme.test" }));

    await expect(acceptInvitationByToken(late, tokenFrom(result?.inviteUrl))).rejects.toMatchObject(
      {
        code: "NOT_FOUND",
      },
    );
    expect(await getInvitationPreview(tokenFrom(result?.inviteUrl))).toMatchObject({
      status: "expired",
    });
  });

  it("replaces an open invitation when the same person is invited again", async () => {
    const { context, workspace } = await ownerWorkspace();
    const [first] = await createInvitations(context, [{ email: "sara@acme.test", role: "MEMBER" }]);
    await createInvitations(context, [{ email: "sara@acme.test", role: "MANAGER" }]);

    const open = await db.invitation.findMany({
      where: { organizationId: workspace.id, revokedAt: null, acceptedAt: null },
    });
    expect(open).toHaveLength(1);
    expect(open[0]!.role).toBe("MANAGER");
    expect(await getInvitationPreview(tokenFrom(first?.inviteUrl))).toMatchObject({
      status: "revoked",
    });
  });

  it("skips existing members and the inviter", async () => {
    const { context, workspace } = await ownerWorkspace();
    const existing = await createUser({ email: "existing@acme.test" });
    await addMember(workspace.id, existing.id, "MEMBER");

    const results = await createInvitations(context, [
      { email: "existing@acme.test", role: "MEMBER" },
      { email: "owner@acme.test", role: "MEMBER" },
    ]);
    expect(results.map((result) => result.status).sort()).toEqual([
      "already_member",
      "skipped_self",
    ]);
  });

  it("enforces the plan's seat limit, counting pending invitations", async () => {
    const { context } = await ownerWorkspace();
    // Free plan: 3 seats. The owner uses one.
    await createInvitations(context, [{ email: "one@acme.test", role: "MEMBER" }]);
    await createInvitations(context, [{ email: "two@acme.test", role: "MEMBER" }]);
    await expect(
      createInvitations(context, [{ email: "three@acme.test", role: "MEMBER" }]),
    ).rejects.toMatchObject({
      code: "LIMIT_REACHED",
    });
  });

  it("does not let an admin invite another admin", async () => {
    const { workspace } = await ownerWorkspace();
    const admin = await createUser();
    await addMember(workspace.id, admin.id, "ADMIN");
    const adminContext = await contextFor(admin.id, workspace.id);

    await expect(
      createInvitations(adminContext, [{ email: "x@acme.test", role: "ADMIN" }]),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("accepts from the onboarding list by id, still checking the email", async () => {
    const { context } = await ownerWorkspace();
    await createInvitations(context, [{ email: "sara@acme.test", role: "VIEWER" }]);
    const invitation = await db.invitation.findFirstOrThrow({ where: { email: "sara@acme.test" } });
    const other = toSessionUser(await createUser({ email: "other@acme.test" }));

    await expect(acceptInvitationById(other, invitation.id)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    const sara = toSessionUser(await createUser({ email: "sara@acme.test" }));
    await expect(acceptInvitationById(sara, invitation.id)).resolves.toMatchObject({
      joined: true,
    });
  });

  it("does not try to send email when no provider is configured", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { context } = await ownerWorkspace();
    const [result] = await createInvitations(context, [
      { email: "sara@acme.test", role: "MEMBER" },
    ]);
    expect(result).toMatchObject({ status: "invited", emailed: false });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
