import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { publicEnv } from "@/config/public-env";
import { LeaveWorkspaceButton } from "@/modules/members/components/leave-workspace-button";
import { canLeaveWorkspace } from "@/modules/members/policy";
import { getOwnerCount } from "@/modules/members/service";
import { GoalsForm } from "@/modules/onboarding/components/goals-form";
import { BusinessProfileForm } from "@/modules/organizations/components/business-profile-form";
import { WorkspaceGeneralForm } from "@/modules/organizations/components/workspace-general-form";
import { WorkspaceLogoUpload } from "@/modules/organizations/components/workspace-logo-upload";
import { getWorkspaceContext } from "@/modules/organizations/context";
import { SettingsSection } from "@/modules/settings/components/settings-section";

export const metadata: Metadata = { title: "Workspace settings" };

export default async function WorkspaceSettingsPage({
  params,
}: PageProps<"/w/[slug]/settings/workspace">) {
  const { slug } = await params;
  const context = await getWorkspaceContext(slug);
  const { organization, user, role } = context;
  const canEdit = context.can("workspace:update");

  const ownerCount = await getOwnerCount(organization.id);
  const leave = canLeaveWorkspace({ userId: user.id, role }, ownerCount);

  return (
    <div className="grid gap-6">
      {!canEdit ? (
        <Alert variant="info">
          <AlertDescription>
            You can view these settings. Only owners and admins can change them.
          </AlertDescription>
        </Alert>
      ) : null}

      <SettingsSection title="General" description="How this workspace is named and addressed.">
        <WorkspaceGeneralForm
          slug={organization.slug}
          urlPrefix={`${new URL(publicEnv.appUrl).host}/w/`}
          defaults={{ name: organization.name, slug: organization.slug }}
          disabled={!canEdit}
        />
      </SettingsSection>

      <SettingsSection
        title="Logo"
        description="Shown in the sidebar, on invoices and on client-facing pages."
      >
        <WorkspaceLogoUpload
          slug={organization.slug}
          name={organization.name}
          logoUrl={organization.logoUrl}
          disabled={!canEdit}
        />
      </SettingsSection>

      <SettingsSection
        title="Business details"
        description="Used for invoice defaults, reports and scheduling."
      >
        <BusinessProfileForm
          slug={organization.slug}
          mode="settings"
          disabled={!canEdit}
          defaults={{
            industry: organization.industry,
            companySize: organization.companySize,
            currency: organization.currency,
            timezone: organization.timezone,
            website: organization.website,
          }}
        />
      </SettingsSection>

      {canEdit ? (
        <SettingsSection
          id="goals"
          title="Goals"
          description="What Operiq should focus on for this workspace."
        >
          <GoalsForm slug={organization.slug} initialGoals={organization.goals} mode="settings" />
        </SettingsSection>
      ) : null}

      <SettingsSection
        title="Leave workspace"
        description="Remove yourself from this workspace. Your account stays active."
        className="border-destructive/30"
      >
        <LeaveWorkspaceButton
          slug={organization.slug}
          workspaceName={organization.name}
          blockedReason={leave.allowed ? undefined : leave.reason}
        />
      </SettingsSection>
    </div>
  );
}
