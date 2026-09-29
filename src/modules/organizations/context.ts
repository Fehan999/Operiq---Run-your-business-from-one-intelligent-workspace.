import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";

import type { Organization } from "@/generated/prisma/client";
import { hasPermission, type Permission, type Role } from "@/lib/authorization/permissions";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { requireVerifiedUser, type SessionUser } from "@/modules/auth/session";

/*
 * The workspace context is the only way server code gets hold of an organization.
 * It starts from the signed-in user and looks up their membership, so an organization id
 * or slug from the browser is never enough on its own to reach tenant data.
 */

export interface WorkspaceContext {
  user: SessionUser;
  organization: Organization;
  membership: { id: string; role: Role; jobTitle: string | null };
  role: Role;
  can: (permission: Permission) => boolean;
}

async function loadWorkspaceContext(
  user: SessionUser,
  slug: string,
): Promise<WorkspaceContext | null> {
  if (typeof slug !== "string" || slug.length === 0 || slug.length > 64) return null;

  const membership = await db.organizationMember.findFirst({
    where: { userId: user.id, organization: { slug } },
    select: { id: true, role: true, jobTitle: true, organization: true },
  });
  if (!membership) return null;

  const role = membership.role;
  return {
    user,
    organization: membership.organization,
    membership: { id: membership.id, role, jobTitle: membership.jobTitle },
    role,
    can: (permission) => hasPermission(role, permission),
  };
}

/**
 * For pages and layouts. Non-members get a 404 rather than a 403 so the existence of a
 * workspace is not revealed to people outside it.
 */
export const getWorkspaceContext = cache(async (slug: string): Promise<WorkspaceContext> => {
  const user = await requireVerifiedUser();
  const context = await loadWorkspaceContext(user, slug);
  if (!context) notFound();
  return context;
});

/** For server actions: resolves membership and checks a permission in one step. */
export async function requireWorkspaceAction(
  slug: string,
  permission?: Permission,
): Promise<WorkspaceContext> {
  const user = await requireVerifiedUser();
  const context = await loadWorkspaceContext(user, slug);
  if (!context) throw new AppError("NOT_FOUND", "Workspace not found.");
  if (permission && !context.can(permission)) throw new AppError("FORBIDDEN");
  return context;
}

export function assertPermission(context: WorkspaceContext, permission: Permission): void {
  if (!context.can(permission)) throw new AppError("FORBIDDEN");
}
