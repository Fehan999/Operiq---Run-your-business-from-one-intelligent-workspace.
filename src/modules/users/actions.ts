"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { runAction } from "@/lib/actions";
import { AppError, type ActionResult } from "@/lib/errors";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { validateImageUpload } from "@/lib/storage/image-validation";
import { deleteStoredObject, uploadPublicImage } from "@/lib/storage/supabase-storage";
import { diffChanges } from "@/modules/audit/diff";
import { recordAuditLog } from "@/modules/audit/service";
import { requireVerifiedUser } from "@/modules/auth/session";
import { updateOwnJobTitle } from "@/modules/members/service";
import { requireWorkspaceAction } from "@/modules/organizations/context";
import { setUserAvatar, updateUserProfile } from "@/modules/users/service";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80, "Use at most 80 characters."),
  jobTitle: z
    .string()
    .trim()
    .max(80, "Use at most 80 characters.")
    .transform((value) => (value === "" ? null : value)),
});

export async function updateProfileAction(
  slug: string,
  input: z.input<typeof profileSchema>,
): Promise<ActionResult> {
  return runAction(
    "profile.update",
    async () => {
      const context = await requireWorkspaceAction(z.string().min(1).max(64).parse(slug));
      const data = profileSchema.parse(input);

      const { before, after } = await updateUserProfile(context.user.id, { name: data.name });
      await updateOwnJobTitle(context, data.jobTitle);

      const changes = diffChanges(
        { name: before.name, jobTitle: context.membership.jobTitle },
        { name: after.name, jobTitle: data.jobTitle },
        ["name", "jobTitle"],
      );
      if (changes) {
        await recordAuditLog({
          action: "profile.updated",
          organizationId: context.organization.id,
          actorId: context.user.id,
          targetType: "user",
          targetId: context.user.id,
          changes,
        });
      }

      revalidatePath(`/w/${context.organization.slug}`, "layout");
      return null;
    },
    { successMessage: "Profile saved." },
  );
}

export async function uploadAvatarAction(
  formData: FormData,
): Promise<ActionResult<{ avatarUrl: string | null }>> {
  return runAction(
    "profile.uploadAvatar",
    async () => {
      const user = await requireVerifiedUser();
      const limit = await rateLimit(`upload:${user.id}`, RATE_LIMITS.upload);
      if (!limit.success) throw new AppError("RATE_LIMITED");

      const image = await validateImageUpload(formData.get("file"));
      const stored = await uploadPublicImage(`users/${user.id}`, image);
      const { previousPath } = await setUserAvatar(user.id, {
        url: stored.publicUrl,
        path: stored.path,
      });
      await deleteStoredObject(previousPath);

      revalidatePath("/", "layout");
      return { avatarUrl: stored.publicUrl };
    },
    { successMessage: "Photo updated." },
  );
}

export async function removeAvatarAction(): Promise<ActionResult<{ avatarUrl: null }>> {
  return runAction(
    "profile.removeAvatar",
    async () => {
      const user = await requireVerifiedUser();
      const { previousPath } = await setUserAvatar(user.id, null);
      await deleteStoredObject(previousPath);
      revalidatePath("/", "layout");
      return { avatarUrl: null };
    },
    { successMessage: "Photo removed." },
  );
}
