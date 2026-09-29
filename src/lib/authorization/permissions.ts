/*
 * Role based access control.
 *
 * Roles map to a fixed set of permissions defined in code. That keeps authorization
 * reviewable in one file and testable without a database. Custom roles can later be
 * layered on top by storing extra grants per workspace; the check functions stay the same.
 *
 * This module is shared with the client so the UI can hide actions a member cannot take,
 * but hiding is only a convenience. Every server action checks again.
 */

export const ROLES = ["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "customers:view",
  "customers:create",
  "customers:update",
  "customers:delete",
  "leads:manage",
  "projects:manage",
  "tasks:manage",
  "finance:view",
  "invoices:create",
  "documents:manage",
  "ai:use",
  "ai:execute",
  "automations:manage",
  "members:invite",
  "members:manage",
  "workspace:update",
  "billing:manage",
  "audit:view",
  "workspace:delete",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** Higher rank can manage lower ranks. Used by the member management policy. */
export const ROLE_RANK: Record<Role, number> = {
  OWNER: 50,
  ADMIN: 40,
  MANAGER: 30,
  MEMBER: 20,
  VIEWER: 10,
};

const MEMBER_PERMISSIONS: readonly Permission[] = [
  "customers:view",
  "customers:create",
  "customers:update",
  "leads:manage",
  "tasks:manage",
  "documents:manage",
  "ai:use",
  "ai:execute",
];

const MANAGER_PERMISSIONS: readonly Permission[] = [
  ...MEMBER_PERMISSIONS,
  "customers:delete",
  "projects:manage",
  "finance:view",
  "invoices:create",
  "automations:manage",
];

const ADMIN_PERMISSIONS: readonly Permission[] = [
  ...MANAGER_PERMISSIONS,
  "members:invite",
  "members:manage",
  "workspace:update",
  "audit:view",
];

const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  OWNER: new Set(PERMISSIONS),
  ADMIN: new Set(ADMIN_PERMISSIONS),
  MANAGER: new Set(MANAGER_PERMISSIONS),
  MEMBER: new Set(MEMBER_PERMISSIONS),
  VIEWER: new Set<Permission>(["customers:view", "ai:use"]),
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export function permissionsFor(role: Role): Permission[] {
  return PERMISSIONS.filter((permission) => ROLE_PERMISSIONS[role].has(permission));
}

export const ROLE_DETAILS: Record<Role, { label: string; description: string }> = {
  OWNER: {
    label: "Owner",
    description: "Full control, including billing and deleting the workspace.",
  },
  ADMIN: {
    label: "Admin",
    description: "Manages members, settings and every business module.",
  },
  MANAGER: {
    label: "Manager",
    description: "Runs projects, finance and automations. Cannot manage members.",
  },
  MEMBER: {
    label: "Member",
    description: "Works with customers, leads, tasks and documents.",
  },
  VIEWER: {
    label: "Viewer",
    description: "Read-only access. Can ask the AI questions but not run actions.",
  },
};

export const PERMISSION_GROUPS: Array<{
  label: string;
  permissions: Array<{ key: Permission; label: string }>;
}> = [
  {
    label: "CRM",
    permissions: [
      { key: "customers:view", label: "View customers" },
      { key: "customers:create", label: "Create customers" },
      { key: "customers:update", label: "Update customers" },
      { key: "customers:delete", label: "Delete customers" },
      { key: "leads:manage", label: "Manage leads and deals" },
    ],
  },
  {
    label: "Work",
    permissions: [
      { key: "projects:manage", label: "Manage projects" },
      { key: "tasks:manage", label: "Manage tasks" },
      { key: "documents:manage", label: "Manage documents" },
    ],
  },
  {
    label: "Finance",
    permissions: [
      { key: "finance:view", label: "View finance" },
      { key: "invoices:create", label: "Create invoices" },
    ],
  },
  {
    label: "AI and automation",
    permissions: [
      { key: "ai:use", label: "Ask the AI agent" },
      { key: "ai:execute", label: "Approve AI actions" },
      { key: "automations:manage", label: "Create automations" },
    ],
  },
  {
    label: "Workspace",
    permissions: [
      { key: "members:invite", label: "Invite members" },
      { key: "members:manage", label: "Change roles and remove members" },
      { key: "workspace:update", label: "Change workspace settings" },
      { key: "billing:manage", label: "Manage billing" },
      { key: "audit:view", label: "View audit log" },
      { key: "workspace:delete", label: "Delete the workspace" },
    ],
  },
];
