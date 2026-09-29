import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SessionsList } from "@/modules/auth/components/sessions-list";
import { getCurrentSession, listUserSessions } from "@/modules/auth/session";
import { getWorkspaceContext } from "@/modules/organizations/context";
import { SettingsSection } from "@/modules/settings/components/settings-section";

export const metadata: Metadata = { title: "Security" };

export default async function SecuritySettingsPage({
  params,
}: PageProps<"/w/[slug]/settings/security">) {
  const { slug } = await params;
  await getWorkspaceContext(slug);
  const current = await getCurrentSession();
  if (!current) redirect("/login");

  const sessions = await listUserSessions(current.user.id);

  return (
    <div className="grid gap-6">
      <SettingsSection
        title="Active sessions"
        description="Devices signed in to your account. Revoking a session signs that device out on its next request."
      >
        <SessionsList
          currentSessionId={current.session.id}
          sessions={sessions.map((session) => ({
            id: session.id,
            createdAt: session.createdAt.toISOString(),
            lastSeenAt: session.lastSeenAt.toISOString(),
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
          }))}
        />
      </SettingsSection>

      <SettingsSection title="Password and sign-in" description="How you sign in to Operiq.">
        <div className="grid gap-2 text-sm text-muted-foreground">
          <p>
            Signed in as <span className="font-medium text-foreground">{current.user.email}</span>.
            To change your password, sign out and use &quot;Forgot password&quot; on the sign-in
            page. Accounts that use Google sign-in manage their password with Google.
          </p>
          <p>Two-factor authentication and passkeys are on the roadmap.</p>
        </div>
      </SettingsSection>
    </div>
  );
}
