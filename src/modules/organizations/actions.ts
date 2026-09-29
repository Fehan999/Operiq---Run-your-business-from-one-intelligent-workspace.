"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { runAction } from "@/lib/actions";
import { AppError, type ActionResult } from "@/lib/errors";
import { validateImageUpload } from "@/lib/storage/image-validation";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { requireVerifiedUser } from "@/modules/auth/session";
import { isOnboardingStepKey, nextStep, stepForKey, keyForStep } from "@/modules/onboarding/steps";
import { requireWorkspaceAction } from "@/modules/organizations/context";
import {
  businessProfileSchema,
  createWorkspaceSchema,
  goalsSchema,
  workspaceGeneralSchema,
  type BusinessProfileInput,
  type CreateWorkspaceInput,
  type WorkspaceGeneralInput,
} from "@/modules/organizations/schemas";
import {
  advanceOnboarding,
  completeOnboarding,
  createWorkspace,
  isSlugAvailable,
  setWorkspaceLogo,
  suggestSlug,
  updateBusinessProfile,
  updateGoals,
  updateWorkspaceGeneral,
} from "@/modules/organizations/service";
import { slugify, validateSlug } from "@/modules/organizations/slug";

const slugParam = z.string().min(1).max(64);

function onboardingPath(slug: string, stepKey: string | null) {
  return stepKey ? `/onboarding/${slug}/${stepKey}` : `/w/${slug}/dashboard`;
}

export async function checkSlugAction(
  slug: string,
): Promise<ActionResult<{ available: boolean; reason?: string }>> {
  return runAction("workspace.checkSlug", async () => {
    await requireVerifiedUser();
    const value = slugify(z.string().max(80).parse(slug));
    const problem = validateSlug(value);
    if (problem) return { available: false, reason: problem };
    const available = await isSlugAvailable(value);
    return { available, reason: available ? undefined : "That address is already taken." };
  });
}

export async function suggestSlugAction(name: string): Promise<ActionResult<{ slug: string }>> {
  return runAction("workspace.suggestSlug", async () => {
    await requireVerifiedUser();
    return { slug: await suggestSlug(z.string().max(80).parse(name)) };
  });
}

export async function createWorkspaceAction(
  input: CreateWorkspaceInput,
): Promise<ActionResult<{ redirectTo: string }>> {
  return runAction("workspace.create", async () => {
    const user = await requireVerifiedUser();
    const limit = await rateLimit(`create-workspace:${user.id}`, RATE_LIMITS.sensitive);
    if (!limit.success) throw new AppError("RATE_LIMITED");

    const data = createWorkspaceSchema.parse(input);
    const organization = await createWorkspace(user, data);
    return { redirectTo: onboardingPath(organization.slug, "business") };
  });
}

const onboardingFlag = z.boolean().optional();

export async function saveBusinessProfileAction(
  slug: string,
  input: BusinessProfileInput,
  options?: { onboarding?: boolean },
): Promise<ActionResult<{ redirectTo?: string }>> {
  return runAction(
    "workspace.saveBusinessProfile",
    async () => {
      const context = await requireWorkspaceAction(slugParam.parse(slug), "workspace:update");
      const data = businessProfileSchema.parse(input);
      const onboarding = onboardingFlag.parse(options?.onboarding);

      await updateBusinessProfile(
        context,
        { ...data, website: data.website ? data.website : null },
        onboarding ? { advanceTo: "BRAND" } : {},
      );
      revalidatePath(`/w/${context.organization.slug}`, "layout");
      return {
        redirectTo: onboarding ? onboardingPath(context.organization.slug, "brand") : undefined,
      };
    },
    { successMessage: "Business details saved." },
  );
}

export async function updateWorkspaceGeneralAction(
  slug: string,
  input: WorkspaceGeneralInput,
): Promise<ActionResult<{ slug: string }>> {
  return runAction(
    "workspace.updateGeneral",
    async () => {
      const context = await requireWorkspaceAction(slugParam.parse(slug), "workspace:update");
      const data = workspaceGeneralSchema.parse(input);
      const updated = await updateWorkspaceGeneral(context, data);
      revalidatePath(`/w/${updated.slug}`, "layout");
      return { slug: updated.slug };
    },
    { successMessage: "Workspace updated." },
  );
}

export async function saveGoalsAction(
  slug: string,
  input: { goals: string[] },
  options?: { onboarding?: boolean },
): Promise<ActionResult<{ redirectTo?: string }>> {
  return runAction("workspace.saveGoals", async () => {
    const context = await requireWorkspaceAction(slugParam.parse(slug), "workspace:update");
    const data = goalsSchema.parse(input);
    const onboarding = onboardingFlag.parse(options?.onboarding);
    await updateGoals(context, data, onboarding ? { advanceTo: "TEAM" } : {});
    revalidatePath(`/w/${context.organization.slug}`, "layout");
    return {
      redirectTo: onboarding ? onboardingPath(context.organization.slug, "team") : undefined,
    };
  });
}

export async function uploadWorkspaceLogoAction(
  slug: string,
  formData: FormData,
): Promise<ActionResult<{ logoUrl: string | null }>> {
  return runAction(
    "workspace.uploadLogo",
    async () => {
      const context = await requireWorkspaceAction(slugParam.parse(slug), "workspace:update");
      const limit = await rateLimit(`upload:${context.user.id}`, RATE_LIMITS.upload);
      if (!limit.success) throw new AppError("RATE_LIMITED");

      const image = await validateImageUpload(formData.get("file"));
      const logoUrl = await setWorkspaceLogo(context, image);
      revalidatePath(`/w/${context.organization.slug}`, "layout");
      return { logoUrl };
    },
    { successMessage: "Logo updated." },
  );
}

export async function removeWorkspaceLogoAction(
  slug: string,
): Promise<ActionResult<{ logoUrl: null }>> {
  return runAction(
    "workspace.removeLogo",
    async () => {
      const context = await requireWorkspaceAction(slugParam.parse(slug), "workspace:update");
      await setWorkspaceLogo(context, null);
      revalidatePath(`/w/${context.organization.slug}`, "layout");
      return { logoUrl: null };
    },
    { successMessage: "Logo removed." },
  );
}

/** Moves setup forward without saving anything, for the optional steps. */
export async function continueOnboardingAction(
  slug: string,
  stepKey: string,
): Promise<ActionResult<{ redirectTo: string }>> {
  return runAction("onboarding.continue", async () => {
    const context = await requireWorkspaceAction(slugParam.parse(slug), "workspace:update");
    if (!isOnboardingStepKey(stepKey)) throw new AppError("VALIDATION", "Unknown setup step.");

    const upcoming = nextStep(stepForKey(stepKey).step);
    if (upcoming === "COMPLETED") {
      await completeOnboarding(context);
      return { redirectTo: `/w/${context.organization.slug}/dashboard` };
    }

    await advanceOnboarding(context, upcoming);
    return { redirectTo: onboardingPath(context.organization.slug, keyForStep(upcoming)) };
  });
}

export async function completeOnboardingAction(
  slug: string,
): Promise<ActionResult<{ redirectTo: string }>> {
  return runAction("onboarding.complete", async () => {
    const context = await requireWorkspaceAction(slugParam.parse(slug), "workspace:update");
    await completeOnboarding(context);
    revalidatePath(`/w/${context.organization.slug}`, "layout");
    return { redirectTo: `/w/${context.organization.slug}/dashboard` };
  });
}
