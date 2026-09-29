"use client";

import { UserAvatar } from "@/components/shared/avatars";
import { ImageUpload } from "@/components/shared/image-upload";
import { removeAvatarAction, uploadAvatarAction } from "@/modules/users/actions";

export function AvatarUpload({
  name,
  email,
  avatarUrl,
}: {
  name: string | null;
  email: string;
  avatarUrl: string | null;
}) {
  return (
    <ImageUpload
      value={avatarUrl}
      shape="circle"
      label="Upload photo"
      fallback={<UserAvatar name={name} email={email} className="size-16 text-base" />}
      onUpload={uploadAvatarAction}
      onRemove={removeAvatarAction}
    />
  );
}
