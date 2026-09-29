import { describe, expect, it } from "vitest";

import { createWorkspaceSchema } from "@/modules/organizations/schemas";
import {
  isReservedSlug,
  slugify,
  validateSlug,
  withRandomSuffix,
} from "@/modules/organizations/slug";

describe("slugify", () => {
  it("turns names into url-safe slugs", () => {
    expect(slugify("Nova Digital Agency")).toBe("nova-digital-agency");
    expect(slugify("  Café & Co.  ")).toBe("cafe-and-co");
    expect(slugify("One---Wave__IT!!")).toBe("one-wave-it");
  });

  it("caps the length without leaving a trailing dash", () => {
    const slug = slugify("a".repeat(39) + " b");
    expect(slug.length).toBeLessThanOrEqual(40);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("validateSlug", () => {
  it("accepts well formed slugs", () => {
    expect(validateSlug("acme")).toBeNull();
    expect(validateSlug("acme-2")).toBeNull();
  });

  it("explains what is wrong", () => {
    expect(validateSlug("ab")).toMatch(/at least/);
    expect(validateSlug("-acme")).toMatch(/lowercase/);
    expect(validateSlug("Acme")).toMatch(/lowercase/);
    expect(validateSlug("ac--me")).toMatch(/double/);
    expect(validateSlug("settings")).toMatch(/reserved/);
  });

  it("reserves system words", () => {
    expect(isReservedSlug("api")).toBe(true);
    expect(isReservedSlug("nova")).toBe(false);
  });
});

describe("withRandomSuffix", () => {
  it("appends a four character suffix", () => {
    expect(withRandomSuffix("acme", () => 0)).toBe("acme-0000");
    expect(withRandomSuffix("x".repeat(40), () => 0.5)).toHaveLength(40);
  });
});

describe("createWorkspaceSchema", () => {
  it("normalises and validates input", () => {
    const parsed = createWorkspaceSchema.parse({ name: "  Nova  ", slug: " NOVA-agency " });
    expect(parsed).toEqual({ name: "Nova", slug: "nova-agency" });
  });

  it("rejects reserved slugs", () => {
    expect(createWorkspaceSchema.safeParse({ name: "Admin", slug: "admin" }).success).toBe(false);
  });
});
