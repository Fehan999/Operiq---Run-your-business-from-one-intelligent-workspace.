"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { leaveWorkspaceAction } from "@/modules/members/actions";

export function LeaveWorkspaceButton({
  slug,
  workspaceName,
  blockedReason,
}: {
  slug: string;
  workspaceName: string;
  blockedReason?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function leave() {
    startTransition(async () => {
      const result = await leaveWorkspaceAction(slug);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`You left ${workspaceName}.`);
      router.replace(result.data.redirectTo);
      router.refresh();
    });
  }

  if (blockedReason) {
    return (
      <div className="grid gap-2">
        <Button variant="outline" disabled>
          Leave workspace
        </Button>
        <p className="text-xs text-muted-foreground">{blockedReason}</p>
      </div>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="text-destructive hover:text-destructive">
          Leave workspace
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave {workspaceName}?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll lose access to everything in this workspace. An admin will need to invite
            you again to get it back.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={(event) => {
              event.preventDefault();
              leave();
            }}
            disabled={pending}
          >
            Leave workspace
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
