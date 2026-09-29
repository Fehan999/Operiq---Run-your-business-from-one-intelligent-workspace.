import "server-only";

import { Prisma, type OnboardingStep, type Organization } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { ValidatedImage } from "@/lib/storage/image-validation";
import { deleteStoredObject, uploadPublicImage } from "@/lib/storage/supabase-storage";
import { recordActivity } from "@/modules/activity/service";
import { diffChanges } from "@/modules/audit/diff";
import { recordAuditLog } from "@/modules/audit/service";
import type { SessionUser } from "@/modules/auth/session";
import { furthestStep } from "@/modules/onboarding/steps";
import type { WorkspaceContext } from "@/modules/organizations/context";
import type {
  CreateWorkspaceInput,
  GoalsInput,
  WorkspaceGeneralInput,
} from "@/modules/organizations/schemas";
import { slugify, validateSlug, withRandomSuffix } from "@/modules/organizations/slug";

// A soft guard against scripted abuse; real limits per plan live in config/plans.ts.
const MAX_OWNED_WORKSPACES = 10;

function isSlugConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    JSON.stringify(error.meta ?? {}).includes("slug")
  );
}

const slugTaken = () =>
  new AppError("CONFLICT", "That workspace address is already taken.", {
    fieldErrors: { slug: ["That address is already taken."] },
  });

export async function isSlugAvailable(slug: string, excludeOrganizationId?: string) {
  if (validateSlug(slug)) return false;
  const existing = await db.organization.findUnique({ where: { slug }, select: { id: true } });
  return !existing || existing.id === excludeOrganizationId;
}

export async function suggestSlug(name: string): Promise<string> {
  const base = slugify(name);
  const candidate = base.length >= 3 ? base : `${base || "workspace"}-team`;
  if (await isSlugAvailable(candidate)) return candidate;
  for (let attempt = 0; attempt < 5; attempt++) {
    const next = withRandomSuffix(candidate);
    if (await isSlugAvailable(next)) return next;
  }
  return withRandomSuffix("workspace");
}

export async function createWorkspace(
  user: SessionUser,
  input: CreateWorkspaceInput,
): Promise<Organization> {
  const owned = await db.organizationMember.count({ where: { userId: user.id, role: "OWNER" } });
  if (owned >= MAX_OWNED_WORKSPACES) {
    throw new AppError(
      "LIMIT_REACHED",
      "You've reached the maximum number of workspaces you can own.",
    );
  }

  try {
    return await db.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: input.name,
          slug: input.slug,
          members: { create: { userId: user.id, role: "OWNER" } },
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { lastOrganizationId: organization.id },
      });

      await recordAuditLog(
        {
          action: "workspace.created",
          organizationId: organization.id,
          actorId: user.id,
          targetType: "organization",
          targetId: organization.id,
          metadata: { name: organization.name, slug: organization.slug },
        },
        tx,
      );
      await recordActivity(
        {
          organizationId: organization.id,
          actorId: user.id,
          type: "workspace.created",
          data: { name: organization.name },
        },
        tx,
      );

      return organization;
    });
  } catch (error) {
    if (isSlugConflict(error)) throw slugTaken();
    throw error;
  }
}

const PROFILE_FIELDS = ["industry", "companySize", "currency", "timezone", "website"] as const;

export async function updateBusinessProfile(
  context: WorkspaceContext,
  data: {
    industry: string;
    companySize: Organization["companySize"];
    currency: string;
    timezone: string;
    website?: string | null;
  },
  options: { advanceTo?: OnboardingStep } = {},
) {
  const { organization, user } = context;
  const changes = diffChanges(organization, data, PROFILE_FIELDS);

  const updated = await db.organization.update({
    where: { id: organization.id },
    data: {
      ...data,
      ...(options.advanceTo
        ? { onboardingStep: furthestStep(organization.onboardingStep, options.advanceTo) }
        : {}),
    },
  });

  if (changes) {
    await recordAuditLog({
      action: "workspace.updated",
      organizationId: organization.id,
      actorId: user.id,
      targetType: "organization",
      targetId: organization.id,
      changes,
    });
  }
  return updated;
}

export async function updateWorkspaceGeneral(
  context: WorkspaceContext,
  data: WorkspaceGeneralInput,
) {
  const { organization, user } = context;
  const changes = diffChanges(organization, data, ["name", "slug"]);
  if (!changes) return organization;

  try {
    const updated = await db.organization.update({
      where: { id: organization.id },
      data: { name: data.name, slug: data.slug },
    });
    await recordAuditLog({
      action: "workspace.updated",
      organizationId: organization.id,
      actorId: user.id,
      targetType: "organization",
      targetId: organization.id,
      changes,
    });
    return updated;
  } catch (error) {
    if (isSlugConflict(error)) throw slugTaken();
    throw error;
  }
}

export async function updateGoals(
  context: WorkspaceContext,
  data: GoalsInput,
  options: { advanceTo?: OnboardingStep } = {},
) {
  const { organization, user } = context;
  const updated = await db.organization.update({
    where: { id: organization.id },
    data: {
      goals: data.goals,
      ...(options.advanceTo
        ? { onboardingStep: furthestStep(organization.onboardingStep, options.advanceTo) }
        : {}),
    },
  });

  const changes = diffChanges(organization, { goals: data.goals }, ["goals"]);
  if (changes) {
    await recordAuditLog({
      action: "workspace.updated",
      organizationId: organization.id,
      actorId: user.id,
      targetType: "organization",
      targetId: organization.id,
      changes,
    });
  }
  return updated;
}

export async function setWorkspaceLogo(context: WorkspaceContext, image: ValidatedImage | null) {
  const { organization, user } = context;
  const stored = image ? await uploadPublicImage(`organizations/${organization.id}`, image) : null;

  try {
    await db.organization.update({
      where: { id: organization.id },
      data: { logoUrl: stored?.publicUrl ?? null, logoPath: stored?.path ?? null },
    });
  } catch (error) {
    // Don't leave an orphaned object behind if the database write fails.
    await deleteStoredObject(stored?.path);
    throw error;
  }

  await deleteStoredObject(organization.logoPath);
  await recordAuditLog({
    action: "workspace.logo_updated",
    organizationId: organization.id,
    actorId: user.id,
    targetType: "organization",
    targetId: organization.id,
    metadata: { removed: !stored },
  });

  return stored?.publicUrl ?? null;
}

export async function advanceOnboarding(context: WorkspaceContext, step: OnboardingStep) {
  const { organization } = context;
  const target = furthestStep(organization.onboardingStep, step);
  if (target === organization.onboardingStep) return;
  await db.organization.update({
    where: { id: organization.id },
    data: { onboardingStep: target },
  });
}

export async function completeOnboarding(context: WorkspaceContext) {
  const { organization, user } = context;
  if (organization.onboardingCompletedAt) return;

  await db.organization.update({
    where: { id: organization.id },
    data: { onboardingStep: "COMPLETED", onboardingCompletedAt: new Date() },
  });
  await recordAuditLog({
    action: "workspace.onboarding_completed",
    organizationId: organization.id,
    actorId: user.id,
    targetType: "organization",
    targetId: organization.id,
  });
}

export async function listUserWorkspaces(userId: string) {
  const memberships = await db.organizationMember.findMany({
    where: { userId },
    orderBy: { organization: { name: "asc" } },
    select: {
      role: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          plan: true,
          onboardingStep: true,
          onboardingCompletedAt: true,
        },
      },
    },
  });
  return memberships.map(({ role, organization }) => ({ ...organization, role }));
}

export type UserWorkspace = Awaited<ReturnType<typeof listUserWorkspaces>>[number];
