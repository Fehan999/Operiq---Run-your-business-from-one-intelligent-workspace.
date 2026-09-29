import { hasPermission, ROLE_RANK, type Role } from "@/lib/authorization/permissions";

/*
 * Rules for managing people inside a workspace. Kept as pure functions so they can be
 * unit tested exhaustively and reused by both the server and the UI.
 *
 * The core rule: you can only act on members ranked strictly below you, and you can only
 * hand out roles ranked strictly below you. Owners are the exception and can manage
 * anyone, but a workspace must always keep at least one owner.
 */

export interface MemberRef {
  userId: string;
  role: Role;
}

export type PolicyResult = { allowed: true } | { allowed: false; reason: string };

const allow: PolicyResult = { allowed: true };
const deny = (reason: string): PolicyResult => ({ allowed: false, reason });

function outranks(actor: Role, target: Role): boolean {
  return ROLE_RANK[actor] > ROLE_RANK[target];
}

export function canInviteWithRole(actorRole: Role, inviteRole: Role): PolicyResult {
  if (!hasPermission(actorRole, "members:invite")) {
    return deny("You don't have permission to invite members.");
  }
  if (actorRole !== "OWNER" && !outranks(actorRole, inviteRole)) {
    return deny("You can only invite people with a role below your own.");
  }
  return allow;
}

export function canChangeRole(
  actor: MemberRef,
  target: MemberRef,
  newRole: Role,
  ownerCount: number,
): PolicyResult {
  if (!hasPermission(actor.role, "members:manage")) {
    return deny("You don't have permission to change roles.");
  }
  if (actor.userId === target.userId) {
    return deny("You can't change your own role.");
  }
  if (target.role === newRole) {
    return deny("This member already has that role.");
  }
  if (actor.role !== "OWNER") {
    if (!outranks(actor.role, target.role)) {
      return deny("You can only change the role of members below you.");
    }
    if (!outranks(actor.role, newRole)) {
      return deny("You can only assign roles below your own.");
    }
  }
  if (target.role === "OWNER" && newRole !== "OWNER" && ownerCount <= 1) {
    return deny("A workspace needs at least one owner.");
  }
  return allow;
}

export function canRemoveMember(
  actor: MemberRef,
  target: MemberRef,
  ownerCount: number,
): PolicyResult {
  if (actor.userId === target.userId) {
    return deny("Use 'Leave workspace' to remove yourself.");
  }
  if (!hasPermission(actor.role, "members:manage")) {
    return deny("You don't have permission to remove members.");
  }
  if (actor.role !== "OWNER" && !outranks(actor.role, target.role)) {
    return deny("You can only remove members below you.");
  }
  if (target.role === "OWNER" && ownerCount <= 1) {
    return deny("A workspace needs at least one owner.");
  }
  return allow;
}

export function canLeaveWorkspace(member: MemberRef, ownerCount: number): PolicyResult {
  if (member.role === "OWNER" && ownerCount <= 1) {
    return deny("Make someone else an owner before leaving.");
  }
  return allow;
}

/** Roles the actor is allowed to hand out, for populating role pickers in the UI. */
export function assignableRoles(actorRole: Role): Role[] {
  const all: Role[] = ["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"];
  if (actorRole === "OWNER") return all;
  return all.filter((role) => outranks(actorRole, role));
}
