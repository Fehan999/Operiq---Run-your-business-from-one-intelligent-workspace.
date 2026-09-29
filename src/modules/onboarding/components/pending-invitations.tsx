"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { WorkspaceAvatar } from "@/components/shared/avatars";
import { RoleBadge } from "@/components/shared/role-badge";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/authorization/permissions";
import { acceptInvitationByIdAction } from "@/modules/invitations/actions";

export interface PendingInvitationItem {
  id: string;
  role: Role;
  organization: { name: string; logoUrl: string | null };
  invitedBy: string | null;
}

export function PendingInvitations({ invitations }: { invitations: PendingInvitationItem[] }) {
  const router = useRouter();
  const [joining, setJoining] = useState<string | null>(null);

  async function join(id: string) {
    setJoining(id);
    const result = await acceptInvitationByIdAction(id);
    if (!result.ok) {
      toast.error(result.error);
      setJoining(null);
      return;
    }
    router.push(result.data.redirectTo);
  }

  return (
    <ul className="grid gap-2">
      {invitations.map((invitation) => (
        <li key={invitation.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <WorkspaceAvatar
            name={invitation.organization.name}
            logoUrl={invitation.organization.logoUrl}
            className="size-9"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{invitation.organization.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {invitation.invitedBy ? `Invited by ${invitation.invitedBy}` : "You're invited"}
            </p>
          </div>
          <RoleBadge role={invitation.role} />
          <Button
            size="sm"
            onClick={() => join(invitation.id)}
            loading={joining === invitation.id}
            disabled={joining !== null}
          >
            Join
          </Button>
        </li>
      ))}
    </ul>
  );
}
