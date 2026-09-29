import { describe, expect, it } from "vitest";

import {
  hasPermission,
  isRole,
  PERMISSION_GROUPS,
  PERMISSIONS,
  permissionsFor,
  ROLES,
  type Permission,
} from "@/lib/authorization/permissions";

describe("role permissions", () => {
  it("gives owners every permission", () => {
    for (const permission of PERMISSIONS) {
      expect(hasPermission("OWNER", permission)).toBe(true);
    }
  });

  it("keeps billing and workspace deletion owner-only", () => {
    for (const role of ROLES.filter((role) => role !== "OWNER")) {
      expect(hasPermission(role, "billing:manage")).toBe(false);
      expect(hasPermission(role, "workspace:delete")).toBe(false);
    }
  });

  it("lets admins manage people and settings", () => {
    const adminOnly: Permission[] = [
      "members:invite",
      "members:manage",
      "workspace:update",
      "audit:view",
    ];
    for (const permission of adminOnly) {
      expect(hasPermission("ADMIN", permission)).toBe(true);
      expect(hasPermission("MANAGER", permission)).toBe(false);
      expect(hasPermission("MEMBER", permission)).toBe(false);
    }
  });

  it("gives viewers read access and AI questions, but no actions", () => {
    expect(permissionsFor("VIEWER")).toEqual(["customers:view", "ai:use"]);
    expect(hasPermission("VIEWER", "ai:execute")).toBe(false);
  });

  it("keeps finance away from regular members", () => {
    expect(hasPermission("MEMBER", "finance:view")).toBe(false);
    expect(hasPermission("MANAGER", "finance:view")).toBe(true);
  });

  it("never grants a lower role something a higher role lacks", () => {
    for (const permission of PERMISSIONS) {
      for (let index = 1; index < ROLES.length; index++) {
        const higher = ROLES[index - 1]!;
        const lower = ROLES[index]!;
        if (hasPermission(lower, permission)) {
          expect(hasPermission(higher, permission), `${higher} should have ${permission}`).toBe(
            true,
          );
        }
      }
    }
  });

  it("documents every permission in the roles matrix", () => {
    const documented = PERMISSION_GROUPS.flatMap((group) =>
      group.permissions.map((item) => item.key),
    );
    expect([...documented].sort()).toEqual([...PERMISSIONS].sort());
  });

  it("recognises valid roles only", () => {
    expect(isRole("ADMIN")).toBe(true);
    expect(isRole("admin")).toBe(false);
    expect(isRole("SUPERUSER")).toBe(false);
    expect(isRole(undefined)).toBe(false);
  });
});
