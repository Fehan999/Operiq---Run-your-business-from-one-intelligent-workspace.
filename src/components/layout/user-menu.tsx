"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { LogOut, Monitor, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";

import { useShell } from "@/components/layout/shell-context";
import { UserAvatar } from "@/components/shared/avatars";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSignOut } from "@/modules/auth/hooks/use-sign-out";

export function UserMenu() {
  const { user, workspace } = useShell();
  const { setTheme } = useTheme();
  const { signOut, pending } = useSignOut();
  const base = `/w/${workspace.slug}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        aria-label="Account menu"
      >
        <UserAvatar
          name={user.name}
          email={user.email}
          avatarUrl={user.avatarUrl}
          className="size-8"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="grid font-normal">
          <span className="truncate text-sm font-medium">{user.name ?? "Your account"}</span>
          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={`${base}/settings/profile`}>
              <UserRound aria-hidden />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`${base}/settings/security`}>
              <ShieldCheck aria-hidden />
              Security
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Sun aria-hidden />
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={() => setTheme("light")}>
                <Sun aria-hidden /> Light
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTheme("dark")}>
                <Moon aria-hidden /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTheme("system")}>
                <Monitor aria-hidden /> System
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={pending}
          onSelect={(event) => {
            event.preventDefault();
            void signOut();
          }}
        >
          <LogOut aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
