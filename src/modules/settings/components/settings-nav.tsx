"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useShell } from "@/components/layout/shell-context";
import { SETTINGS_NAV } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function SettingsNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const { can } = useShell();
  const base = `/w/${slug}`;

  return (
    <nav
      aria-label="Settings"
      className="-mx-1 flex gap-6 overflow-x-auto px-1 pb-1 lg:mx-0 lg:grid lg:content-start lg:overflow-visible lg:px-0"
    >
      {SETTINGS_NAV.map((group) => (
        <div key={group.title} className="grid shrink-0 content-start gap-0.5">
          <p className="px-2 pb-1 text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
            {group.title}
          </p>
          <div className="flex gap-0.5 lg:grid">
            {group.items
              .filter((item) => !item.permission || can(item.permission))
              .map((item) => {
                const href = `${base}${item.path}`;
                const active = pathname === href;
                if (item.status === "soon") {
                  return (
                    <span
                      key={item.path}
                      aria-disabled="true"
                      className="flex h-8 items-center justify-between gap-2 rounded-md px-2 text-sm whitespace-nowrap text-muted-foreground/60"
                    >
                      {item.title}
                      <span className="text-[0.625rem] font-medium tracking-wide uppercase">
                        Soon
                      </span>
                    </span>
                  );
                }
                return (
                  <Link
                    key={item.path}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-8 items-center rounded-md px-2 text-sm whitespace-nowrap transition-colors",
                      active
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    {item.title}
                  </Link>
                );
              })}
          </div>
        </div>
      ))}
    </nav>
  );
}
