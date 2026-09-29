import type { Metadata } from "next";

import { getLimit } from "@/config/plans";
import { InvitationsList } from "@/modules/invitations/components/invitations-list";
import { InviteDialog } from "@/modules/invitations/components/invite-dialog";
import { listOpenInvitations } from "@/modules/invitations/service";
import { MembersList } from "@/modules/members/components/members-list";
import { assignableRoles } from "@/modules/members/policy";
import { listMembers } from "@/modules/members/service";
import { getWorkspaceContext } from "@/modules/organizations/context";
import { SettingsSection } from "@/modules/settings/components/settings-section";

export const metadata: Metadata = { title: "Members" };

export default async function MembersSettingsPage({
  params,
  searchParams,
}: PageProps<"/w/[slug]/settings/members">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const context = await getWorkspaceContext(slug);
  const { organization, user, role } = context;
  const canInvite = context.can("members:invite");

  const [members, invitations] = await Promise.all([
    listMembers(organization.id),
    canInvite ? listOpenInvitations(organization.id) : Promise.resolve([]),
  ]);

  const seatLimit = getLimit(organization.plan, "members");
  const openInvitations = invitations.filter((invitation) => !invitation.expired).length;

  return (
    <div className="grid gap-6">
      <SettingsSection
        title="Members"
        description={`${members.length + openInvitations} of ${seatLimit} seats used on the ${organization.plan.toLowerCase()} plan.`}
        actions={
          canInvite ? (
            <InviteDialog
              slug={organization.slug}
              workspaceName={organization.name}
              assignableRoles={assignableRoles(role)}
              defaultOpen={query.invite === "1"}
            />
          ) : null
        }
      >
        <MembersList
          slug={organization.slug}
          currentUserId={user.id}
          actorRole={role}
          members={members.map((member) => ({
            id: member.id,
            role: member.role,
            jobTitle: member.jobTitle,
            joinedAt: member.createdAt.toISOString(),
            user: member.user,
          }))}
        />
      </SettingsSection>

      {canInvite ? (
        <SettingsSection title="Pending invitations" description="People who haven't joined yet.">
          <InvitationsList
            slug={organization.slug}
            canManage={canInvite}
            invitations={invitations.map((invitation) => ({
              id: invitation.id,
              email: invitation.email,
              role: invitation.role,
              expired: invitation.expired,
              expiresAt: invitation.expiresAt.toISOString(),
              invitedBy: invitation.invitedBy?.name ?? invitation.invitedBy?.email ?? null,
            }))}
          />
        </SettingsSection>
      ) : null}
    </div>
  );
}
