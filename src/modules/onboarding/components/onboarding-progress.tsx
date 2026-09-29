import { cn } from "@/lib/utils";
import { ONBOARDING_STEPS } from "@/modules/onboarding/steps";

/** Step indicator. The workspace itself counts as the first, already finished step. */
export function OnboardingProgress({ currentIndex }: { currentIndex: number }) {
  const total = ONBOARDING_STEPS.length + 1;
  const position = currentIndex + 2;

  return (
    <div className="grid gap-3">
      <p className="text-sm font-medium text-primary">
        Step {position} of {total}
      </p>
      <ol className="flex gap-1.5" aria-label="Setup progress">
        <li className="h-1.5 flex-1 rounded-full bg-primary" aria-label="Workspace created" />
        {ONBOARDING_STEPS.map((step, index) => (
          <li
            key={step.key}
            aria-label={step.title}
            aria-current={index === currentIndex ? "step" : undefined}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              index <= currentIndex ? "bg-primary" : "bg-border",
            )}
          />
        ))}
      </ol>
      <span className="sr-only">
        {position - 1} of {total} steps complete
      </span>
    </div>
  );
}
