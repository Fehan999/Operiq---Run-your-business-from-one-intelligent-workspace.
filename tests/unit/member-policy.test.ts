import { describe, expect, it } from "vitest";

import {
  assignableRoles,
  canChangeRole,
  canInviteWithRole,
  canLeaveWorkspace,
  canRemoveMember,
} from "@/modules/members/policy";

const owner = { userId: "owner", role: "OWNER" as const };
const secondOwner = { userId: "owner-2", role: "OWNER" as const };
const admin = { userId: "admin", role: "ADMIN" as const };
const otherAdmin = { userId: "admin-2", role: "ADMIN" as const };
const manager = { userId: "manager", role: "MANAGER" as const };
const member = { userId: "member", role: "MEMBER" as const };
const viewer = { userId: "viewer", role: "VIEWER" as const };

describe("inviting", () => {
  it("lets owners invite with any role, including owner", () => {
    expect(canInviteWithRole("OWNER", "OWNER").allowed).toBe(true);
  });

  it("only lets admins invite roles below their own", () => {
    expect(canInviteWithRole("ADMIN", "MANAGER").allowed).toBe(true);
    expect(canInviteWithRole("ADMIN", "ADMIN").allowed).toBe(false);
    expect(canInviteWithRole("ADMIN", "OWNER").allowed).toBe(false);
  });

  it("blocks roles without the invite permission", () => {
    expect(canInviteWithRole("MANAGER", "VIEWER").allowed).toBe(false);
    expect(canInviteWithRole("VIEWER", "VIEWER").allowed).toBe(false);
  });
});

describe("changing roles", () => {
  it("allows an admin to promote a member to manager", () => {
    expect(canChangeRole(admin, member, "MANAGER", 1).allowed).toBe(true);
  });

  it("stops admins from creating other admins or touching owners", () => {
    expect(canChangeRole(admin, member, "ADMIN", 1).allowed).toBe(false);
    expect(canChangeRole(admin, otherAdmin, "MEMBER", 1).allowed).toBe(false);
    expect(canChangeRole(admin, owner, "MEMBER", 1).allowed).toBe(false);
  });

  it("never lets anyone change their own role", () => {
    const result = canChangeRole(owner, owner, "ADMIN", 2);
    expect(result).toEqual({ allowed: false, reason: "You can't change your own role." });
  });

  it("protects the last owner", () => {
    expect(canChangeRole(secondOwner, owner, "ADMIN", 1).allowed).toBe(false);
    expect(canChangeRole(secondOwner, owner, "ADMIN", 2).allowed).toBe(true);
  });

  it("rejects no-op changes", () => {
    expect(canChangeRole(owner, member, "MEMBER", 1).allowed).toBe(false);
  });

  it("rejects members and managers entirely", () => {
    expect(canChangeRole(manager, viewer, "MEMBER", 1).allowed).toBe(false);
    expect(canChangeRole(member, viewer, "MEMBER", 1).allowed).toBe(false);
  });
});

describe("removing members", () => {
  it("lets owners remove anyone except the last owner", () => {
    expect(canRemoveMember(owner, admin, 1).allowed).toBe(true);
    expect(canRemoveMember(owner, secondOwner, 2).allowed).toBe(true);
    expect(canRemoveMember(secondOwner, owner, 1).allowed).toBe(false);
  });

  it("lets admins remove only people below them", () => {
    expect(canRemoveMember(admin, viewer, 1).allowed).toBe(true);
    expect(canRemoveMember(admin, otherAdmin, 1).allowed).toBe(false);
    expect(canRemoveMember(admin, owner, 2).allowed).toBe(false);
  });

  it("sends people to 'leave' instead of removing themselves", () => {
    expect(canRemoveMember(admin, admin, 1).allowed).toBe(false);
  });
});

describe("leaving", () => {
  it("keeps the last owner from leaving", () => {
    expect(canLeaveWorkspace(owner, 1).allowed).toBe(false);
    expect(canLeaveWorkspace(owner, 2).allowed).toBe(true);
    expect(canLeaveWorkspace(viewer, 1).allowed).toBe(true);
  });
});

describe("assignable roles", () => {
  it("matches the rank rules", () => {
    expect(assignableRoles("OWNER")).toEqual(["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"]);
    expect(assignableRoles("ADMIN")).toEqual(["MANAGER", "MEMBER", "VIEWER"]);
    expect(assignableRoles("VIEWER")).toEqual([]);
  });
});
