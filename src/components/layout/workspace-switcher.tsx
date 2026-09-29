"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { useShell } from "@/components/layout/shell-context";
import { WorkspaceAvatar } from "@/components/shared/avatars";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_DETAILS } from "@/lib/authorization/permissions";

export function WorkspaceSwitcher() {
  const router = useRouter();
  const { workspace, workspaces, role } = useShell();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors outline-none hover:bg-sidebar-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:bg-sidebar-accent"
        aria-label={`Current workspace: ${workspace.name}. Switch workspace`}
      >
        <WorkspaceAvatar name={workspace.name} logoUrl={workspace.logoUrl} className="size-8" />
        <span className="grid min-w-0 flex-1 leading-tight">
          <span className="truncate text-sm font-semibold">{workspace.name}</span>
          <span className="truncate text-xs text-muted-foreground">{ROLE_DETAILS[role].label}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>
        {workspaces.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onSelect={() => {
              if (item.slug !== workspace.slug) router.push(`/w/${item.slug}/dashboard`);
            }}
            className="gap-2.5"
          >
            <WorkspaceAvatar name={item.name} logoUrl={item.logoUrl} className="size-6" />
            <span className="flex-1 truncate">{item.name}</span>
            {item.slug === workspace.slug ? (
              <Check className="size-4 text-primary" aria-hidden />
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/onboarding">
            <Plus aria-hidden />
            Create workspace
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
