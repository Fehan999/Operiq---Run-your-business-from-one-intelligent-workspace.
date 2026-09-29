"use client";

import { WorkspaceAvatar } from "@/components/shared/avatars";
import { ImageUpload } from "@/components/shared/image-upload";
import {
  removeWorkspaceLogoAction,
  uploadWorkspaceLogoAction,
} from "@/modules/organizations/actions";

export function WorkspaceLogoUpload({
  slug,
  name,
  logoUrl,
  disabled,
}: {
  slug: string;
  name: string;
  logoUrl: string | null;
  disabled?: boolean;
}) {
  return (
    <ImageUpload
      value={logoUrl}
      label="Upload logo"
      description="Square PNG, JPG, WebP or GIF, up to 2 MB."
      fallback={<WorkspaceAvatar name={name} className="size-16 text-base" />}
      onUpload={(formData) => uploadWorkspaceLogoAction(slug, formData)}
      onRemove={() => removeWorkspaceLogoAction(slug)}
      disabled={disabled}
    />
  );
}
