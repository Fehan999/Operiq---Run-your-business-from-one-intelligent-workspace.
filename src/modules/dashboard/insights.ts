/*
 * Rule-based insights computed from real workspace numbers. Every statement here can be
 * traced back to a count in the database, which is the same standard the AI agent will
 * be held to: facts first, interpretation clearly labelled.
 */

export interface WorkspaceSnapshot {
  memberCount: number;
  seatLimit: number;
  pendingInvitations: number;
  invitationsExpiringSoon: number;
  hasBusinessDetails: boolean;
  hasLogo: boolean;
}

export interface Insight {
  id: string;
  tone: "info" | "warning" | "success";
  title: string;
  detail: string;
  href?: string;
}

export function buildWorkspaceInsights(snapshot: WorkspaceSnapshot, basePath: string): Insight[] {
  const insights: Insight[] = [];
  const seatsUsed = snapshot.memberCount + snapshot.pendingInvitations;

  if (snapshot.invitationsExpiringSoon > 0) {
    const count = snapshot.invitationsExpiringSoon;
    insights.push({
      id: "invitations-expiring",
      tone: "warning",
      title: `${count} ${count === 1 ? "invitation expires" : "invitations expire"} within 2 days`,
      detail: "Resend them so your teammates can still join.",
      href: `${basePath}/settings/members`,
    });
  }

  if (snapshot.seatLimit > 0 && seatsUsed / snapshot.seatLimit >= 0.8) {
    insights.push({
      id: "seats",
      tone: "warning",
      title: `${seatsUsed} of ${snapshot.seatLimit} seats in use`,
      detail: "Pending invitations count toward your plan's seats.",
      href: `${basePath}/settings/billing`,
    });
  }

  if (snapshot.memberCount === 1 && snapshot.pendingInvitations === 0) {
    insights.push({
      id: "solo",
      tone: "info",
      title: "You're the only person in this workspace",
      detail: "Invite teammates to assign work and share customer history.",
      href: `${basePath}/settings/members?invite=1`,
    });
  }

  if (!snapshot.hasBusinessDetails) {
    insights.push({
      id: "business-details",
      tone: "info",
      title: "Business details are missing",
      detail: "Currency and time zone are used by invoices, reports and reminders.",
      href: `${basePath}/settings/workspace`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "all-good",
      tone: "success",
      title: "Everything looks good",
      detail: "Nothing in this workspace needs your attention right now.",
    });
  }

  return insights;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  href: string;
}

export function buildSetupChecklist(
  snapshot: WorkspaceSnapshot & { hasGoals: boolean },
  basePath: string,
): ChecklistItem[] {
  return [
    {
      id: "workspace",
      label: "Create your workspace",
      done: true,
      href: `${basePath}/settings/workspace`,
    },
    {
      id: "details",
      label: "Add business details",
      done: snapshot.hasBusinessDetails,
      href: `${basePath}/settings/workspace`,
    },
    {
      id: "logo",
      label: "Upload your logo",
      done: snapshot.hasLogo,
      href: `${basePath}/settings/workspace`,
    },
    {
      id: "goals",
      label: "Choose your goals",
      done: snapshot.hasGoals,
      href: `${basePath}/settings/workspace#goals`,
    },
    {
      id: "team",
      label: "Invite your team",
      done: snapshot.memberCount > 1 || snapshot.pendingInvitations > 0,
      href: `${basePath}/settings/members?invite=1`,
    },
  ];
}

export function greetingForHour(hour: number): string {
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function hourInTimezone(date: Date, timeZone: string): number {
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone,
    }).format(date);
    return Number.parseInt(formatted, 10) % 24;
  } catch {
    return date.getUTCHours();
  }
}
