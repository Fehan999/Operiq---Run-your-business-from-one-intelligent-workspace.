import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { assignableRoles } from "@/modules/members/policy";
import { InviteMembersForm } from "@/modules/invitations/components/invite-members-form";
import { GoalsForm } from "@/modules/onboarding/components/goals-form";
import { OnboardingProgress } from "@/modules/onboarding/components/onboarding-progress";
import { StepActions } from "@/modules/onboarding/components/step-actions";
import { StepTransition } from "@/modules/onboarding/components/step-transition";
import { isOnboardingStepKey, ONBOARDING_STEPS, stepForKey } from "@/modules/onboarding/steps";
import { BusinessProfileForm } from "@/modules/organizations/components/business-profile-form";
import { WorkspaceLogoUpload } from "@/modules/organizations/components/workspace-logo-upload";
import { getWorkspaceContext } from "@/modules/organizations/context";

export default async function OnboardingStepPage({
  params,
}: PageProps<"/onboarding/[slug]/[step]">) {
  const { slug, step: stepKey } = await params;
  if (!isOnboardingStepKey(stepKey)) notFound();

  const context = await getWorkspaceContext(slug);
  const { organization } = context;

  // Setup is for people who can change workspace settings; everyone else goes straight in.
  if (!context.can("workspace:update") || organization.onboardingCompletedAt) {
    redirect(`/w/${organization.slug}/dashboard`);
  }

  const step = stepForKey(stepKey);
  const previous = step.index > 0 ? ONBOARDING_STEPS[step.index - 1] : null;

  return (
    <div className="grid gap-8">
      <OnboardingProgress currentIndex={step.index} />

      <StepTransition stepKey={stepKey}>
        <div className="grid gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{step.title}</h1>
          <p className="text-muted-foreground">{step.description}</p>
        </div>

        <section className="mt-6 rounded-xl border bg-card p-6 shadow-xs">
          {stepKey === "business" ? (
            <BusinessProfileForm
              slug={organization.slug}
              mode="onboarding"
              defaults={{
                industry: organization.industry,
                companySize: organization.companySize,
                currency: organization.currency,
                timezone: organization.timezone,
                website: organization.website,
              }}
            />
          ) : null}

          {stepKey === "brand" ? (
            <div className="grid gap-6">
              <WorkspaceLogoUpload
                slug={organization.slug}
                name={organization.name}
                logoUrl={organization.logoUrl}
              />
              <StepActions slug={organization.slug} stepKey="brand" variant="continue" />
            </div>
          ) : null}

          {stepKey === "goals" ? (
            <GoalsForm
              slug={organization.slug}
              initialGoals={organization.goals}
              mode="onboarding"
            />
          ) : null}

          {stepKey === "team" ? (
            <div className="grid gap-6">
              <InviteMembersForm
                slug={organization.slug}
                assignableRoles={assignableRoles(context.role)}
                submitLabel="Invite"
              />
              <div className="border-t pt-5">
                <StepActions slug={organization.slug} stepKey="team" variant="finish" />
              </div>
            </div>
          ) : null}
        </section>
      </StepTransition>

      {previous ? (
        <Link
          href={`/onboarding/${organization.slug}/${previous.key}`}
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </Link>
      ) : null}
    </div>
  );
}
