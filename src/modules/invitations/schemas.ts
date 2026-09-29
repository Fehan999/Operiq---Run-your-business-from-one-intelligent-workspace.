import { z } from "zod";

import { ROLES } from "@/lib/authorization/permissions";

export const MAX_INVITES_PER_REQUEST = 10;

export const inviteEntrySchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  role: z.enum(ROLES, { message: "Choose a role." }),
});

export const inviteMembersSchema = z.object({
  invites: z
    .array(inviteEntrySchema)
    .min(1, "Add at least one email address.")
    .max(
      MAX_INVITES_PER_REQUEST,
      `You can invite up to ${MAX_INVITES_PER_REQUEST} people at once.`,
    ),
});

export type InviteMembersInput = z.input<typeof inviteMembersSchema>;
export type InviteEntry = z.infer<typeof inviteEntrySchema>;

/** Splits a pasted list ("a@x.com, b@y.com\nc@z.com") into unique, trimmed addresses. */
export function parseEmailList(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\s,;]+/)
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}
