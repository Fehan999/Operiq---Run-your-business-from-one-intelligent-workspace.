import { describe, expect, it } from "vitest";

import {
  buildSetupChecklist,
  buildWorkspaceInsights,
  greetingForHour,
  hourInTimezone,
  type WorkspaceSnapshot,
} from "@/modules/dashboard/insights";

const base: WorkspaceSnapshot = {
  memberCount: 3,
  seatLimit: 15,
  pendingInvitations: 0,
  invitationsExpiringSoon: 0,
  hasBusinessDetails: true,
  hasLogo: true,
};

describe("buildWorkspaceInsights", () => {
  it("reports nothing to do for a healthy workspace", () => {
    const insights = buildWorkspaceInsights(base, "/w/acme");
    expect(insights.map((insight) => insight.id)).toEqual(["all-good"]);
  });

  it("flags invitations that are about to expire, with correct plural", () => {
    const one = buildWorkspaceInsights(
      { ...base, pendingInvitations: 1, invitationsExpiringSoon: 1 },
      "/w/acme",
    );
    expect(one[0]!.title).toBe("1 invitation expires within 2 days");
    const two = buildWorkspaceInsights(
      { ...base, pendingInvitations: 2, invitationsExpiringSoon: 2 },
      "/w/acme",
    );
    expect(two[0]!.title).toBe("2 invitations expire within 2 days");
  });

  it("warns when seats are nearly used, counting pending invitations", () => {
    const insights = buildWorkspaceInsights(
      { ...base, seatLimit: 3, memberCount: 2, pendingInvitations: 1 },
      "/w/acme",
    );
    expect(insights.find((insight) => insight.id === "seats")?.title).toBe("3 of 3 seats in use");
  });

  it("nudges a solo owner and missing business details", () => {
    const ids = buildWorkspaceInsights(
      { ...base, memberCount: 1, hasBusinessDetails: false },
      "/w/acme",
    ).map((insight) => insight.id);
    expect(ids).toEqual(expect.arrayContaining(["solo", "business-details"]));
    expect(ids).not.toContain("all-good");
  });

  it("links into the right workspace", () => {
    const [insight] = buildWorkspaceInsights({ ...base, hasBusinessDetails: false }, "/w/nova");
    expect(insight!.href).toBe("/w/nova/settings/workspace");
  });
});

describe("buildSetupChecklist", () => {
  it("counts a pending invitation as inviting the team", () => {
    const list = buildSetupChecklist(
      { ...base, memberCount: 1, pendingInvitations: 1, hasGoals: false },
      "/w/a",
    );
    expect(list.find((item) => item.id === "team")?.done).toBe(true);
    expect(list.find((item) => item.id === "goals")?.done).toBe(false);
  });
});

describe("greetings", () => {
  it("picks a greeting for the hour", () => {
    expect(greetingForHour(3)).toBe("Good evening");
    expect(greetingForHour(9)).toBe("Good morning");
    expect(greetingForHour(14)).toBe("Good afternoon");
    expect(greetingForHour(20)).toBe("Good evening");
  });

  it("uses the workspace time zone", () => {
    const date = new Date("2026-01-15T12:00:00Z");
    expect(hourInTimezone(date, "UTC")).toBe(12);
    expect(hourInTimezone(date, "Asia/Dhaka")).toBe(18);
    expect(hourInTimezone(date, "Not/AZone")).toBe(12);
  });
});
