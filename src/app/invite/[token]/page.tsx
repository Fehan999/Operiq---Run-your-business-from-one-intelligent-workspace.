import type { Metadata } from "next";
import Link from "next/link";

import { WorkspaceAvatar } from "@/components/shared/avatars";
import { Logo } from "@/components/shared/logo";
import { RoleBadge } from "@/components/shared/role-badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/modules/auth/session";
import { AcceptInvitationButton } from "@/modules/invitations/components/accept-invitation-button";
import { getInvitationPreview } from "@/modules/invitations/service";

export const metadata: Metadata = {
  title: "Join a workspace",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const STATUS_COPY = {
  invalid: {
    title: "This invitation link isn't valid",
    body: "Check that you copied the whole link, or ask for a new invitation.",
  },
  expired: {
    title: "This invitation has expired",
    body: "Invitations are valid for 7 days. Ask the person who invited you to send a new one.",
  },
  revoked: {
    title: "This invitation was revoked",
    body: "Ask a workspace admin to invite you again if you still need access.",
  },
  accepted: {
    title: "This invitation has already been used",
    body: "If it was you, sign in to open the workspace.",
  },
} as const;

export default async function InvitationPage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const [preview, user] = await Promise.all([getInvitationPreview(token), getCurrentUser()]);
  const invitePath = `/invite/${encodeURIComponent(token)}`;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-sidebar px-4 py-10">
      <Link href="/" className="mb-8 rounded-md" aria-label="Operiq home">
        <Logo />
      </Link>
      <main id="main" className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        {preview.status !== "pending" ? (
          <div className="grid gap-3 text-center">
            <h1 className="text-xl font-semibold">{STATUS_COPY[preview.status].title}</h1>
            <p className="text-sm text-muted-foreground">{STATUS_COPY[preview.status].body}</p>
            <Button asChild variant="outline" className="mt-2">
              <Link href={user ? "/dashboard" : "/login"}>{user ? "Go to Operiq" : "Sign in"}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <WorkspaceAvatar
                name={preview.organization.name}
                logoUrl={preview.organization.logoUrl}
                className="size-14 text-base"
              />
              <div className="grid gap-1">
                <h1 className="text-xl font-semibold">Join {preview.organization.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {preview.invitedBy ? `${preview.invitedBy} invited you` : "You've been invited"}{" "}
                  to collaborate on Operiq.
                </p>
              </div>
              <RoleBadge role={preview.role} />
            </div>

            {!user ? (
              <div className="grid gap-2">
                <p className="text-center text-sm text-muted-foreground">
                  This invitation is for{" "}
                  <span className="font-medium text-foreground">{preview.email}</span>. Sign in or
                  create an account with that address to accept.
                </p>
                <Button asChild>
                  <Link href={`/register?next=${encodeURIComponent(invitePath)}`}>
                    Create an account
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/login?next=${encodeURIComponent(invitePath)}`}>Sign in</Link>
                </Button>
              </div>
            ) : user.email !== preview.email ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                You&apos;re signed in as <span className="font-medium">{user.email}</span>, but this
                invitation was sent to <span className="font-medium">{preview.email}</span>. Sign
                out and use that address to accept it.
              </p>
            ) : !user.emailVerifiedAt ? (
              <Button asChild>
                <Link href="/verify-email">Verify your email to continue</Link>
              </Button>
            ) : (
              <AcceptInvitationButton token={token} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
