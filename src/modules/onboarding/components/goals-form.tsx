"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { BUSINESS_GOALS } from "@/config/workspace-options";
import { cn } from "@/lib/utils";
import { saveGoalsAction } from "@/modules/organizations/actions";

export function GoalsForm({
  slug,
  initialGoals,
  mode,
}: {
  slug: string;
  initialGoals: string[];
  mode: "onboarding" | "settings";
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(initialGoals);
  const [pending, startTransition] = useTransition();

  function toggle(value: string) {
    setSelected((current) =>
      current.includes(value) ? current.filter((goal) => goal !== value) : [...current, value],
    );
  }

  function submit() {
    startTransition(async () => {
      const result = await saveGoalsAction(
        slug,
        { goals: selected },
        { onboarding: mode === "onboarding" },
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.data.redirectTo) router.push(result.data.redirectTo);
      else {
        toast.success("Goals saved.");
        router.refresh();
      }
    });
  }

  return (
    <div className="grid gap-5">
      <div role="group" aria-label="Business goals" className="grid gap-2 sm:grid-cols-2">
        {BUSINESS_GOALS.map((goal) => {
          const checked = selected.includes(goal.value);
          return (
            <button
              key={goal.value}
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() => toggle(goal.value)}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                checked ? "border-primary bg-primary/6" : "hover:bg-accent",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                  checked && "border-primary bg-primary text-primary-foreground",
                )}
                aria-hidden
              >
                {checked ? <Check className="size-3" /> : null}
              </span>
              <span>
                <span className="block text-sm font-medium">{goal.label}</span>
                <span className="block text-xs text-muted-foreground">{goal.description}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button onClick={submit} loading={pending}>
          {mode === "onboarding" ? "Continue" : "Save goals"}
        </Button>
      </div>
    </div>
  );
}
