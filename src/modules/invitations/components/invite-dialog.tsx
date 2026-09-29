"use client";

import { useState } from "react";
import { UserRoundPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Role } from "@/lib/authorization/permissions";
import { InviteMembersForm } from "@/modules/invitations/components/invite-members-form";

export function InviteDialog({
  slug,
  workspaceName,
  assignableRoles,
  defaultOpen = false,
}: {
  slug: string;
  workspaceName: string;
  assignableRoles: Role[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserRoundPlus aria-hidden />
          Invite people
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Invite people to {workspaceName}</DialogTitle>
          <DialogDescription>
            Each person gets a link that only works with their email address. Invitations expire
            after 7 days.
          </DialogDescription>
        </DialogHeader>
        <InviteMembersForm slug={slug} assignableRoles={assignableRoles} />
      </DialogContent>
    </Dialog>
  );
}
