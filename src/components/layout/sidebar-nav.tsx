"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useShell } from "@/components/layout/shell-context";
import { SETTINGS_NAV_ITEM, WORKSPACE_NAV, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

function NavLink({
  item,
  base,
  onNavigate,
}: {
  item: NavItem;
  base: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const href = `${base}${item.path}`;
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const Icon = item.icon;

  const className = cn(
    "flex h-8 items-center gap-2.5 rounded-md px-2 text-sm transition-colors",
    active
      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
  );

  if (item.status === "soon") {
    return (
      <span
        className="flex h-8 cursor-default items-center gap-2.5 rounded-md px-2 text-sm text-sidebar-foreground/45"
        aria-disabled="true"
      >
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 truncate">{item.title}</span>
        <span className="rounded border border-sidebar-border px-1 text-[0.625rem] font-medium tracking-wide uppercase">
          Soon
        </span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
    >
      <Icon className={cn("size-4 shrink-0", active && "text-primary")} aria-hidden />
      <span className="truncate">{item.title}</span>
    </Link>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { workspace, can } = useShell();
  const base = `/w/${workspace.slug}`;

  return (
    <nav aria-label="Workspace" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-2">
      {WORKSPACE_NAV.map((section, index) => {
        const items = section.items.filter((item) => !item.permission || can(item.permission));
        if (items.length === 0) return null;
        return (
          <div key={section.title ?? index} className="grid gap-0.5">
            {section.title ? (
              <p className="px-2 pb-1 text-[0.6875rem] font-medium tracking-wide text-sidebar-foreground/55 uppercase">
                {section.title}
              </p>
            ) : null}
            {items.map((item) => (
              <NavLink key={item.path} item={item} base={base} onNavigate={onNavigate} />
            ))}
          </div>
        );
      })}
      <div className="mt-auto grid gap-0.5 pt-2">
        <NavLink item={SETTINGS_NAV_ITEM} base={base} onNavigate={onNavigate} />
      </div>
    </nav>
  );
}
