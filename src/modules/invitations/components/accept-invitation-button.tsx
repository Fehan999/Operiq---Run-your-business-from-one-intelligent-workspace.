"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { acceptInvitationAction } from "@/modules/invitations/actions";

export function AcceptInvitationButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="lg"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await acceptInvitationAction(token);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          router.push(result.data.redirectTo);
        })
      }
    >
      Accept invitation
    </Button>
  );
}
