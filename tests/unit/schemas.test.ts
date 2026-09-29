import { describe, expect, it } from "vitest";

import { toActionFailure, AppError } from "@/lib/errors";
import {
  loginSchema,
  passwordStrength,
  registerSchema,
  resetPasswordSchema,
} from "@/modules/auth/schemas";
import { inviteMembersSchema, parseEmailList } from "@/modules/invitations/schemas";
import { businessProfileSchema, goalsSchema } from "@/modules/organizations/schemas";

describe("auth schemas", () => {
  it("normalises email addresses", () => {
    expect(loginSchema.parse({ email: "  Jane@Example.COM ", password: "x" }).email).toBe(
      "jane@example.com",
    );
  });

  it("requires passwords with a letter and a number", () => {
    const base = { name: "Jane", email: "jane@example.com" };
    expect(registerSchema.safeParse({ ...base, password: "short1" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: "onlyletters" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: "letters123" }).success).toBe(true);
  });

  it("checks that the confirmation matches", () => {
    const result = resetPasswordSchema.safeParse({
      password: "letters123",
      confirmPassword: "letters124",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });

  it("scores password strength", () => {
    expect(passwordStrength("")).toBe(0);
    expect(passwordStrength("abcdefgh")).toBe(1);
    expect(passwordStrength("Abcdefgh1234!")).toBe(4);
  });
});

describe("business profile schema", () => {
  const valid = {
    industry: "agency",
    companySize: "SIZE_2_10",
    currency: "BDT",
    timezone: "Asia/Dhaka",
  };

  it("accepts known values", () => {
    expect(businessProfileSchema.safeParse({ ...valid, website: "https://nova.co" }).success).toBe(
      true,
    );
    expect(businessProfileSchema.safeParse({ ...valid, website: "" }).success).toBe(true);
  });

  it("rejects unknown options, bad time zones and non-http links", () => {
    expect(businessProfileSchema.safeParse({ ...valid, industry: "casino" }).success).toBe(false);
    expect(businessProfileSchema.safeParse({ ...valid, timezone: "Mars/Olympus" }).success).toBe(
      false,
    );
    expect(
      businessProfileSchema.safeParse({ ...valid, website: "javascript:alert(1)" }).success,
    ).toBe(false);
  });

  it("de-duplicates goals", () => {
    expect(goalsSchema.parse({ goals: ["use-ai", "use-ai", "win-more-deals"] }).goals).toEqual([
      "use-ai",
      "win-more-deals",
    ]);
  });
});

describe("invitations schema", () => {
  it("limits batch size and validates each row", () => {
    const invites = Array.from({ length: 11 }, (_, i) => ({ email: `p${i}@x.co`, role: "MEMBER" }));
    expect(inviteMembersSchema.safeParse({ invites }).success).toBe(false);
    expect(
      inviteMembersSchema.safeParse({ invites: [{ email: "bad", role: "MEMBER" }] }).success,
    ).toBe(false);
    expect(
      inviteMembersSchema.safeParse({ invites: [{ email: "a@x.co", role: "GOD" }] }).success,
    ).toBe(false);
  });

  it("parses pasted email lists", () => {
    expect(parseEmailList("A@x.co, b@y.co\nc@z.co; a@x.co")).toEqual([
      "a@x.co",
      "b@y.co",
      "c@z.co",
    ]);
  });
});

describe("toActionFailure", () => {
  it("keeps safe messages and hides unknown errors", () => {
    expect(toActionFailure(new AppError("FORBIDDEN"))).toMatchObject({
      code: "FORBIDDEN",
      ok: false,
    });
    const hidden = toActionFailure(new Error("connection string postgres://secret"));
    expect(hidden.code).toBe("INTERNAL");
    expect(hidden.error).not.toContain("secret");
  });

  it("turns zod errors into field errors", () => {
    const result = loginSchema.safeParse({ email: "nope", password: "" });
    const failure = toActionFailure(result.error);
    expect(failure.code).toBe("VALIDATION");
    expect(Object.keys(failure.fieldErrors ?? {})).toEqual(["email", "password"]);
  });
});
