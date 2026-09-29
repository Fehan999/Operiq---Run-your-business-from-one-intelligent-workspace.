import { describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { recordAuditLog } from "@/modules/audit/service";
import { changeMemberRole, leaveWorkspace, removeMember } from "@/modules/members/service";
import { createWorkspace as createWorkspaceService } from "@/modules/organizations/service";

import { addMember, contextFor, createUser, createWorkspace, toSessionUser } from "./factories";

describe("member management", () => {
  it("records role changes with before and after values", async () => {
    const owner = await createUser();
    const member = await createUser();
    const workspace = await createWorkspace();
    await addMember(workspace.id, owner.id, "OWNER");
    const membership = await addMember(workspace.id, member.id, "MEMBER");

    await changeMemberRole(await contextFor(owner.id, workspace.id), membership.id, "MANAGER");

    const log = await db.auditLog.findFirstOrThrow({ where: { action: "member.role_changed" } });
    expect(log.changes).toEqual({ before: { role: "MEMBER" }, after: { role: "MANAGER" } });
    expect(await db.notification.count({ where: { recipientId: member.id } })).toBe(1);
  });

  it("never leaves a workspace without an owner", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace();
    await addMember(workspace.id, owner.id, "OWNER");

    await expect(leaveWorkspace(await contextFor(owner.id, workspace.id))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    const coOwner = await createUser();
    const coOwnerMembership = await addMember(workspace.id, coOwner.id, "OWNER");
    const ownerContext = await contextFor(owner.id, workspace.id);
    // Demoting the other owner is fine while two exist...
    await changeMemberRole(ownerContext, coOwnerMembership.id, "ADMIN");
    // ...and now the original owner is the last one again.
    await expect(leaveWorkspace(ownerContext)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("stops an admin from removing an owner", async () => {
    const owner = await createUser();
    const admin = await createUser();
    const workspace = await createWorkspace();
    const ownerMembership = await addMember(workspace.id, owner.id, "OWNER");
    await addMember(workspace.id, admin.id, "ADMIN");

    await expect(
      removeMember(await contextFor(admin.id, workspace.id), ownerMembership.id),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("clears the remembered workspace when a member is removed", async () => {
    const owner = await createUser();
    const member = await createUser();
    const workspace = await createWorkspace();
    await addMember(workspace.id, owner.id, "OWNER");
    const membership = await addMember(workspace.id, member.id, "MEMBER");
    await db.user.update({ where: { id: member.id }, data: { lastOrganizationId: workspace.id } });

    await removeMember(await contextFor(owner.id, workspace.id), membership.id);

    const reloaded = await db.user.findUniqueOrThrow({ where: { id: member.id } });
    expect(reloaded.lastOrganizationId).toBeNull();
  });
});

describe("creating a workspace", () => {
  it("makes the creator the owner in one transaction and logs it", async () => {
    const user = toSessionUser(await createUser());
    const organization = await createWorkspaceService(user, { name: "Nova", slug: "nova-agency" });

    const membership = await db.organizationMember.findUniqueOrThrow({
      where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },
    });
    expect(membership.role).toBe("OWNER");
    expect(
      await db.auditLog.count({
        where: { organizationId: organization.id, action: "workspace.created" },
      }),
    ).toBe(1);
  });

  it("reports a taken slug as a field error", async () => {
    const user = toSessionUser(await createUser());
    await createWorkspaceService(user, { name: "Nova", slug: "nova-agency" });
    await expect(
      createWorkspaceService(user, { name: "Nova 2", slug: "nova-agency" }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      fieldErrors: { slug: ["That address is already taken."] },
    });
  });
});

describe("audit log", () => {
  it("is append-only at the database level", async () => {
    const user = await createUser();
    await recordAuditLog({ action: "auth.signed_in", actorId: user.id });
    const entry = await db.auditLog.findFirstOrThrow();

    await expect(
      db.auditLog.update({ where: { id: entry.id }, data: { action: "tampered" } }),
    ).rejects.toThrow(/append-only/);
    await expect(db.auditLog.delete({ where: { id: entry.id } })).rejects.toThrow(/append-only/);
  });

  it("still lets a user account be deleted, keeping the entry without the actor", async () => {
    const user = await createUser();
    await recordAuditLog({ action: "auth.signed_in", actorId: user.id });
    await db.user.delete({ where: { id: user.id } });

    const entry = await db.auditLog.findFirstOrThrow();
    expect(entry.actorId).toBeNull();
    expect(entry.action).toBe("auth.signed_in");
  });

  it("allows a deliberate purge inside a transaction that opts in", async () => {
    const workspace = await createWorkspace();
    await recordAuditLog({ action: "workspace.created", organizationId: workspace.id });

    await expect(db.organization.delete({ where: { id: workspace.id } })).rejects.toThrow(
      /append-only/,
    );

    await db.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL operiq.allow_audit_purge = 'on'`;
      await tx.organization.delete({ where: { id: workspace.id } });
    });
    expect(await db.auditLog.count()).toBe(0);
  });
});
