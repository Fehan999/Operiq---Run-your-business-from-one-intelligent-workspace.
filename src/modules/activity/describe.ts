import { ROLE_DETAILS, isRole } from "@/lib/authorization/permissions";

type ActivityData = Record<string, unknown> | null | undefined;

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function roleLabel(value: unknown): string {
  return isRole(value) ? ROLE_DETAILS[value].label : "a new role";
}

/** Turns a stored activity row into the sentence shown in feeds, after the actor's name. */
export function describeActivity(type: string, data: ActivityData): string {
  const payload = (data ?? {}) as Record<string, unknown>;

  switch (type) {
    case "workspace.created":
      return text(payload.name) ? `created the workspace ${payload.name}` : "created the workspace";
    case "workspace.updated":
      return "updated the workspace settings";
    case "member.invited":
      return `invited ${text(payload.email) ?? "someone"} as ${roleLabel(payload.role)}`;
    case "member.joined":
      return "joined the workspace";
    case "member.left":
      return "left the workspace";
    case "member.removed":
      return `removed ${text(payload.email) ?? "a member"} from the workspace`;
    case "member.role_changed":
      return `changed a member's role from ${roleLabel(payload.from)} to ${roleLabel(payload.to)}`;
    default:
      return "made a change";
  }
}
