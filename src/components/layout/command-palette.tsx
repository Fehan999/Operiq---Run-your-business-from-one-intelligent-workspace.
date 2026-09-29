"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Building2,
  Monitor,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  UserRoundPlus,
  Zap,
} from "lucide-react";

import { useShell } from "@/components/layout/shell-context";
import { WorkspaceAvatar } from "@/components/shared/avatars";
import { Badge } from "@/components/ui/badge";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { SETTINGS_NAV, WORKSPACE_NAV } from "@/config/navigation";
import { detectCommandIntent, type CommandIntent } from "@/modules/command/intent";

const INTENT_COPY: Record<
  Exclude<CommandIntent, "navigate">,
  { label: string; icon: typeof Search }
> = {
  search: { label: "Search the workspace for", icon: Search },
  ask: { label: "Ask Operiq AI", icon: Sparkles },
  action: { label: "Have Operiq AI prepare", icon: Zap },
};

export function CommandPalette() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { workspace, workspaces, commandOpen, setCommandOpen, can } = useShell();
  const [query, setQuery] = useState("");
  const base = `/w/${workspace.slug}`;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setCommandOpen]);

  const detected = useMemo(() => detectCommandIntent(query), [query]);
  // Anything that isn't plain navigation is offered to the AI agent as well.
  const intentCopy =
    detected.intent !== "navigate" && detected.query.length > 0
      ? INTENT_COPY[detected.intent]
      : null;

  function go(href: string) {
    setCommandOpen(false);
    setQuery("");
    router.push(href);
  }

  const pages = WORKSPACE_NAV.flatMap((section) => section.items).filter(
    (item) => item.status === "ready" && (!item.permission || can(item.permission)),
  );
  const settings = SETTINGS_NAV.flatMap((group) => group.items).filter(
    (item) => item.status === "ready" && (!item.permission || can(item.permission)),
  );

  return (
    <CommandDialog
      open={commandOpen}
      onOpenChange={(open) => {
        setCommandOpen(open);
        if (!open) setQuery("");
      }}
      title="Command bar"
      description="Jump to a page, switch workspace, or ask Operiq"
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search, jump to a page, or ask a question..."
      />
      <CommandList>
        {intentCopy ? null : (
          <CommandEmpty>
            Nothing matches yet. Try a page name like &quot;members&quot;.
          </CommandEmpty>
        )}

        {intentCopy ? (
          <>
            <CommandGroup heading="Operiq AI" forceMount>
              <CommandItem value={`__intent__${query}`} disabled forceMount>
                <intentCopy.icon aria-hidden />
                <span className="truncate">
                  {intentCopy.label}{" "}
                  <span className="font-medium">&ldquo;{detected.query}&rdquo;</span>
                </span>
                <Badge variant="muted" className="ml-auto">
                  Soon
                </Badge>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        ) : null}

        <CommandGroup heading="Pages">
          {pages.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.path}
                value={`${item.title} ${item.keywords?.join(" ") ?? ""}`}
                onSelect={() => go(`${base}${item.path}`)}
              >
                <Icon aria-hidden />
                {item.title}
              </CommandItem>
            );
          })}
          {settings.map((item) => (
            <CommandItem
              key={item.path}
              value={`settings ${item.title} ${item.description}`}
              onSelect={() => go(`${base}${item.path}`)}
            >
              <Building2 aria-hidden />
              Settings: {item.title}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Actions">
          {can("members:invite") ? (
            <CommandItem
              value="invite teammates members people"
              onSelect={() => go(`${base}/settings/members?invite=1`)}
            >
              <UserRoundPlus aria-hidden />
              Invite teammates
            </CommandItem>
          ) : null}
          <CommandItem value="create new workspace" onSelect={() => go("/onboarding")}>
            <Plus aria-hidden />
            Create workspace
          </CommandItem>
          <CommandItem value="theme light mode" onSelect={() => setTheme("light")}>
            <Sun aria-hidden />
            Light theme
          </CommandItem>
          <CommandItem value="theme dark mode" onSelect={() => setTheme("dark")}>
            <Moon aria-hidden />
            Dark theme
          </CommandItem>
          <CommandItem value="theme system mode" onSelect={() => setTheme("system")}>
            <Monitor aria-hidden />
            System theme
          </CommandItem>
        </CommandGroup>

        {workspaces.length > 1 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Switch workspace">
              {workspaces
                .filter((item) => item.slug !== workspace.slug)
                .map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`workspace ${item.name}`}
                    onSelect={() => go(`/w/${item.slug}/dashboard`)}
                  >
                    <WorkspaceAvatar name={item.name} logoUrl={item.logoUrl} className="size-5" />
                    {item.name}
                    <CommandShortcut>Switch</CommandShortcut>
                  </CommandItem>
                ))}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
      <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <span>{detected.intent === "navigate" ? "Navigate" : `Detected: ${detected.intent}`}</span>
        <span className="flex items-center gap-1">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> to move <Kbd>↵</Kbd> to open <Kbd>Esc</Kbd> to close
        </span>
      </div>
    </CommandDialog>
  );
}
