import Link from "next/link";
import { ArrowRight, CircleCheck, Info, TriangleAlert } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Insight } from "@/modules/dashboard/insights";

const TONE = {
  info: { icon: Info, className: "bg-info/10 text-info" },
  warning: { icon: TriangleAlert, className: "bg-warning/15 text-amber-700 dark:text-warning" },
  success: { icon: CircleCheck, className: "bg-success/12 text-success" },
} as const;

export function InsightsCard({ insights }: { insights: Insight[] }) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Needs your attention</CardTitle>
        <CardDescription>
          Calculated from your workspace data, refreshed on every visit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2">
          {insights.map((insight) => {
            const tone = TONE[insight.tone];
            const Icon = tone.icon;
            const body = (
              <>
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-md",
                    tone.className,
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="grid flex-1 gap-0.5">
                  <span className="text-sm font-medium">{insight.title}</span>
                  <span className="text-xs text-muted-foreground">{insight.detail}</span>
                </span>
                {insight.href ? (
                  <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                ) : null}
              </>
            );
            return (
              <li key={insight.id}>
                {insight.href ? (
                  <Link
                    href={insight.href}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 p-2">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
