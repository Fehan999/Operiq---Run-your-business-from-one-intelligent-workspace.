/*
 * Every audit action the app can record. Keeping them in one union stops typos from
 * creating new, unsearchable action names, and gives the audit log UI readable labels.
 */
export const AUDIT_EVENTS = {
  "auth.signed_in": "Signed in",
  "auth.signed_out": "Signed out",
  "auth.session_revoked": "Revoked a session",
  "profile.updated": "Updated their profile",
  "workspace.created": "Created the workspace",
  "workspace.updated": "Updated workspace settings",
  "workspace.logo_updated": "Changed the workspace logo",
  "workspace.onboarding_completed": "Finished workspace setup",
  "invitation.created": "Invited a member",
  "invitation.revoked": "Revoked an invitation",
  "invitation.accepted": "Accepted an invitation",
  "member.role_changed": "Changed a member's role",
  "member.removed": "Removed a member",
  "member.left": "Left the workspace",
} as const;

export type AuditAction = keyof typeof AUDIT_EVENTS;

export function describeAuditAction(action: string): string {
  return (AUDIT_EVENTS as Record<string, string>)[action] ?? action;
}
