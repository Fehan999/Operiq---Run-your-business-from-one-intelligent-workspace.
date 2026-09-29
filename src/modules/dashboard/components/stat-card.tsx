import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
}) {
  return (
    <Card className="gap-2 p-4 sm:gap-3 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">{value}</p>
      {hint ? <p className="line-clamp-2 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}
