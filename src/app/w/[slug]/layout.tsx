import type { Metadata } from "next";
import { after } from "next/server";

import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { permissionsFor } from "@/lib/authorization/permissions";
import { listNotifications } from "@/modules/notifications/service";
import { getWorkspaceContext } from "@/modules/organizations/context";
import { listUserWorkspaces } from "@/modules/organizations/service";
import { setLastOrganization } from "@/modules/users/service";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function WorkspaceLayout({ children, params }: LayoutProps<"/w/[slug]">) {
  const { slug } = await params;
  const context = await getWorkspaceContext(slug);
  const { user, organization, role } = context;

  const [workspaces, notifications] = await Promise.all([
    listUserWorkspaces(user.id),
    listNotifications(organization.id, user.id),
  ]);

  // Remember the workspace for the next sign-in, after the response has been sent.
  if (user.lastOrganizationId !== organization.id) {
    after(() => setLastOrganization(user.id, organization.id));
  }

  return (
    <WorkspaceShell
      data={{
        workspace: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          logoUrl: organization.logoUrl,
          plan: organization.plan,
        },
        user: { name: user.name, email: user.email, avatarUrl: user.avatarUrl },
        role,
        permissions: permissionsFor(role),
        workspaces: workspaces.map(({ id, name, slug: itemSlug, logoUrl, role: itemRole }) => ({
          id,
          name,
          slug: itemSlug,
          logoUrl,
          role: itemRole,
        })),
      }}
      notifications={{
        unreadCount: notifications.unreadCount,
        items: notifications.items.map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          link: item.link,
          readAt: item.readAt?.toISOString() ?? null,
          createdAt: item.createdAt.toISOString(),
        })),
      }}
    >
      {children}
    </WorkspaceShell>
  );
}
