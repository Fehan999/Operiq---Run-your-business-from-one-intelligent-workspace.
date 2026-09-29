import type { Metadata } from "next";

import { formatDate } from "@/lib/utils";
import { getWorkspaceContext } from "@/modules/organizations/context";
import { SettingsSection } from "@/modules/settings/components/settings-section";
import { AvatarUpload } from "@/modules/users/components/avatar-upload";
import { ProfileForm } from "@/modules/users/components/profile-form";
import { getUserProfile } from "@/modules/users/service";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfileSettingsPage({
  params,
}: PageProps<"/w/[slug]/settings/profile">) {
  const { slug } = await params;
  const { user, organization, membership } = await getWorkspaceContext(slug);
  const profile = await getUserProfile(user.id);

  return (
    <div className="grid gap-6">
      <SettingsSection
        title="Photo"
        description="Helps your team recognise you in comments and assignments."
      >
        <AvatarUpload name={profile.name} email={profile.email} avatarUrl={profile.avatarUrl} />
      </SettingsSection>

      <SettingsSection
        title="Profile"
        description={`Member since ${formatDate(profile.createdAt)}.`}
      >
        <ProfileForm
          slug={organization.slug}
          email={profile.email}
          workspaceName={organization.name}
          defaults={{ name: profile.name ?? "", jobTitle: membership.jobTitle ?? "" }}
        />
      </SettingsSection>
    </div>
  );
}
