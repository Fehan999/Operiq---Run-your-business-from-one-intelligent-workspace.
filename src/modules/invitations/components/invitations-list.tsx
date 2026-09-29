"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, RotateCw, X } from "lucide-react";
import { toast } from "sonner";

import { CopyButton } from "@/components/shared/copy-button";
import { EmptyState } from "@/components/shared/empty-state";
import { RoleBadge } from "@/components/shared/role-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/authorization/permissions";
import { formatRelativeTime } from "@/lib/utils";
import { resendInvitationAction, revokeInvitationAction } from "@/modules/invitations/actions";

export interface InvitationRow {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  expired: boolean;
  invitedBy: string | null;
}

export function InvitationsList({
  slug,
  invitations,
  canManage,
}: {
  slug: string;
  invitations: InvitationRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [freshLinks, setFreshLinks] = useState<Record<string, string>>({});

  if (invitations.length === 0) {
    return (
      <EmptyState
        icon={Mail}
        title="No pending invitations"
        description="Invitations you send appear here until they're accepted."
        className="py-8"
      />
    );
  }

  function resend(invitation: InvitationRow) {
    startTransition(async () => {
      const result = await resendInvitationAction(slug, invitation.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setFreshLinks((links) => ({ ...links, [invitation.id]: result.data.inviteUrl }));
      toast.success(result.data.emailed ? "Invitation sent again." : "New invite link created.");
      router.refresh();
    });
  }

  function revoke(invitation: InvitationRow) {
    startTransition(async () => {
      const result = await revokeInvitationAction(slug, invitation.id);
      if (result.ok) toast.success("Invitation revoked.");
      else toast.error(result.error);
      router.refresh();
    });
  }

  return (
    <ul className="divide-y" aria-busy={pending}>
      {invitations.map((invitation) => (
        <li
          key={invitation.id}
          className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{invitation.email}</p>
            <p className="text-xs text-muted-foreground">
              {invitation.invitedBy ? `Invited by ${invitation.invitedBy} · ` : ""}
              {invitation.expired
                ? "Expired"
                : `Expires ${formatRelativeTime(invitation.expiresAt)}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {invitation.expired ? <Badge variant="warning">Expired</Badge> : null}
            <RoleBadge role={invitation.role} />
            {canManage ? (
              <>
                {freshLinks[invitation.id] ? (
                  <CopyButton value={freshLinks[invitation.id]!} label="Copy link" />
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resend(invitation)}
                  disabled={pending}
                >
                  <RotateCw aria-hidden />
                  Resend
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => revoke(invitation)}
                  disabled={pending}
                  aria-label={`Revoke invitation for ${invitation.email}`}
                >
                  <X aria-hidden />
                </Button>
              </>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
