import { describe, expect, it } from "vitest";

import { describeActivity } from "@/modules/activity/describe";
import { diffChanges } from "@/modules/audit/diff";
import { AUDIT_EVENTS, describeAuditAction } from "@/modules/audit/events";

describe("diffChanges", () => {
  const before = { name: "Acme", currency: "USD", timezone: "UTC", website: null as string | null };

  it("returns only the fields that changed", () => {
    expect(
      diffChanges(before, { name: "Acme Ltd", currency: "USD" }, ["name", "currency"]),
    ).toEqual({
      before: { name: "Acme" },
      after: { name: "Acme Ltd" },
    });
  });

  it("returns null when nothing changed", () => {
    expect(diffChanges(before, { name: "Acme" }, ["name", "currency"])).toBeNull();
  });

  it("ignores fields that were not submitted and treats undefined as null", () => {
    expect(diffChanges(before, { website: undefined }, ["website", "timezone"])).toBeNull();
  });

  it("compares arrays and dates by value", () => {
    expect(diffChanges({ goals: ["a"] }, { goals: ["a"] }, ["goals"])).toBeNull();
    const at = new Date("2026-01-01T00:00:00Z");
    expect(diffChanges({ at }, { at: new Date(at) }, ["at"])).toBeNull();
  });
});

describe("audit events", () => {
  it("has a readable label for every action", () => {
    for (const [action, label] of Object.entries(AUDIT_EVENTS)) {
      expect(describeAuditAction(action)).toBe(label);
    }
    expect(describeAuditAction("unknown.action")).toBe("unknown.action");
  });
});

describe("describeActivity", () => {
  it("writes readable sentences", () => {
    expect(describeActivity("member.invited", { email: "sara@nova.co", role: "MANAGER" })).toBe(
      "invited sara@nova.co as Manager",
    );
    expect(describeActivity("member.role_changed", { from: "MEMBER", to: "ADMIN" })).toBe(
      "changed a member's role from Member to Admin",
    );
    expect(describeActivity("workspace.created", { name: "Nova" })).toBe(
      "created the workspace Nova",
    );
  });

  it("copes with missing or odd data", () => {
    expect(describeActivity("member.invited", null)).toBe("invited someone as a new role");
    expect(describeActivity("something.new", {})).toBe("made a change");
  });
});
