import type { Metadata } from "next";
import { Check } from "lucide-react";

import { ForbiddenState } from "@/components/shared/forbidden-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLANS, type FeatureKey, type LimitKey } from "@/config/plans";
import type { Plan } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { getMemberCounts } from "@/modules/members/service";
import { getWorkspaceContext } from "@/modules/organizations/context";
import { SettingsSection } from "@/modules/settings/components/settings-section";

export const metadata: Metadata = { title: "Billing" };

const LIMIT_LABELS: Record<LimitKey, string> = {
  members: "Team seats",
  customers: "Customers",
  aiRequestsPerMonth: "AI requests / month",
  storageMb: "Storage (MB)",
  automations: "Automations",
};

const FEATURE_LABELS: Record<FeatureKey, string> = {
  aiAgent: "AI business agent",
  documentAi: "Document AI and search",
  automations: "Workflow automations",
  advancedAnalytics: "Advanced analytics",
  auditLog: "Audit log",
  integrations: "Integrations",
};

const numberFormat = new Intl.NumberFormat("en");

export default async function BillingSettingsPage({
  params,
}: PageProps<"/w/[slug]/settings/billing">) {
  const { slug } = await params;
  const context = await getWorkspaceContext(slug);
  if (!context.can("workspace:update")) return <ForbiddenState />;

  const { organization } = context;
  const counts = await getMemberCounts(organization.id);
  const current = PLANS[organization.plan];
  const seatsUsed = counts.members + counts.pendingInvitations;
  const seatPercent = Math.min(100, Math.round((seatsUsed / current.limits.members) * 100));

  return (
    <div className="grid gap-6">
      <SettingsSection
        title="Current plan"
        description="Plans and limits are managed centrally and checked on the server."
      >
        <div className="grid gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-lg font-semibold">{current.name}</p>
            <p className="text-sm text-muted-foreground">{current.description}</p>
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between text-sm">
              <span>Seats</span>
              <span className="text-muted-foreground tabular-nums">
                {seatsUsed} / {current.limits.members}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label="Seats used"
              aria-valuenow={seatPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={cn(
                  "h-full rounded-full",
                  seatPercent >= 90 ? "bg-warning" : "bg-primary",
                )}
                style={{ width: `${seatPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Pending invitations count as seats.</p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Plans"
        description="Paid plans arrive with subscriptions. Pricing is shown for reference."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {(Object.keys(PLANS) as Plan[]).map((key) => {
            const plan = PLANS[key];
            const isCurrent = key === organization.plan;
            return (
              <div
                key={key}
                className={cn(
                  "grid content-start gap-4 rounded-xl border p-4",
                  isCurrent && "border-primary",
                )}
              >
                <div className="grid gap-1">
                  <p className="flex items-center gap-2 font-semibold">
                    {plan.name}
                    {isCurrent ? <Badge variant="secondary">Current</Badge> : null}
                  </p>
                  <p className="text-2xl font-semibold tabular-nums">
                    ${plan.priceMonthly}
                    <span className="text-sm font-normal text-muted-foreground"> / month</span>
                  </p>
                </div>
                <ul className="grid gap-1.5 text-sm">
                  {(Object.keys(plan.limits) as LimitKey[]).map((limit) => (
                    <li key={limit} className="flex justify-between gap-2">
                      <span className="text-muted-foreground">{LIMIT_LABELS[limit]}</span>
                      <span className="tabular-nums">
                        {numberFormat.format(plan.limits[limit])}
                      </span>
                    </li>
                  ))}
                </ul>
                <ul className="grid gap-1.5 border-t pt-3 text-sm">
                  {(Object.keys(plan.features) as FeatureKey[])
                    .filter((feature) => plan.features[feature])
                    .map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="size-4 text-primary" aria-hidden />
                        {FEATURE_LABELS[feature]}
                      </li>
                    ))}
                </ul>
                <Button variant={isCurrent ? "outline" : "default"} disabled>
                  {isCurrent ? "Your plan" : "Upgrades coming soon"}
                </Button>
              </div>
            );
          })}
        </div>
      </SettingsSection>
    </div>
  );
}
