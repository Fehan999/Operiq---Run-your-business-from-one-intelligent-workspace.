import type { Metadata } from "next";
import Link from "next/link";
import { ScrollText } from "lucide-react";

import { UserAvatar } from "@/components/shared/avatars";
import { EmptyState } from "@/components/shared/empty-state";
import { ForbiddenState } from "@/components/shared/forbidden-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { describeAuditAction } from "@/modules/audit/events";
import { listAuditLogs } from "@/modules/audit/service";
import { getWorkspaceContext } from "@/modules/organizations/context";
import { SettingsSection } from "@/modules/settings/components/settings-section";

export const metadata: Metadata = { title: "Audit log" };

function summarizeChanges(changes: unknown): string | null {
  if (!changes || typeof changes !== "object") return null;
  const { before, after } = changes as {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  if (!after) return null;
  const parts = Object.keys(after).map((key) => {
    const from = before?.[key];
    const to = after[key];
    return `${key}: ${from === undefined || from === null ? "none" : String(from)} → ${to === null ? "none" : String(to)}`;
  });
  return parts.length > 0 ? parts.join(", ") : null;
}

export default async function AuditLogPage({
  params,
  searchParams,
}: PageProps<"/w/[slug]/settings/audit-log">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const context = await getWorkspaceContext(slug);
  if (!context.can("audit:view")) return <ForbiddenState />;

  const cursor =
    typeof query.cursor === "string" && query.cursor.length <= 64 ? query.cursor : undefined;
  const { items, nextCursor } = await listAuditLogs(context.organization.id, cursor);

  return (
    <SettingsSection
      title="Audit log"
      description="An append-only record of security-relevant events. Entries cannot be edited or deleted."
    >
      {items.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No events yet"
          description="Sign-ins, invitations and role changes will be recorded here."
        />
      ) : (
        <div className="grid gap-4">
          <ol className="divide-y">
            {items.map((entry) => {
              const changes = summarizeChanges(entry.changes);
              return (
                <li key={entry.id} className="flex items-start gap-3 py-3 first:pt-0">
                  {entry.actorType === "USER" ? (
                    <UserAvatar
                      name={entry.actor?.name}
                      email={entry.actor?.email}
                      avatarUrl={entry.actor?.avatarUrl}
                      className="size-7"
                    />
                  ) : (
                    <Badge variant="muted" className="mt-0.5">
                      {entry.actorType}
                    </Badge>
                  )}
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <p className="text-sm">
                      <span className="font-medium">
                        {entry.actor?.name ?? entry.actor?.email ?? "Deleted user"}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {describeAuditAction(entry.action).toLowerCase()}
                      </span>
                    </p>
                    {changes ? (
                      <p className="truncate font-mono text-xs text-muted-foreground">{changes}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      <time dateTime={entry.createdAt.toISOString()}>
                        {formatDate(entry.createdAt, { hour: "numeric", minute: "2-digit" })}
                      </time>
                      {entry.ipAddress ? ` · ${entry.ipAddress}` : ""}
                      {" · "}
                      <code className="font-mono">{entry.action}</code>
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
          {cursor || nextCursor ? (
            <div className="flex justify-between border-t pt-4">
              {cursor ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/w/${context.organization.slug}/settings/audit-log`}>
                    Back to latest
                  </Link>
                </Button>
              ) : (
                <span />
              )}
              {nextCursor ? (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/w/${context.organization.slug}/settings/audit-log?cursor=${nextCursor}`}
                  >
                    Older events
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </SettingsSection>
  );
}
