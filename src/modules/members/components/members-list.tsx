"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, UserMinus } from "lucide-react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/shared/avatars";
import { RoleBadge } from "@/components/shared/role-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_DETAILS, ROLES, type Role } from "@/lib/authorization/permissions";
import { formatDate } from "@/lib/utils";
import { changeMemberRoleAction, removeMemberAction } from "@/modules/members/actions";
import { canChangeRole, canRemoveMember } from "@/modules/members/policy";

export interface MemberRow {
  id: string;
  role: Role;
  jobTitle: string | null;
  joinedAt: string;
  user: { id: string; name: string | null; email: string; avatarUrl: string | null };
}

export function MembersList({
  slug,
  members,
  currentUserId,
  actorRole,
}: {
  slug: string;
  members: MemberRow[];
  currentUserId: string;
  actorRole: Role;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [removing, setRemoving] = useState<MemberRow | null>(null);
  const ownerCount = members.filter((member) => member.role === "OWNER").length;
  const actor = { userId: currentUserId, role: actorRole };

  function changeRole(member: MemberRow, role: Role) {
    startTransition(async () => {
      const result = await changeMemberRoleAction(slug, member.id, role);
      if (result.ok)
        toast.success(
          `${member.user.name ?? member.user.email} is now ${ROLE_DETAILS[role].label}.`,
        );
      else toast.error(result.error);
      router.refresh();
    });
  }

  function confirmRemove() {
    const member = removing;
    if (!member) return;
    const label = member.user.name ?? member.user.email;
    startTransition(async () => {
      const result = await removeMemberAction(slug, member.id);
      if (result.ok) toast.success(`${label} was removed.`);
      else toast.error(result.error);
      setRemoving(null);
      router.refresh();
    });
  }

  return (
    <>
      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {removing?.user.name ?? removing?.user.email}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They will lose access to this workspace immediately. You can invite them again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                confirmRemove();
              }}
            >
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ul className="divide-y" aria-busy={pending}>
        {members.map((member) => {
          const target = { userId: member.user.id, role: member.role };
          const roleOptions = ROLES.filter(
            (role) =>
              role === member.role || canChangeRole(actor, target, role, ownerCount).allowed,
          );
          const canEditRole = roleOptions.length > 1;
          const canRemove = canRemoveMember(actor, target, ownerCount).allowed;
          const isSelf = member.user.id === currentUserId;

          return (
            <li
              key={member.id}
              className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <UserAvatar
                  name={member.user.name}
                  email={member.user.email}
                  avatarUrl={member.user.avatarUrl}
                  className="size-9"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {member.user.name ?? member.user.email}
                    {isSelf ? (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        (you)
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.user.email}
                    {member.jobTitle ? ` · ${member.jobTitle}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pl-12 sm:pl-0">
                <span className="hidden text-xs text-muted-foreground md:inline">
                  Joined {formatDate(member.joinedAt)}
                </span>
                {canEditRole ? (
                  <Select
                    value={member.role}
                    onValueChange={(value) => changeRole(member, value as Role)}
                    disabled={pending}
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-32"
                      aria-label={`Role for ${member.user.email}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_DETAILS[role].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <RoleBadge role={member.role} />
                )}
                {canRemove ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`More actions for ${member.user.email}`}
                      >
                        <MoreHorizontal aria-hidden />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem variant="destructive" onSelect={() => setRemoving(member)}>
                        <UserMinus aria-hidden />
                        Remove from workspace
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span className="size-8" aria-hidden />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
