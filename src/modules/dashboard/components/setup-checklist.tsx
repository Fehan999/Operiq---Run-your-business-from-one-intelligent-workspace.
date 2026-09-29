import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ChecklistItem } from "@/modules/dashboard/insights";

export function SetupChecklist({ items }: { items: ChecklistItem[] }) {
  const done = items.filter((item) => item.done).length;
  const percent = Math.round((done / items.length) * 100);

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Finish setting up</CardTitle>
        <CardDescription>
          {done} of {items.length} done. A complete workspace makes invoices, reports and the AI
          agent more useful.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Setup progress"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
        <ul className="grid gap-1">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent"
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border",
                    item.done && "border-primary bg-primary text-primary-foreground",
                  )}
                  aria-hidden
                >
                  {item.done ? <Check className="size-3" /> : null}
                </span>
                <span className={cn("flex-1", item.done && "text-muted-foreground line-through")}>
                  {item.label}
                </span>
                <span className="sr-only">{item.done ? "Done" : "Not done"}</span>
                {item.done ? null : (
                  <ChevronRight
                    className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
