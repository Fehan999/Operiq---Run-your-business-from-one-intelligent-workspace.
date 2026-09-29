import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { WorkspaceAvatar } from "@/components/shared/avatars";
import { publicEnv } from "@/config/public-env";
import { requireVerifiedUser } from "@/modules/auth/session";
import { listInvitationsForUser } from "@/modules/invitations/service";
import { CreateWorkspaceForm } from "@/modules/onboarding/components/create-workspace-form";
import { PendingInvitations } from "@/modules/onboarding/components/pending-invitations";
import { listUserWorkspaces } from "@/modules/organizations/service";

export default async function CreateWorkspacePage() {
  const user = await requireVerifiedUser();
  const [invitations, workspaces] = await Promise.all([
    listInvitationsForUser(user),
    listUserWorkspaces(user.id),
  ]);

  const firstName = user.name?.split(" ")[0];
  const host = new URL(publicEnv.appUrl).host;

  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <p className="text-sm font-medium text-primary">
          {workspaces.length > 0 ? "New workspace" : "Step 1 of 5"}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {workspaces.length > 0
            ? "Create another workspace"
            : `Welcome${firstName ? `, ${firstName}` : ""}. Let's set up your workspace.`}
        </h1>
        <p className="text-muted-foreground">
          A workspace holds your customers, projects, finance and team. You can belong to as many as
          you need.
        </p>
      </div>

      {invitations.length > 0 ? (
        <section aria-labelledby="invitations-heading" className="grid gap-3">
          <h2 id="invitations-heading" className="text-sm font-semibold">
            You&apos;ve been invited
          </h2>
          <PendingInvitations
            invitations={invitations.map((invitation) => ({
              id: invitation.id,
              role: invitation.role,
              organization: invitation.organization,
              invitedBy: invitation.invitedBy?.name ?? invitation.invitedBy?.email ?? null,
            }))}
          />
        </section>
      ) : null}

      <section className="rounded-xl border bg-card p-6 shadow-xs">
        <CreateWorkspaceForm urlPrefix={`${host}/w/`} />
      </section>

      {workspaces.length > 0 ? (
        <section aria-labelledby="existing-heading" className="grid gap-3">
          <h2 id="existing-heading" className="text-sm font-semibold">
            Your workspaces
          </h2>
          <ul className="grid gap-2">
            {workspaces.map((workspace) => (
              <li key={workspace.id}>
                <Link
                  href={`/w/${workspace.slug}/dashboard`}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
                >
                  <WorkspaceAvatar
                    name={workspace.name}
                    logoUrl={workspace.logoUrl}
                    className="size-8"
                  />
                  <span className="flex-1 truncate text-sm font-medium">{workspace.name}</span>
                  <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
