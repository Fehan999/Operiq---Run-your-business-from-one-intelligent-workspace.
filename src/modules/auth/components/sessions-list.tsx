"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Laptop, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { revokeOtherSessionsAction, revokeSessionAction } from "@/modules/auth/actions";
import { describeUserAgent } from "@/modules/auth/user-agent";

export interface SessionRow {
  id: string;
  createdAt: string;
  lastSeenAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export function SessionsList({
  sessions,
  currentSessionId,
}: {
  sessions: SessionRow[];
  currentSessionId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const others = sessions.filter((session) => session.id !== currentSessionId);

  function revoke(id: string) {
    startTransition(async () => {
      const result = await revokeSessionAction(id);
      if (result.ok) toast.success(result.message ?? "Session revoked.");
      else toast.error(result.error);
      router.refresh();
    });
  }

  function revokeOthers() {
    startTransition(async () => {
      const result = await revokeOtherSessionsAction();
      if (result.ok) {
        toast.success(
          result.data.count === 1
            ? "Signed out of 1 other session."
            : `Signed out of ${result.data.count} other sessions.`,
        );
      } else {
        toast.error(result.error);
      }
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4">
      <ul className="divide-y" aria-busy={pending}>
        {sessions.map((session) => {
          const device = describeUserAgent(session.userAgent);
          const Icon = device.mobile ? Smartphone : Laptop;
          const isCurrent = session.id === currentSessionId;
          return (
            <li key={session.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {device.label}
                  {isCurrent ? <Badge variant="success">This device</Badge> : null}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {session.ipAddress ? `${session.ipAddress} · ` : ""}
                  Signed in {formatDate(session.createdAt)} · Active{" "}
                  {formatRelativeTime(session.lastSeenAt)}
                </p>
              </div>
              {isCurrent ? null : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revoke(session.id)}
                  disabled={pending}
                >
                  Revoke
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {others.length > 0 ? (
        <div className="flex justify-end border-t pt-4">
          <Button variant="outline" onClick={revokeOthers} loading={pending}>
            Sign out of all other sessions
          </Button>
        </div>
      ) : null}
    </div>
  );
}
