import { Activity } from "lucide-react";

import { UserAvatar } from "@/components/shared/avatars";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { describeActivity } from "@/modules/activity/describe";
import type { RecentActivity } from "@/modules/activity/service";

export function ActivityFeed({ items }: { items: RecentActivity[] }) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>What your team has been doing in this workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description="Invitations, new members and changes to customers and projects will appear here."
            className="py-8"
          />
        ) : (
          <ol className="grid gap-4">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <UserAvatar
                  name={item.actor?.name}
                  email={item.actor?.email}
                  avatarUrl={item.actor?.avatarUrl}
                  className="size-7"
                />
                <div className="grid gap-0.5 text-sm">
                  <p>
                    <span className="font-medium">
                      {item.actor?.name ?? item.actor?.email ?? "Someone"}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {describeActivity(item.type, item.data as Record<string, unknown>)}
                    </span>
                  </p>
                  <time
                    dateTime={item.createdAt.toISOString()}
                    title={formatDate(item.createdAt, { hour: "numeric", minute: "2-digit" })}
                    className="text-xs text-muted-foreground"
                  >
                    {formatRelativeTime(item.createdAt)}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
