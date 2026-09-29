import { describe, expect, it } from "vitest";

import { redact } from "@/lib/logging/logger";
import { generateToken, hashToken } from "@/lib/security/tokens";
import { formatRelativeTime, getInitials, safeRedirectPath } from "@/lib/utils";
import { describeUserAgent } from "@/modules/auth/user-agent";

describe("safeRedirectPath", () => {
  it("keeps same-site paths", () => {
    expect(safeRedirectPath("/w/acme/dashboard?tab=1")).toBe("/w/acme/dashboard?tab=1");
  });

  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
    "",
    null,
    undefined,
    "/ok\n",
  ])("falls back for %s", (value) => {
    expect(safeRedirectPath(value as string | null | undefined)).toBe("/dashboard");
  });
});

describe("tokens", () => {
  it("generates unique url-safe tokens", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("hashes deterministically", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
    expect(hashToken("abc")).toHaveLength(64);
  });
});

describe("getInitials", () => {
  it("uses the name, then the email", () => {
    expect(getInitials("Ehan Siddique")).toBe("ES");
    expect(getInitials("Madonna")).toBe("MA");
    expect(getInitials(null, "sara.khan@nova.co")).toBe("SK");
    expect(getInitials("", "")).toBe("?");
  });
});

describe("formatRelativeTime", () => {
  it("describes the distance in words", () => {
    const now = new Date("2026-05-01T12:00:00Z");
    expect(formatRelativeTime(new Date("2026-05-01T11:59:40Z"), now)).toBe("just now");
    expect(formatRelativeTime(new Date("2026-05-01T09:00:00Z"), now)).toBe("3 hours ago");
    expect(formatRelativeTime(new Date("2026-05-08T12:00:00Z"), now)).toBe("next week");
  });
});

describe("redact", () => {
  it("hides credentials anywhere in the log context", () => {
    expect(
      redact({
        idToken: "abc",
        user: { email: "a@b.co", password: "hunter2" },
        headers: { authorization: "Bearer x" },
      }),
    ).toEqual({
      idToken: "[redacted]",
      user: { email: "a@b.co", password: "[redacted]" },
      headers: { authorization: "[redacted]" },
    });
  });

  it("serialises errors", () => {
    expect(redact(new Error("boom"))).toMatchObject({ name: "Error", message: "boom" });
  });
});

describe("describeUserAgent", () => {
  it("recognises common browsers", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
      ),
    ).toEqual({ label: "Chrome on macOS", mobile: false });
    expect(
      describeUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
      ),
    ).toEqual({ label: "Safari on iOS", mobile: true });
    expect(describeUserAgent(null).label).toBe("Unknown device");
  });
});
