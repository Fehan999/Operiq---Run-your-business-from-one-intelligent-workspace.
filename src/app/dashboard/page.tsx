import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireVerifiedUser } from "@/modules/auth/session";
import { keyForStep } from "@/modules/onboarding/steps";
import { listUserWorkspaces } from "@/modules/organizations/service";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Entry point after sign-in. Picks the workspace to open: the last one used if the
 * user is still a member, otherwise the first one. Owners of a half set up workspace
 * are sent back into setup.
 */
export default async function DashboardRedirectPage() {
  const user = await requireVerifiedUser();
  const workspaces = await listUserWorkspaces(user.id);

  if (workspaces.length === 0) redirect("/onboarding");

  const target =
    workspaces.find((workspace) => workspace.id === user.lastOrganizationId) ?? workspaces[0]!;

  if (!target.onboardingCompletedAt && target.role === "OWNER") {
    const step = keyForStep(target.onboardingStep);
    if (step) redirect(`/onboarding/${target.slug}/${step}`);
  }

  redirect(`/w/${target.slug}/dashboard`);
}
