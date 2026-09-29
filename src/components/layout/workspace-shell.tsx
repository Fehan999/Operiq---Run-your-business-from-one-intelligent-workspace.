"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Menu, Search } from "lucide-react";

import { CommandPalette } from "@/components/layout/command-palette";
import { NotificationBell, type BellNotification } from "@/components/layout/notification-bell";
import { ShellProvider, useShell, type ShellData } from "@/components/layout/shell-context";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <WorkspaceSwitcher />
      </div>
      <SidebarNav onNavigate={onNavigate} />
      <div className="border-t border-sidebar-border px-5 py-3">
        <Link
          href="/"
          className="opacity-70 transition-opacity hover:opacity-100"
          aria-label="Operiq website"
        >
          <Logo markClassName="size-5" className="[&>span:last-child]:text-sm" />
        </Link>
      </div>
    </div>
  );
}

const noopSubscribe = () => () => {};

function Topbar({
  notifications,
}: {
  notifications: { items: BellNotification[]; unreadCount: number };
}) {
  const { setCommandOpen, setMobileNavOpen } = useShell();
  const isMac = useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => false,
  );

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
      >
        <Menu aria-hidden />
      </Button>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="flex h-9 w-full max-w-md items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        aria-label="Open command bar"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 truncate text-left">Search or ask Operiq...</span>
        <span className="hidden items-center gap-0.5 sm:flex">
          <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <NotificationBell items={notifications.items} unreadCount={notifications.unreadCount} />
        <UserMenu />
      </div>
    </header>
  );
}

export function WorkspaceShell({
  data,
  notifications,
  children,
}: {
  data: ShellData;
  notifications: { items: BellNotification[]; unreadCount: number };
  children: React.ReactNode;
}) {
  return (
    <ShellProvider data={data}>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-background px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh">
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:block">
          <SidebarBody />
        </aside>
        <MobileSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar notifications={notifications} />
          <main
            id="main"
            className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
          >
            {children}
          </main>
        </div>
      </div>
      <CommandPalette />
    </ShellProvider>
  );
}

function MobileSidebar() {
  const { mobileNavOpen, setMobileNavOpen } = useShell();
  return (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">Workspace pages and settings</SheetDescription>
        <SidebarBody onNavigate={() => setMobileNavOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
