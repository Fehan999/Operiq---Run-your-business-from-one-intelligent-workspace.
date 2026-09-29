"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";

import { useShell } from "@/components/layout/shell-context";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/modules/notifications/actions";

export interface BellNotification {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationBell({
  items,
  unreadCount,
}: {
  items: BellNotification[];
  unreadCount: number;
}) {
  const router = useRouter();
  const { workspace } = useShell();
  const [, startTransition] = useTransition();
  const [optimistic, applyOptimistic] = useOptimistic(
    { items, unreadCount },
    (state, action: { type: "read"; id: string } | { type: "readAll" }) => {
      const now = new Date().toISOString();
      if (action.type === "readAll") {
        return {
          unreadCount: 0,
          items: state.items.map((item) => ({ ...item, readAt: item.readAt ?? now })),
        };
      }
      const target = state.items.find((item) => item.id === action.id);
      if (!target || target.readAt) return state;
      return {
        unreadCount: Math.max(0, state.unreadCount - 1),
        items: state.items.map((item) => (item.id === action.id ? { ...item, readAt: now } : item)),
      };
    },
  );

  function open(item: BellNotification) {
    startTransition(async () => {
      applyOptimistic({ type: "read", id: item.id });
      await markNotificationReadAction(workspace.slug, item.id);
    });
    if (item.link) router.push(item.link);
  }

  function markAll() {
    startTransition(async () => {
      applyOptimistic({ type: "readAll" });
      await markAllNotificationsReadAction(workspace.slug);
    });
  }

  const label =
    optimistic.unreadCount > 0
      ? `Notifications, ${optimistic.unreadCount} unread`
      : "Notifications";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative" aria-label={label}>
          <Bell aria-hidden />
          {optimistic.unreadCount > 0 ? (
            <span className="absolute top-1 right-1 flex size-2 rounded-full bg-primary ring-2 ring-background" />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {optimistic.unreadCount > 0 ? (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={markAll}>
              <CheckCheck aria-hidden />
              Mark all read
            </Button>
          ) : null}
        </div>
        {optimistic.items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium">You&apos;re all caught up</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Mentions, approvals and team updates will show up here.
            </p>
          </div>
        ) : (
          <ul className="max-h-96 divide-y overflow-y-auto">
            {optimistic.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => open(item)}
                  className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      item.readAt ? "bg-transparent" : "bg-primary",
                    )}
                    aria-hidden
                  />
                  <span className="grid gap-0.5">
                    <span className={cn("text-sm", !item.readAt && "font-medium")}>
                      {item.title}
                    </span>
                    {item.body ? (
                      <span className="text-xs text-muted-foreground">{item.body}</span>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
