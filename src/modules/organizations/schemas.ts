import { z } from "zod";

import {
  BUSINESS_GOALS,
  COMPANY_SIZES,
  CURRENCIES,
  INDUSTRIES,
  isValidTimezone,
} from "@/config/workspace-options";
import { validateSlug } from "@/modules/organizations/slug";

const valuesOf = <T extends ReadonlyArray<{ value: string }>>(items: T) =>
  items.map((item) => item.value) as [T[number]["value"], ...Array<T[number]["value"]>];

export const workspaceNameSchema = z
  .string()
  .trim()
  .min(2, "Use at least 2 characters.")
  .max(60, "Use at most 60 characters.");

export const workspaceSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .superRefine((value, ctx) => {
    const problem = validateSlug(value);
    if (problem) ctx.addIssue({ code: "custom", message: problem });
  });

export const createWorkspaceSchema = z.object({
  name: workspaceNameSchema,
  slug: workspaceSlugSchema,
});
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// An empty string means "no website"; the server stores it as null.
const websiteField = z
  .string()
  .trim()
  .max(200, "Use at most 200 characters.")
  .refine(
    (value) => value === "" || isHttpUrl(value),
    "Enter a full URL, for example https://acme.com",
  );

export const businessProfileSchema = z.object({
  industry: z.enum(valuesOf(INDUSTRIES), { message: "Choose an industry." }),
  companySize: z.enum(valuesOf(COMPANY_SIZES), { message: "Choose a company size." }),
  currency: z.enum(valuesOf(CURRENCIES), { message: "Choose a currency." }),
  timezone: z.string().trim().refine(isValidTimezone, "Choose a valid time zone."),
  website: websiteField.optional(),
});
export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;

export const goalsSchema = z.object({
  goals: z
    .array(z.enum(valuesOf(BUSINESS_GOALS)))
    .max(BUSINESS_GOALS.length)
    .transform((goals) => Array.from(new Set(goals))),
});
export type GoalsInput = z.infer<typeof goalsSchema>;

export const workspaceGeneralSchema = z.object({
  name: workspaceNameSchema,
  slug: workspaceSlugSchema,
});
export type WorkspaceGeneralInput = z.infer<typeof workspaceGeneralSchema>;
