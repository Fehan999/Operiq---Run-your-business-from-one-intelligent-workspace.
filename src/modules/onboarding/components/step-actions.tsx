"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  completeOnboardingAction,
  continueOnboardingAction,
} from "@/modules/organizations/actions";

/** "Skip" / "Continue" for optional steps, and "Finish" on the last one. */
export function StepActions({
  slug,
  stepKey,
  variant,
}: {
  slug: string;
  stepKey: string;
  variant: "continue" | "finish";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => ReturnType<typeof continueOnboardingAction>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.push(result.data.redirectTo);
    });
  }

  if (variant === "finish") {
    return (
      <div className="flex justify-end">
        <Button
          size="lg"
          loading={pending}
          onClick={() => run(() => completeOnboardingAction(slug))}
        >
          Go to my dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="ghost"
        disabled={pending}
        onClick={() => run(() => continueOnboardingAction(slug, stepKey))}
      >
        Skip for now
      </Button>
      <Button loading={pending} onClick={() => run(() => continueOnboardingAction(slug, stepKey))}>
        Continue
      </Button>
    </div>
  );
}
