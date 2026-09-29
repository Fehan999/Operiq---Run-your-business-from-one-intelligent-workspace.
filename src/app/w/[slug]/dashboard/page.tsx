import type { Metadata } from "next";
import { Mail, ShieldCheck, Sparkles, Users } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { getPlan } from "@/config/plans";
import { ROLE_DETAILS } from "@/lib/authorization/permissions";
import { listRecentActivity } from "@/modules/activity/service";
import { ActivityFeed } from "@/modules/dashboard/components/activity-feed";
import { InsightsCard } from "@/modules/dashboard/components/insights-card";
import { RoadmapCard } from "@/modules/dashboard/components/roadmap-card";
import { SetupChecklist } from "@/modules/dashboard/components/setup-checklist";
import { StatCard } from "@/modules/dashboard/components/stat-card";
import {
  buildSetupChecklist,
  buildWorkspaceInsights,
  greetingForHour,
  hourInTimezone,
} from "@/modules/dashboard/insights";
import { getMemberCounts } from "@/modules/members/service";
import { getWorkspaceContext } from "@/modules/organizations/context";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ params }: PageProps<"/w/[slug]/dashboard">) {
  const { slug } = await params;
  const { organization, user, role, can } = await getWorkspaceContext(slug);
  const basePath = `/w/${organization.slug}`;
  const now = new Date();

  const [counts, activity] = await Promise.all([
    getMemberCounts(organization.id, now),
    listRecentActivity(organization.id),
  ]);
  const expiringSoon = counts.invitationsExpiringSoon;

  const plan = getPlan(organization.plan);
  const snapshot = {
    memberCount: counts.members,
    pendingInvitations: counts.pendingInvitations,
    seatLimit: plan.limits.members,
    invitationsExpiringSoon: expiringSoon,
    hasBusinessDetails: Boolean(organization.industry && organization.companySize),
    hasLogo: Boolean(organization.logoUrl),
  };
  const checklist = buildSetupChecklist(
    { ...snapshot, hasGoals: organization.goals.length > 0 },
    basePath,
  );
  const insights = buildWorkspaceInsights(snapshot, basePath);
  const showChecklist = can("workspace:update") && checklist.some((item) => !item.done);

  const greeting = greetingForHour(hourInTimezone(now, organization.timezone));
  const firstName = user.name?.split(" ")[0];
  const today = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: organization.timezone,
  }).format(now);

  return (
    <div className="grid gap-6">
      <PageHeader
        title={`${greeting}${firstName ? `, ${firstName}` : ""}`}
        description={`${today} · ${organization.name}`}
      />

      <section
        aria-label="Workspace summary"
        className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
      >
        <StatCard
          label="Team members"
          value={counts.members}
          hint={`${counts.members + counts.pendingInvitations} of ${plan.limits.members} seats used`}
          icon={Users}
        />
        <StatCard
          label="Pending invitations"
          value={counts.pendingInvitations}
          hint={expiringSoon > 0 ? `${expiringSoon} expiring soon` : "Invitations last 7 days"}
          icon={Mail}
        />
        <StatCard label="Plan" value={plan.name} hint={plan.description} icon={Sparkles} />
        <StatCard
          label="Your role"
          value={ROLE_DETAILS[role].label}
          hint={ROLE_DETAILS[role].description}
          icon={ShieldCheck}
        />
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="grid gap-6">
          <ActivityFeed items={activity} />
          <RoadmapCard />
        </div>
        <div className="order-first grid gap-6 lg:order-none">
          {showChecklist ? <SetupChecklist items={checklist} /> : null}
          <InsightsCard insights={insights} />
        </div>
      </div>
    </div>
  );
}
